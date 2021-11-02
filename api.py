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
def hello():
    print("Trying to render Stats")
    return flask.render_template("stats.html")

@app.route("/api/stats", methods=["GET"])
def getStats():
    cur = conn.cursor()
    cur.execute("SELECT DATE(created), count(*) FROM datapoints WHERE schema_name='wellness' GROUP BY DATE(created) ORDER BY DATE(created) LIMIT 50;")
    db_query = cur.fetchall()
    print(db_query)
    print(""" 
    ----------------------------
    """)
    json = flask.jsonify(db_query)
    print(json)
    return json

@app.route("/api/stat", methods=["GET"])
def getReportStat():
    args1 = flask.request.args.get("report")
    args2 = flask.request.args.get("start_time")
    args4 = flask.request.args.get("end_time")
    args3 = flask.request.args.get("team")
    print("Checking reports for {}, start-time {}, end-time {}, team {}".format(args1, args2, args4, args3))
    cur = conn.cursor()

    cur.execute("SELECT DATE(created), count(*) FROM datapoints WHERE schema_name='{}' AND created>='{}' AND created<='{}' GROUP BY DATE(created) ORDER BY DATE(created);".format(args1, args2, args4))

    db_query = cur.fetchall()
    return flask.jsonify(db_query)

if __name__ == '__main__':
    app.run()