# Deployment

This documents outlines a way to deploy the regkg-rcreg project.

## Context

This is intended to be a set of example instructions for a typical deployment of the Regulatory Knowledge Graph, suitable for small non-containerized deployments, or developers who are "hacking on it".

The instructions assume that you are running an Ubuntu server on a network behind a firewall, that you have access to connect to the Internet over HTTPS, and that you have sudo rights on the host. If you intend to deploy this to face the Internet, we strongly recommend putting the NGINX service on a separate host.

Execute each command individually.

### Step 0: Prerequisites
```
sudo apt update
sudo apt dist-upgrade
sudo apt install docker.io openjdk-17-jre curl git
```

### Step 1: SOLR Installation

We download a recent buid of Apache SOLR from the ASF, unpack it, and install it as a service. This creates a user named `solr` on the system.
```
export SOLR_VER="8.11.0"
curl -O https://downloads.apache.org/lucene/solr/${SOLR_VER}/solr-${SOLR_VER}.tgz
tar -xzvf solr-${SOLR_VER}.tgz
sudo solr-${SOLR_VER}/bin/install_solr_service.sh ./solr-${SOLR_VER}.tgz
```

The SOLR Service runs on port 8983 by default. Next, we create a solr context named "kg".
```
sudo su - solr -c "/opt/solr/bin/solr create -c kg -n data_driven_schema_configs" 
```

Next, we do a similar installation for Apache Jena Fuseki. Fuseki doesn't have quite as nice a service installer so we have to do a few more steps by hand:
```
sudo adduser fuseki
cd /home/fuseki
sudo -u fuseki bash
wget "https://dlcdn.apache.org/jena/binaries/apache-jena-fuseki-4.2.0.tar.gz"
tar -xzvf apache-jena-fuseki-4.2.0.tar.gz
exit
sudo cp apache-jena-fuseki-4.2.0/fuseki.service /etc/systemd/system/fuseki.service 
```

Now, as root (or via sudo) edit /etc/systemd/system/fuseki.service so that the `[Unit]` and `[Service]` sections are as follows:
```
[Unit]
Description=Fuseki

[Service]
# Edit environment variables to match your installation
Environment=FUSEKI_HOME=/home/fuseki/apache-jena-fuseki-4.2.0
Environment=FUSEKI_BASE=/home/fuseki/apache-jena-fuseki-4.2.0
# Edit the line below to adjust the amount of memory allocated to Fuseki
Environment=JVM_ARGS=-Xmx4G
# Edit to match your installation
ExecStart=/home/fuseki/apache-jena-fuseki-4.2.0/fuseki-server --file /tmp/kgwork/out.ttl /name 
```

Finally, update the systemd daemon profiles and enable the fuseki service.
```
sudo systemctl daemon-reload
sudo systemctl enable fuseki.service
```

Note that the fuseki service will complain that it can't start -- this is normal at this stage because we've not yet provided it with a model to serve.
By default, fuseki listens on port 3030.

### Step 2: Building and deploying the models

Create a Bash script with content like the following, adjusting to your needs:

```
#!/usr/bin/bash

# Set up failure traps
# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command failed with exit code $?."' EXIT

echo "Starting fresh build of Knowledge Graph."
cd /tmp
rm -rf kgwork
mkdir kgwork
cd kgwork
# Pull a copy of the KG from wherever you prefer. The command below pulls from the head of the public repo.
git clone --depth 1 -b main "https://github.com/csps-efpc/regkg-rcreg.git"
cd regkg-rcreg
DOCKER_BUILDKIT=1 docker build --file Dockerfile --output target .
DOCKER_BUILDKIT=1 docker build --file front-end/Dockerfile --output target front-end
cp -r target/* ..
cd ..
rm -rf regkg-rcreg
echo "Emitted artifacts: "
echo `ls /tmp/kgwork`
echo "Finished creating artifacts"
echo "Uploading search index"
/opt/solr/bin/post -c kg -type text/xml -out yes -d "<delete><query>*:*</query></delete>"
/opt/solr/bin/post -c kg /tmp/kgwork/out.json
echo "Restarting SPARQL service"
systemctl restart fuseki.service

# OPTIONAL - if you're looking to deploy the front-end as well, you can deploy 
# it to a local web server with something like the following:
echo "Deploying front-end"
rm -rf /usr/share/jetty9/webapps/root/regkg
mkdir /usr/share/jetty9/webapps/root/regkg
cp -r /tmp/kgwork/static /usr/share/jetty9/webapps/root/regkg/
cp /tmp/kgwork/index.html /usr/share/jetty9/webapps/root/regkg/

# Clear traps
trap - EXIT
trap - DEBUG
exit
```