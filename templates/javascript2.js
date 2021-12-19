var ignoredPlayers = [];
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
    reportInput = "wellness";
    starttimeInput = "2021-05-01";
    endtimeInput = "2021-05-31";
    teamInput = "59b8149";

    url = "/api/stat?report=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));

    $.get(url, function (data){
        console.log("Fetching stats");

        displayStats(data);

    });

    // This line is to prevent whenever anything is submitted that the page wouldn't refresh and start over. 
    $("form").submit(function() { return false; });
    
});

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

    console.log(reportInput);
    
    // This URI will return how many reports where submitted between the selected dates. 
    url = "/api/stat?report=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));
    console.log("Trying to fetch: " + url);

    $.get(url, function(data){
        displayStats(data);
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
    url = "/api/stat/onlyabsent?report=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput  + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));
    console.log("Trying to fetch: " + url);

    $.get(url, function(data){
        displayStats(data);
    });
}

function ignorePlayer(name, id){
    let ignore_list = JSON.parse(localStorage.getItem("ignored_players"));
    ignore_list.push(name);
    console.log(ignore_list);
    localStorage.setItem("ignored_players", JSON.stringify(ignore_list));
    var btn = document.getElementById(id);
    btn.innerHTML = "Ignored";
    document.getElementById(id).classList.remove("btn-info");
    document.getElementById(id).classList.add("btn-dark");
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
    console.log("Checking DisplayStats input: ")
    console.log(data)
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
        console.log(by_report_array);
        console.log(days)
        stats.push(by_report_array)
    }
    console.log("All Done, looks like this: ");
    console.log(stats);

    // Makes the gird. It will also make an onClick function for each bar in the chart that will look up in the database who is missing from the reports. 
    var chart = c3.generate({
        bindto: '#chart',
        data: {
          columns: stats,
          type: 'line',
          onclick: function (d, i) { 
                console.log("onclick", d, i);
                
                let date = new Date($("#start_time").val());
                date.setDate(date.getDate() + d.index);
                let month_format = parseInt(date.getMonth()) + 1;
                console.log("Checking Month: " + month_format);
                let date_formated = date.getFullYear() + "-" + month_format + "-" + date.getDate();
                console.log(date_formated)
                
                let url = "/api/stat/absence/name/all?team=" + $("#team").val() + "&&date=" + date_formated + "&&schema=" + d.id + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));

                $.get(url, function (data){
                    console.log(data);
                    
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
                    $("#textbox").html("<h4>" + report_name + " - " + date.toDateString().split(' ').slice(1, 3).join(' ') + "</h4>" + output);

                });
                
            },
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