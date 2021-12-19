# syntax=docker/dockerfile:1
FROM python:3
RUN mkdir /app
WORKDIR /app

ENV FLASK_APP=api.py
ENV FLASK_RUN_HOST=0.0.0.0

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 5000
EXPOSE 5432
EXPOSE 80
COPY . /app
CMD [ "flask", "run" ]
