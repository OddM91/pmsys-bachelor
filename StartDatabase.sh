#! /bin/bash

docker run -d -it --rm --network isekai --name postgres-odd -p 5432:5432 postgres-pmsys