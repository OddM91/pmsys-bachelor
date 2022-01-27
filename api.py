import flask
import psycopg2
import datetime

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

# Any SQL query that is doing: owner LIKE '%{}%'
# is just trying to establish a team. 
# There are 3 different "patters" in the auth0 tokens that I justified my teams from.
# They are: 59b8149, 59b8148 and 59b6e 

@app.route("/")
def version1():
    return flask.render_template("stats.html")

@app.route("/version2")
def version2():
    return flask.render_template("stats2.html")

@app.route("/version3")
def version3():
    return flask.render_template("stats3.html")



# Used in Version 1 and 2 for inital load, and in showAttendance to generate graph. 
@app.route("/api/stat", methods=["GET"])
def getAttendenceReport():
    total_returned = []
    total_returned.append(getReportStat(1))
    total_returned.append(listOfAbsentPlayers(1))
    return flask.jsonify(total_returned)

def getReportStat(called=0):
    args1 = flask.request.args.get("reports")
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

    if called == 1:
        return all_data
    else:
        return flask.jsonify(all_data)


# Used in Version 1 and 2 in showAbsence to generate graph. 
@app.route("/api/stat/onlyabsent", methods=["GET"])
def getAbsenceReport():
    total_returned = []
    total_returned.append(getReportStatOnlyAbsent(1))
    total_returned.append(listOfAbsentPlayers(1))
    return flask.jsonify(total_returned)

def getReportStatOnlyAbsent(called=0):
    args1 = flask.request.args.get("reports")
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

    if called == 1:
        return all_data
    else: 
        return flask.jsonify(all_data)


# Used in Version 1 for the onclick on the graphs to return list of names absence. 
@app.route("/api/stat/absence/name", methods=["GET"])
def getAbsenceNames():
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


# Used in Version 2 to get all names in addition to who is absent or not. 
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


# Used in Version 3 to get report status for a single day. 
# Returns a list where first row is Report Names, followed by next rows being status for that report format: 
# Name, 1, 1, 0   // Where 1s are reported, and 0s are NOT reported. 
@app.route("/api/stat/report/today", methods=["GET"])
def getTodaysReport(called=0):
    team = flask.request.args.get("team")
    date = flask.request.args.get("end_time")
    args3 = flask.request.args.get("reports")
    reports = args3.split(",")
    print("Input Reports: {}".format(reports))
    #reports = ["wellness", "participation", "srpe"]

    cur = conn.cursor()
    all_data = []

    # Finds all players on the team. 
    cur.execute("""SELECT DISTINCT owner
            FROM datapoints
            WHERE owner LIKE '%{}%'""".format(team))

    db_query = cur.fetchall()

    db_list = [list(i) for i in db_query]  # Converts to list. I can not change a tuple which is what the queries gets me.

    # Fills the list with the name of all players.
    for n in db_list:
        all_data.append(n)

    # Finds everyone that reported for the given day on the given team. 
    # Looping through the reports selected. 
    for r in reports:
        cur.execute("""SELECT DISTINCT owner 
                FROM datapoints 
                WHERE schema_name='{}' AND owner LIKE '%{}%' AND to_date(CAST(created as char(10)), 'YYYY-MM-DD') ='{}' 
                ORDER BY(owner);""".format( r, team, date))
        db_query = cur.fetchall()
        db_list = [list(i) for i in db_query] # Converts puple to list

        # Loops through all players and checks if the name can be found in the reported list. 
        # And if it is found appends 1 and if not found it will trigger an error which is caught and adjusts the check accordingly. 
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

    if called == 1:
        return all_data
    else:
        return flask.jsonify(all_data)

@app.route("/api/stats/absent/all", methods=["GET"])    
def listOfAbsentPlayers(called=0):
    print("Got In?")
    if False:
        team = "59b8149"
        start_date = "2021-05-01"
        end_date = "2021-05-31"
        args3 = "wellness,srpe"
        reports = args3.split(",")
        args5 = ""

    
    team = flask.request.args.get("team")
    start_date = flask.request.args.get("start_time")
    end_date = flask.request.args.get("end_time")
    args3 = flask.request.args.get("reports")
    reports = args3.split(",")
    print("Input Reports: {}".format(reports))
        
    args5 = flask.request.args.get("ignore")
    ignored = args5.split(",")

    ignore_string = "("
    for i in ignored:
        ignore_string += "'" + i + "'"
        if i != ignored[-1]:
            ignore_string += ", "
    ignore_string += ")"

    

    datetime_start = datetime.date(int(start_date[0:4]), int(start_date[5:7]), int(start_date[8:10]))
    datetime_end = datetime.date(int(end_date[0:4]), int(end_date[5:7]), int(end_date[8:10]))
    print("Start Datetime object: {}".format(datetime_start))

    cur = conn.cursor()
    all_data = []

    while datetime_start < datetime_end:
        temp_day = []
        temp_day.append(datetime_start)
        for r in reports:
            cur.execute("""SELECT DISTINCT owner
                FROM datapoints
                WHERE owner LIKE '%{}%' AND owner NOT IN {} 
                EXCEPT
                SELECT DISTINCT owner 
                FROM datapoints 
                WHERE schema_name='{}' AND owner LIKE '%{}%' AND to_date(CAST(created as char(10)), 'YYYY-MM-DD') ='{}' 
                ORDER BY(owner);""".format(team, ignore_string, r, team, datetime_start))

            db_query = cur.fetchall()
            temp_data = []
            temp_data.append(r)
            temp_data.append(db_query)
            temp_day.append(temp_data)
        
        all_data.append(temp_day)
        datetime_start = datetime_start + datetime.timedelta(days=1)
    if called == 1:
        return all_data
    else:
        return flask.jsonify(all_data)
        


@app.route("/api/stats/initv1", methods=["GET"])
def initalFetchForVersion1():
    totalReturn = []
    print("Trying to add Initial Stats")
    totalReturn.append(getReportStat(1))
    print("Trying to add TodaysReport")
    totalReturn.append(getTodaysReport(1))
    print("Trying to make list of absent players.")
    totalReturn.append(listOfAbsentPlayers(1))
    return flask.jsonify(totalReturn)


        

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000) 
