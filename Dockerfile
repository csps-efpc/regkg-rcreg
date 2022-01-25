# syntax=docker/dockerfile:1

FROM maven:3.8.3-openjdk-17 AS build

COPY src /home/app/src
COPY csv /home/app/csv
COPY rdf /home/app/rdf
COPY pom.xml /home/app

RUN mvn -f /home/app/pom.xml clean install site

FROM scratch AS export-stage
COPY --from=build /home/app/target/out.json ./
COPY --from=build /home/app/target/out.sqlite3 ./
COPY --from=build /home/app/target/out.ttl ./
COPY --from=build /home/app/target/site ./site