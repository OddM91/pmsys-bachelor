$(function(){
    console.log("Hello world!");


    // This part initiallize the values of the date selectors. 
    // It make the End Time be the current day, and the Start Time be 1 week ago. 
    var dateControl2 = document.getElementById("end_time");
    var today = new Date();
    var date2 = today.getFullYear()+'-'+String((today.getMonth()+1)).padStart(2, '0')+'-'+ String(today.getDate()).padStart(2, '0');
    

    dateControl2.value = date2;

    // Static value overriding here to adjust so output makes sense with current datapoints. 
    dateControl2.value = "2021-10-22";

    // Initial fetch of stats from the last week. 

    // This first one for current day could ofc just be a date object finding today with GetMonth, GetYear, Get Day, etc. 
    let currentday = $("#end_time").val();
    let teamInput = $("#team").val();
    let reportInput = $("input[type=checkbox][name=reports]:checked").map(function(){
        return $(this).val();
    }).get();

    // Not a lot of days and teams make sense to observe so these are put here as default for testing. 
    // currentday = "2021-10-22";
    // teamInput = "59b8149"

    url = "/api/stat/report/today?date=" + currentday + "&&team=" + teamInput + "&&reports=" + reportInput;

    $.get(url, function (data){
        console.log("Fetching stats");

        displayArray(data);

    });

    // This line is to prevent whenever anything is submitted that the page wouldn't refresh and start over. 
    $("form").submit(function() { return false; });
    
});

function displayArray(data){

    let teamInput = $("#team").val();

    // Not a lot of days and teams make sense to observe so these are put here as default for testing. 
    teamInput = "Team 3"

    output = "<h5>Today's reports for " + teamInput + "</h5>";

    output += "<table class=\"report-array-style\">";

    // Prints Headers, meaning the name of the reports.
    output += "<th>"
    for (let r in data[0]){
        output += "<td style=\"width: 120px;>\">" + data[0][r] + "</td>";
    }
    output += "</th>"

    for (let d in data){
        // skipping headers.
        if (d == 0)
            continue;
        output += "<tr>"
        for (let i in data[d]){
            if (data[d][i] == 1)
                output += "<td style=\"background-color: lawngreen;\">OK</td>";
            else if (data[d][i] == 0)
                output += "<td style=\"background-color: red;\"><button id=\""+ d + i + "\" class=\"btn btn-dark mx-auto\" value=\"notify\" onclick=\"notify(\'"+ data[d][0] + "\', \'" + data[0][i-1] + "\', "+ d + i + ")\">NOTIFY!</button></td>";
            else
                output += "<td>" + data[d][i] + "</td>";
        }
        output += "</tr>"
        
    }    
    output += "</table>"
    $("#report_array").html(output);
    
}

function notify(name, report, id){
    var btn = document.getElementById(id);
    btn.innerHTML = "Notifed";
    alert("Sent notification to: " + name + "\nFor report: " + report);
}

function showAttendance(){
    // This first one for current day could ofc just be a date object finding today with GetMonth, GetYear, Get Day, etc. 
    let currentday = $("#end_time").val();
    let teamInput = $("#team").val();

    // Not a lot of days and teams make sense to observe so these are put here as default for testing. 
    // currentday = "2021-10-22";
    // teamInput = "59b8149"

    let reportInput = $("input[type=checkbox][name=reports]:checked").map(function(){
        return $(this).val();
    }).get();

    url = "/api/stat/report/today?end_time=" + currentday + "&&team=" + teamInput + "&&reports=" + reportInput;

    $.get(url, function (data){
        console.log("Fetching stats");

        displayArray(data);

    });

}

function showAbsence(){
    // Getting the current values. 
    let reportInput = $("#report").val();
    let starttimeInput = $("#start_time").val();
    let endtimeInput = $("#end_time").val();
    let teamInput = $("#team").val();
    
    // This URI will return how many HASN'T reported for each day within the date range. 
    url = "/api/stat/onlyabsent?report=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput;

    $.get(url, function(data){
        displayStats(data);
    });
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
          type: 'bar',
          onclick: function (d, i) { 
                console.log("onclick", d, i);
                
                let date = new Date($("#start_time").val());
                date.setDate(date.getDate() + d.index);
                let month_format = parseInt(date.getMonth()) + 1;
                let date_formated = date.getFullYear() + "-" + month_format + "-" + date.getDate();
                
                let url = "/api/stat/absence/name?team=" + $("#team").val() + "&&date=" + date_formated + "&&schema=" + d.id;

                $.get(url, function (data){
                    
                    let output = "";
                    if(data[0].length > 0){
                        for (let i in data[0]){
                            output += data[0][i] + "<br />";
                        }
                    }else{
                        output = "No missing reports."
                    }
                    report_name = d.id.charAt(0).toUpperCase() + d.id.slice(1);
                    $("#textbox").html("<h4>" + report_name + " - " + date.toDateString().split(' ').slice(1, 3).join(' ') + "</h4>" + output);

                });
                
            },
        },
        axis: {
            x: {
                label: {
                    text: 'Days',
                    position: 'outer-center'
                },
                type: 'category',
                categories: days,
                tick: {
                    centered: true
                }
            },
            y: {
                label: {
                    text: 'Reports',
                    position: 'outer-middle'
                },
                min: 0
            }
        }    
    });

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