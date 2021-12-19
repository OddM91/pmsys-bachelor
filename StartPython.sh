#! /bin/bash

port=$1

docker run -d -it --rm --network isekai --name pyback-pmsys -p $port:$port -v $(pwd)/api.py:/app/api.py -v $(pwd)/templates/:/app/templates -t pmsys_backend python /app/api.py
