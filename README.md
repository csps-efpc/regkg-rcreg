# regkg-rcreg
Regulatory Knowledge Graph - Réseau de connaissances reglementaire

This project is a demonstration project, serving as a model for methods to collect and link data from a variety of sources into a single RDF model, then write that model as a packed Turtle (TTL) file. 

To demonstrate that the output format need not be restricted to RDF native formats, the project emits a SQLite 3 packed and optimized data file as well. The file meets the conditions to be used client-side with phiresky's WASM-based SQLite3 implementation, as well as any of the other native implementations out there.

Because the business domain chosen (Canadian Federal Regulations) is text-rich, the same process take the opportunity to create a text index of the instruments it assembles in a simple JSON format that just happens to be the same format expected by Apache SOLR. A simple example of a SOLR schema is inclded in the root of the repository. 

## Building Data Files
Building this project requires Java 17 and Maven to be on your command line path.
```
mvn clean install
```

Building can be completed with Docker 18.09 as it uses [BuildKit](https://docs.docker.com/develop/develop-images/build_enhancements/)
```
DOCKER_BUILDKIT=1 docker build --file Dockerfile --output target .
```

Following the build, the output models can be found in `target/out.ttl`, `target/out.sqlite3`, and `target/out.json`.


## Build Front End HTML with Docker

To build the project with Docker, use version 18.09 or higher as it uses [BuildKit](https://docs.docker.com/develop/develop-images/build_enhancements/)

Run `DOCKER_BUILDKIT=1 docker build --file Dockerfile --output build .` to build the project.

Following the build, the static HTML files will be output in the build folder.

For more information on running the front end, see the [Read Me](front-end/README.md).
