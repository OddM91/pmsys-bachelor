#! /bin/bash

docker run -d --rm --network isekai --name pyback-pmsys -p 5000:5000 -v $(pwd)/api.py:/app/api.py -v $(pwd)/templates/:/app/templates -t pmsys_backend python /app/api.py
