# syntax=docker/dockerfile:1
FROM postgres
ENV POSTGRES_PASSWORD pass123
ENV POSTGRES_DB pmsysdb
COPY datapoints_table.sql /docker-entrypoint-initdb.d/
COPY data.sql /docker-entrypoint-initdb.d/
EXPOSE 5432
