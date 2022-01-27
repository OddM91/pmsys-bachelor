var ignoredPlayers = [];
var notifyList = [];
var listOfAbsence = [];
localStorage.setItem("ignored_players", JSON.stringify(ignoredPlayers));

$(function(){
    console.log("Hello world!");


    // This part initiallize the values of the date selectors. 
    // It make the End Time be the current day, and the Start Time be 1 week ago. 
    var dateControl = document.getElementById("start_time");
    var dateControl2 = document.getElementById("end_time");
    var today = new Date();
    lastWeek = new Date(today.getTime()  - 7 * 24 * 60 * 60 * 1000)
    var date = lastWeek.getFullYear()+'-'+String((lastWeek.getMonth()+1)).padStart(2, '0')+'-'+ String(lastWeek.getDate()).padStart(2, '0');
    var date2 = today.getFullYear()+'-'+String((today.getMonth()+1)).padStart(2, '0')+'-'+ String(today.getDate()).padStart(2, '0');
    
    dateControl.value = date;
    dateControl2.value = date2;

    // Because of testing these are override with more reasonable values. 
    dateControl.value = "2021-05-01"
    dateControl2.value = "2021-05-31"

    // Initial fetch of stats from the last week. 

    let reportInput = $("#report").val();
    let starttimeInput = $("#start_time").val();
    let endtimeInput = $("#end_time").val();
    let teamInput = $("#team").val();

    // Because of testing reasons I override the input with static input for more reasonable opening view. 
    reportInput = "wellness,srpe";
    starttimeInput = "2021-05-01";
    endtimeInput = "2021-05-31";
    teamInput = "59b8149";

    url = "/api/stats/initv1?reports=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));

    $.get(url, function (data){
        console.log("Fetching stats");
        console.log(data[0]);

        displayStats(data[0]);
        makeAbsenceList(data[2]);
        displayArray(data[1]);

    });

    // This line is to prevent whenever anything is submitted that the page wouldn't refresh and start over. 
    $("form").submit(function() { return false; });
    
});

function makeAbsenceList(data){
    console.log("In MakeAbsenceList right now !!!-------------------");
    listOfAbsence = data;
    console.log(listOfAbsence);
}

function showAttendance(){
    var btn = document.getElementById("show-rep-btn");
    btn.innerHTML = "Showing Reported";
    document.getElementById("show-rep-btn").classList.remove("btn-secondary");
    document.getElementById("show-rep-btn").classList.add("btn-primary");

    btn = document.getElementById("not-rep-btn");
    btn.innerHTML = "Show NOT Reported";
    document.getElementById("not-rep-btn").classList.remove("btn-primary");
    document.getElementById("not-rep-btn").classList.add("btn-secondary");


    // Getting the current values
    let reportInput = $("input[type=checkbox][name=reports]:checked").map(function(){
        return $(this).val();
    }).get();
    let starttimeInput = $("#start_time").val();
    let endtimeInput = $("#end_time").val();
    let teamInput = $("#team").val();

    // This URI will return how many reports where submitted between the selected dates. 
    // Format: /api/stat?reports=XYZ&&start_time=XYZ&&end_time=XYZ&&team=XYZ&&ignore=XYZ
    url = "/api/stat?reports=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));


    $.get(url, function(data){
        displayStats(data[0]);
        makeAbsenceList(data[1]);
    });

}

function showAbsence(){
    var btn = document.getElementById("not-rep-btn");
    btn.innerHTML = "Showing NOT Reported";
    document.getElementById("not-rep-btn").classList.remove("btn-secondary");
    document.getElementById("not-rep-btn").classList.add("btn-primary");

    btn = document.getElementById("show-rep-btn");
    btn.innerHTML = "Show Reported";
    document.getElementById("show-rep-btn").classList.remove("btn-primary");
    document.getElementById("show-rep-btn").classList.add("btn-secondary");

    // Getting the current values. 
    let reportInput = $("input[type=checkbox][name=reports]:checked").map(function(){
        return $(this).val();
    }).get();
    let starttimeInput = $("#start_time").val();
    let endtimeInput = $("#end_time").val();
    let teamInput = $("#team").val();
    
    // This URI will return how many HASN'T reported for each day within the date range. 
    // Format: /api/stat/onlyabsent?reports=XYZ&&start_time=XYZ&&end_time=XYZ&&team=XYZ&&ignore=XYZ
    url = "/api/stat/onlyabsent?reports=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput  + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));

    $.get(url, function(data){
        displayStats(data[0]);
        makeAbsenceList(data[1]);
    });
}

function ignorePlayer(name, id){

    // Checking for Ignore or Unignore. 
    var btn = document.getElementById(id);
    let ignore_list = JSON.parse(localStorage.getItem("ignored_players"));

    if(btn.classList.contains("btn-info")){
        btn.innerHTML = "Unignore";
        document.getElementById(id).classList.remove("btn-info");
        document.getElementById(id).classList.add("btn-dark");
        ignore_list.push(name);        
    }
    else{
        btn.innerHTML = "Ignore";
        document.getElementById(id).classList.remove("btn-dark");
        document.getElementById(id).classList.add("btn-info");
        ignore_list.splice(ignore_list.indexOf(name), 1)
    }
        
    
    
    localStorage.setItem("ignored_players", JSON.stringify(ignore_list));
    
    let report_display_check = document.getElementById("show-rep-btn");
    if (report_display_check.classList.contains("btn-primary")){
        showAttendance();
    }
    else{
        showAbsence();
    }
}

function displayStats(data){
    
    // First it creates the Stats array, this first word put in will be the name of the collums shown under the grid. 
    // It will then go through the data sent in and add it to the stats array in a clean format.  

    let stats = [];
    let days = [];
    let by_report_array = []
    for (let r in data){
        by_report_array = []
        by_report_array.push(data[r][0]);
        data[r].splice(0, 1);
        for (let d in data[r]){
            by_report_array.push(data[r][d][1]);
            if(r == 0){
                datetime_o = new Date(data[r][d][0]);
                days.push(datetime_o.toDateString().split(' ').slice(1, 3).join(' '));
                // Removing the time of day and year to make it look clearner.
            }
        }

        stats.push(by_report_array)
    }

    // Makes the gird. It will also make an onClick function for each bar in the chart that will look up in the database who is missing from the reports. 
    var chart = c3.generate({
        bindto: '#chart',
        data: {
          columns: stats,
          type: 'line',
          onclick: function (d, i) { 
                
                let date = new Date($("#start_time").val());
                date.setDate(date.getDate() + d.index);
                let month_format = parseInt(date.getMonth()) + 1;
                let date_formated = date.getFullYear() + "-" + month_format + "-" + date.getDate();
                
                let url = "/api/stat/absence/name/all?team=" + $("#team").val() + "&&date=" + date_formated + "&&schema=" + d.id + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));

                $.get(url, function (data){
                    
                    let output = "<table>";
                    let id = 0
                    
                    for (let i in data[0]){
                        output += "<tr><td><span style=\"color: red;\">" + data[0][i] + "</span></td><td><button id=\""+ id + "\" class=\"btn btn-info mx-auto\" value=\"ignore\" onclick=\"ignorePlayer(\'"+ data[0][i] + "\', " + id + ")\">Ignore</button></td></tr>";
                        id += 1;
                    }
                    for (let i in data[1]){
                        output += "<tr><td><span style=\"color: green;\">" + data[1][i] + "</span></td><td><button id=\""+ id + "\" class=\"btn btn-info mx-auto\" value=\"ignore\" onclick=\"ignorePlayer(\'"+ data[1][i] + "\', " + id + ")\">Ignore</button></td></tr>";
                        id += 1;
                    }
                    output += "</table>"
                    
                    report_name = d.id.charAt(0).toUpperCase() + d.id.slice(1);
                    $("#right-text").html("<h4>" + report_name + " - " + date.toDateString().split(' ').slice(1, 3).join(' ') + "</h4>" + output);

                });
                
            },
        },
        tooltip: {
            contents: function (d, defaultTitleFormat, defaultValueFormat, color){
                
                let index = parseInt(d[0].x);
                let aDate = listOfAbsence[index][0].split(' ').slice(1, 3).join(' ');
                
                
                
                let output = `<table class='${this.CLASS.tooltip}'><th style=\"width: 1%\">${aDate}</th><tbody>`;
                for (let i in listOfAbsence[index]){
                    if (i == 0){
                        continue;
                    }
                    output += `<tr><td style=\"display: flex; justify-content: flex-start; align-items: baseline; align-content: flex-start; \"><div class=\"toolcolor\" style=\"background-color:${color(d[i-1].id)}\"></div> &nbsp;` + listOfAbsence[index][i][0] + "</td></tr>"
                    if (listOfAbsence[index][i][1][0] === undefined || listOfAbsence[index][i][1][0].lenght == 0){   
                        output += "<tr><td style=\"width: 1%\">All reports in.</td></tr>";  
                    }
                    for (let j in listOfAbsence[index][i][1]){
                        output += "<tr><td style=\"width: 1%\">" + listOfAbsence[index][i][1][j] + "</td></tr>";
                    }
                       
                }

                output += `</tbody></table>`;
                return output;
            }
        },
        axis: {
            x: {
                label: {
                    
                    position: 'outer-center'
                },
                type: 'category',
                categories: days,
                tick: {
                    centered: true,
                    width: 30,
                    fit: false
                }
            },
            y: {
                label: {
                    text: 'Reports',
                    position: 'outer-middle'
                },
                tick: {
                    format: function (d) {
                        return (parseInt(d) == d) ? d : null;
                    },
                    fit: true
                },
                min: 0
            }
        }    
    });

}

function displayArray(data){

    let teamInput = $("#team").val();

    teamInput = checkTeam(teamInput);

    // Not a lot of days and teams make sense to observe so these are put here as default for testing. 
    // teamInput = "Team 3"

    output = "<h5>Today's reports for " + teamInput + "</h5>";

    output += "<table class=\"report-array-style\">";

    // Prints Headers, meaning the name of the reports.
    output += "<th>"
    for (let r in data[0]){
        output += "<td style=\"width: 120px;>\">" + data[0][r] + "</td>";
    }
    output += "<td>Ignore</th>"

    id = 0;
    notifyList = [];
    for (let d in data){        // Per player
        let notifyNeeded = [];
        // skipping headers.
        if (d == 0){
            console.log(data)
            notifyList.push(data[0]);
            for(let a in data[0]){
                notifyList.push([]);
            }
            continue;
        }
        output += "<tr>";
        for (let i in data[d]){     // Per Report that player has. 
            id += 1;
            if (data[d][i] == 1)
                output += "<td style=\"background-color: lawngreen;\">OK</td>";
            else if (data[d][i] == 0){
                notifyList[i].push(data[d][0]);
                output += "<td style=\"background-color: red;\">NONE</td>";
            }
            else
                output += "<td>" + data[d][i] + "</td>";
        }
        output += "<td><button id=\""+ id + "\" class=\"btn btn-info mx-auto\" value=\"ignore\" onclick=\"ignorePlayer(\'"+ data[d][0] + "\', " + id + ")\">Ignore</button></td></tr>";
        
    }
    output += "<tr><td></td>"
    for (let r in data[0]){
        output += "<td><button id=\"repID"+ r + "\" class=\"btn btn-danger mx-auto\" value=\"notify\" onclick=\"notifyAll(" + r + ")\">Notify All</button></td>"
    }

    output += "<td></td></tr></table>";
    $("#left-text").html(output);
    
}

function notifyAll(repID){
    id = "repID" + repID;
    var btn = document.getElementById(id);
    btn.innerHTML = "Notifed";
    report = notifyList[0][repID];
    alert("Sent notification to: " + notifyList[repID+1] + "\nFor report: " + report);
}

function checkTeam(teamid){
    if(teamid == "59b8149")
        return "Team 1";
    else if (teamid == "59b8148")
        return "Team 2";
    else 
        return "Team 3";
}

function notify(name, report, id){
    var btn = document.getElementById(id);
    btn.innerHTML = "Notifed";
    alert("Sent notification to: " + name + "\nFor report: " + report);
}

function checkall(source){
    var checkboxes = document.getElementsByName("reports");
    for (var cbox of checkboxes)
        cbox.checked = source.checked;
}

$('#checkboxlist input[type=checkbox]').click(function(){
    if (!$(this).is(':checked')) {
        $('.selectall').prop('checked', false);
    }
 });