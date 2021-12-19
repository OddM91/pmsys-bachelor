#! /bin/bash

docker network create isekai
docker build -t pmsys_backend .
docker build -t postgres-pmsys ./db/ 