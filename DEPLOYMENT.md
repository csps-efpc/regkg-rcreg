# Deployment

This documents outlines a way to deploy the regkg-rcreg project.

## Context

This is intended to be a set of example instructions for a typical deployment of
the Regulatory Knowledge Graph, suitable for small non-containerized 
deployments, or developers who are "hacking on it".

The instructions assume that you are running an Ubuntu server on a network 
behind a firewall, that you have access to connect to the Internet over HTTPS, 
and that you have sudo rights on the host. If you intend to deploy this to face
the Internet, we strongly recommend putting the NGINX service on a separate
host.

Execute each command individually.

### Step 0: Prerequisites
```
sudo apt update
sudo apt dist-upgrade
sudo apt install docker.io openjdk-17-jre curl git jetty9
```

### Step 1: SOLR, Jena Fuseki, and Jetty Installation

We download a recent buid of Apache SOLR from the ASF, unpack it, and install it 
as a service. This creates a user named `solr` on the system.

```
export SOLR_VER="8.11.1"
curl -O https://downloads.apache.org/lucene/solr/${SOLR_VER}/solr-${SOLR_VER}.tgz
tar -xzvf solr-${SOLR_VER}.tgz
sudo solr-${SOLR_VER}/bin/install_solr_service.sh ./solr-${SOLR_VER}.tgz
```

The SOLR Service runs on port 8983 by default. Next, we create a solr context named "kg".

```
sudo su - solr -c "/opt/solr/bin/solr create -c kg -n data_driven_schema_configs" 
```

Next, we do a similar installation for Apache Jena Fuseki. Fuseki doesn't have 
quite as nice a service installer so we have to do a few more steps by hand:

```
sudo adduser fuseki
cd /home/fuseki
sudo -u fuseki bash
wget "https://dlcdn.apache.org/jena/binaries/apache-jena-fuseki-4.3.2.tar.gz"
tar -xzvf apache-jena-fuseki-4.3.2.tar.gz
exit
sudo cp apache-jena-fuseki-4.3.2/fuseki.service /etc/systemd/system/fuseki.service 
```

Now, as root (or via sudo) edit /etc/systemd/system/fuseki.service so that the 
`[Unit]` and `[Service]` sections are as follows:

```
[Unit]
Description=Fuseki

[Service]
# Edit environment variables to match your installation
Environment=FUSEKI_HOME=/home/fuseki/apache-jena-fuseki-4.3.2
Environment=FUSEKI_BASE=/home/fuseki/apache-jena-fuseki-4.3.2
# Edit the line below to adjust the amount of memory allocated to Fuseki
Environment=JVM_ARGS=-Xmx4G
# Edit to match your installation
ExecStart=/home/fuseki/apache-jena-fuseki-4.3.2/fuseki-server --file /tmp/kgwork/out.ttl /name 
```

Next, update the systemd daemon profiles and enable the fuseki service.

```
sudo systemctl daemon-reload
sudo systemctl enable fuseki.service
```

Note that the fuseki service will complain that it can't start -- this is normal
at this stage because we've not yet provided it with a model to serve.
By default, fuseki listens on port 3030.

Finally, we alter the permissions of the Jetty root so our deploy script can post 
the GUI there. By default, Jetty serves on port 8080.
```
sudo chmod a+w /usr/share/jetty9/webapps/root
```

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
# Pull a copy of the KG from wherever you prefer. The command below pulls from 
# the head of the public repo.
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

At this point, your SOLR and fuseki services should be up and running. 
Point a browser at each of `http://yourserver:3030/dataset.html?tab=query&ds=/name` 
, `http://yourserver:8983/solr/#/kg/core-overview`, and optionally 
http://yourserver:8080 to confirm that all services are up and running.

### Step 3: Configuring NGINX

To install nginx as a service on Ubuntu:

```
sudo apt install nginx
```

The simplest local-only, unencrypted NGINX configuration that can go in 
`/etc/nginx/sites-enabled/default` is:

```
server {
	listen 80 default_server;
	listen [::]:80 default_server;
        
        location / {
		proxy_pass http://localhost:8080;
	}
        location /sparql {
                proxy_pass http://localhost:3030/name/sparql;
        }
        location /search {
                proxy_pass http://localhost:8983/solr/kg/select;
        }

}
```
To apply your changes, execute:
```
sudo service nginx restart
```

If you plan to expose the service to the Internet, we recommend using your NGINX
instance as an HTTPS terminator. A service like letsencrypt can take care of
certificate requestion, scheduled rotation, and more. 

An excellent introduction can be found here: 
https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/

Once your HTTPS termination has been set up, you can revise yor NGINX config as 
follows in: `/etc/nginx/sites-enabled/default`. Note that the first server 
block redirects all requests back to the same hostname over HTTPS.

```
server {
	listen 80 default_server;
	listen [::]:80 default_server;
        server_name _;

	location / {
		return 301 https://$host$request_uri;
	}
}

server {
  listen 443 ssl http2;
  server_name your.public.domain.name;
  ssl on;

[... all the auto-configured SSL stuff ...]

index index.html index.htm;

	location / {
		proxy_pass http://localhost:8080;
	}
        location /sparql {
                proxy_pass http://localhost:3030/name/sparql;
        }
        location /search {
                proxy_pass http://localhost:8983/solr/kg/select;
        }

}

```

If you intend to apply authentication to the services, use NGINX as an 
authentication terminator as well. A simple HTTP Basic example would be to add 
the following lines to each of the HTTPS `location` blocks.

**Never add these to the non-HTTPS location blocks, as credentials will be 
sent in plain text.**

```
auth_basic "regkg-rcreg";
auth_basic_user_file /etc/nginx/.htpasswd;
proxy_set_header X-Forwarded-User $remote_user;
```
