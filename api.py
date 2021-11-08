import flask
import psycopg2
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
# from models import db, Pmsys_model

app = flask.Flask(__name__, static_folder="/", static_url_path="")

conn = psycopg2.connect(
    host="localhost", 
    database="pmsysdb", 
    user="postgres",
    password="password") 

cur = conn.cursor()

cur.execute('SELECT version()')
db_test = cur.fetchone()
print(db_test)
cur.close()


@app.route("/")
def initiate():
    return flask.render_template("stats.html")

@app.route("/api/stats", methods=["GET"])
def getStats():
    cur = conn.cursor()
    cur.execute("SELECT DATE(created), count(*) FROM datapoints WHERE schema_name='wellness' GROUP BY DATE(created) ORDER BY DATE(created) LIMIT 50;")
    db_query = cur.fetchall()

    json = flask.jsonify(db_query)
    return json

@app.route("/api/stat", methods=["GET"])
def getReportStat():
    args1 = flask.request.args.get("report")
    args2 = flask.request.args.get("start_time")
    args4 = flask.request.args.get("end_time")
    args3 = flask.request.args.get("team")
    print("Checking reports for {}, start-time {}, end-time {}, team {}".format(args1, args2, args4, args3))
    cur = conn.cursor()

    cur.execute("SELECT DATE(created), count(*) FROM datapoints WHERE schema_name='{}' AND created>='{}' AND created<='{}' AND owner LIKE '%{}%' GROUP BY DATE(created) ORDER BY DATE(created);".format(args1, args2, args4, args3))

    db_query = cur.fetchall()
    return flask.jsonify(db_query)

@app.route("/api/stat/absence", methods=["GET"])
def getAbsenceReport():
    args1 = flask.request.args.get("team")
    args2 = flask.request.args.get("date")
    args3 = flask.request.args.get("schema")

    cur = conn.cursor()

    cur.execute("SELECT owner FROM datapoints WHERE schema_name='{}' AND owner LIKE '%{}%' AND to_date(CAST(created as char(10)), 'YYYY-MM-DD') ='{}' ORDER BY(owner);".format(args3, args1, args2))

    db_query = cur.fetchall()
    return flask.jsonify(db_query)


if __name__ == '__main__':
    app.run()