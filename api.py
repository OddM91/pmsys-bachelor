import flask
import psycopg2

app = flask.Flask(__name__, static_folder="/", static_url_path="")

conn = psycopg2.connect(
    host="postgres-odd", 
    database="pmsysdb", 
    user="postgres",
    password="pass123") 

cur = conn.cursor()

cur.execute('SELECT version()')
db_test = cur.fetchone()
print(db_test)
cur.close()


@app.route("/")
def version1():
    return flask.render_template("stats.html")

@app.route("/version2")
def version2():
    return flask.render_template("stats2.html")

@app.route("/version3")
def version3():
    return flask.render_template("stats3.html")

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
    args5 = flask.request.args.get("ignore")
    print("Printing ignore input: {}".format(args5))
    ignored = args5.split(",")
    print("Printing handled ignores: {}".format(ignored))

    reports = args1.split(",")

    print("Checking reports for {}, start-time {}, end-time {}, team {}".format(reports, args2, args4, args3))
    cur = conn.cursor()
    all_data = []

    ignore_string = "("
    for i in ignored:
        ignore_string += "'" + i + "'"
        if i != ignored[-1]:
            ignore_string += ", "
    ignore_string += ")"
    print("SQL ready ignore list: {}".format(ignore_string))

    for r in reports:
        cur.execute("SELECT DATE(created), count(DISTINCT owner) FROM datapoints WHERE schema_name='{}' AND created>='{}' AND created<='{}' AND owner LIKE '%{}%' AND owner NOT IN {} GROUP BY DATE(created) ORDER BY DATE(created);".format(r, args2, args4, args3, ignore_string))
        db_query = cur.fetchall()
        db_query.insert(0, r)
        all_data.append(db_query)

    return flask.jsonify(all_data)

@app.route("/api/stat/onlyabsent", methods=["GET"])
def getReportStatOnlyAbsent():
    args1 = flask.request.args.get("report")
    args2 = flask.request.args.get("start_time")
    args4 = flask.request.args.get("end_time")
    args3 = flask.request.args.get("team")
    args5 = flask.request.args.get("ignore")
    print("Printing ignore input: {}".format(args5))
    ignored = args5.split(",")
    reports = args1.split(",")

    ignore_string = "("
    for i in ignored:
        ignore_string += "'" + i + "'"
        if i != ignored[-1]:
            ignore_string += ", "
    ignore_string += ")"
    print("SQL ready ignore list: {}".format(ignore_string))

    cur = conn.cursor()
    all_data = []
    cur.execute("SELECT count(DISTINCT owner) FROM datapoints WHERE owner LIKE '%{}%' AND owner NOT IN {} ".format(args3, ignore_string))
    team_size = cur.fetchall()
    size = team_size[0][0]

    for r in reports: 
        cur.execute("SELECT DATE(created), count(DISTINCT owner) FROM datapoints WHERE schema_name='{}' AND created>='{}' AND created<='{}' AND owner LIKE '%{}%' AND owner NOT IN {} GROUP BY DATE(created) ORDER BY DATE(created);".format(r, args2, args4, args3, ignore_string))
        db_query = cur.fetchall()
        
        db_list = [list(i) for i in db_query]  # Converts to list. I can not change a tuple which is what the queries gets me. 

        for data in db_list:
            data[1] = int(size) - int(data[1])
        
        db_list.insert(0, r)
        all_data.append(db_list)

    return flask.jsonify(all_data)


@app.route("/api/stat/absence/name", methods=["GET"])
def getAbsenceReport():
    args1 = flask.request.args.get("team")
    args2 = flask.request.args.get("date")
    args3 = flask.request.args.get("schema")
    reports = args3.split(",")
    print("Query for Date: {}, Team: {}, Schema: {}".format(args2, args1, reports))

    cur = conn.cursor()
    all_data = []

    for r in reports:
        cur.execute("""SELECT DISTINCT owner
            FROM datapoints
            WHERE owner LIKE '%{}%'
            EXCEPT
            SELECT DISTINCT owner 
            FROM datapoints 
            WHERE schema_name='{}' AND owner LIKE '%{}%' AND to_date(CAST(created as char(10)), 'YYYY-MM-DD') ='{}' 
            ORDER BY(owner);""".format(args1, r, args1, args2))

        db_query = cur.fetchall()
        all_data.append(db_query)

    return flask.jsonify(all_data)

@app.route("/api/stat/absence/name/all", methods=["GET"])
def getAllNamesForReport():
    args1 = flask.request.args.get("team")
    args2 = flask.request.args.get("date")
    args3 = flask.request.args.get("schema")
    reports = args3.split(",")
    print("Query for Date: {}, Team: {}, Schema: {}".format(args2, args1, reports))
    args5 = flask.request.args.get("ignore")
    print("Printing ignore input: {}".format(args5))
    ignored = args5.split(",")

    ignore_string = "("
    for i in ignored:
        ignore_string += "'" + i + "'"
        if i != ignored[-1]:
            ignore_string += ", "
    ignore_string += ")"
    print("SQL ready ignore list: {}".format(ignore_string))

    cur = conn.cursor()
    all_data = []

    for r in reports:
        cur.execute("""SELECT DISTINCT owner
            FROM datapoints
            WHERE owner LIKE '%{}%' AND owner NOT IN {}
            EXCEPT
            SELECT DISTINCT owner 
            FROM datapoints 
            WHERE schema_name='{}' AND owner LIKE '%{}%' AND to_date(CAST(created as char(10)), 'YYYY-MM-DD') ='{}' AND owner NOT IN {}  
            ORDER BY(owner);""".format(args1, ignore_string, r, args1, args2, ignore_string))

        db_query = cur.fetchall()
        # This adds all that DIDN'T report
        all_data.append(db_query)

        cur.execute("""SELECT DISTINCT owner 
            FROM datapoints 
            WHERE schema_name='{}' AND owner LIKE '%{}%' AND to_date(CAST(created as char(10)), 'YYYY-MM-DD') ='{}' AND owner NOT IN {} 
            ORDER BY(owner);""".format( r, args1, args2, ignore_string))

        db_query = cur.fetchall()
        # This adds all that DID report
        all_data.append(db_query)
        print(all_data)

    return flask.jsonify(all_data)

@app.route("/api/stat/report/today", methods=["GET"])
def getTodaysReport():
    args1 = flask.request.args.get("team")
    args2 = flask.request.args.get("date")
    args3 = flask.request.args.get("reports")
    reports = args3.split(",")
    print("Input Reports: {}".format(reports))
    #reports = ["wellness", "participation", "srpe"]

    cur = conn.cursor()
    all_data = []

    cur.execute("""SELECT DISTINCT owner
            FROM datapoints
            WHERE owner LIKE '%{}%'""".format(args1))

    db_query = cur.fetchall()

    db_list = [list(i) for i in db_query]  # Converts to list. I can not change a tuple which is what the queries gets me.

    # Fills the list with the name of all players.
    for n in db_list:
        all_data.append(n)


    for r in reports:
        cur.execute("""SELECT DISTINCT owner 
                FROM datapoints 
                WHERE schema_name='{}' AND owner LIKE '%{}%' AND to_date(CAST(created as char(10)), 'YYYY-MM-DD') ='{}' 
                ORDER BY(owner);""".format( r, args1, args2))
        db_query = cur.fetchall()
        db_list = [list(i) for i in db_query]
        for n in all_data:
            try:
                x = [n[0]]      # As this is an array of names the name searched for needs to also be in an array to find identical searches. 
                report_check = db_list.index(x)
            except ValueError:
                report_check = -1

            if report_check != -1:
                n.append(1)
            else:
                n.append(0)
        
    all_data.insert(0, reports)
    print("Here is All Data: ")
    print(all_data)

    return flask.jsonify(all_data)





        

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000) 
