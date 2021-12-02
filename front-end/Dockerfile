# syntax=docker/dockerfile:1

FROM node:lts-alpine AS build

COPY public /home/app/public
COPY src /home/app/src
COPY package-lock.json /home/app/
COPY package.json /home/app/

WORKDIR "/home/app/"

RUN npm install

RUN npm run build

FROM scratch  AS export-stage

COPY --from=build /home/app/build/ ./
