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

    let reportInput = $("input[type=checkbox][name=reports]:checked").map(function(){
        return $(this).val();
    }).get();
    let starttimeInput = $("#start_time").val();
    let endtimeInput = $("#end_time").val();
    let teamInput = $("#team").val();

    // Because of testing reasons I override the input with static input for more reasonable opening view. 
    starttimeInput = "2021-05-01";
    endtimeInput = "2021-05-31";
    teamInput = "59b8149";

    url = "/api/stats/initv1?reports=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput  + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));
    

    $.get(url, function (data){
        console.log("Fetching stats");

        displayStats(data[0]);
        displayArray(data[1]);

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

    // This URI will return how many reports where submitted between the selected dates. 
    url = "/api/stat?reports=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));

    $.get(url, function(data){
        displayStats(data[0]);
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
    url = "/api/stat/onlyabsent?reports=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput + "&&ignore=" + JSON.parse(localStorage.getItem("ignored_players"));

    $.get(url, function(data){
        displayStats(data[0]);
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
                
                let date = new Date($("#start_time").val());
                date.setDate(date.getDate() + d.index);
                let month_format = parseInt(date.getMonth()) + 1;
                let date_formated = date.getFullYear() + "-" + month_format + "-" + date.getDate();
                
                let url = "/api/stat/absence/name?team=" + $("#team").val() + "&&date=" + date_formated + "&&schema=" + d.id;

                $.get(url, function (data){
                    
                    let output = "";
                    if(data[0].length > 0){
                        for (let i in data[0]){
                            output += convertName(data[0][i]) + "<br />";
                        }
                    }else{
                        output = "No missing reports."
                    }
                    report_name = d.id.charAt(0).toUpperCase() + d.id.slice(1);
                    $("#right-text").html("<h4>" + report_name + " - " + date.toDateString().split(' ').slice(1, 3).join(' ') + "</h4><h6>Missing Players: </h6>" + output);

                });
                
            },
        },
        /*tooltip: {
            contents: function (d, defaultTitleFormat, defaultValueFormat, color){
                console.log("tooltip", d);
                
                let date = new Date($("#start_time").val());
                date.setDate(date.getDate() + d.index);
                let month_format = parseInt(date.getMonth()) + 1;
                console.log("Checking Month: " + month_format);
                let date_formated = date.getFullYear() + "-" + month_format + "-" + date.getDate();
                console.log(date_formated)
                
                let url = "/api/stat/absence/name?team=" + $("#team").val() + "&&date=" + date_formated + "&&schema=" + d.id;

                let output = `<table class='${this.CLASS.tooltip}'><th>Not Reported </th><tbody>`;
                $.get(url, function (data){
                    console.log(data);
                    
                    if(data[0].length > 0){
                        for (let i in data[0]){
                            output += "<tr><td>" + data[0][i] + "</td></tr>";
                        }
                    }else{
                        output = "None."
                    }
                    report_name = d.id.charAt(0).toUpperCase() + d.id.slice(1);
                    // $("#textbox").html("<h4>" + report_name + " - " + date.toDateString().split(' ').slice(1, 3).join(' ') + "</h4>" + output);

                });
                return `</tbody></table>`
            }
        },*/
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

function convertName(autotokenid){
    if (autotokenid == "auth0|59b814967091e711e630026d"){
        return "Archie Calvin";
    }
    else if (autotokenid == "auth0|59b814917091e711e6300265"){
        return "Sammy Radclyffe";
    }else if (autotokenid == "auth0|59b814917091e711e6300266"){
        return "Shane Gladwyn";
    }else if (autotokenid == "auth0|59b814907091e711e6300264"){
        return "Rocky Dom";
    }else if (autotokenid == "auth0|59b814967091e711e6300268"){
        return "Albie Alastair";
    }else if (autotokenid == "auth0|59b814947091e711e630026a"){
        return "Braiden Ronnie";
    }else if (autotokenid == "auth0|59b814967091e711e6300266"){
        return "Ben Schuyler";
    }else if (autotokenid == "auth0|59b81492cbb73b1e63a1cbc5"){
        return "Lambert Peyton";
    }else if (autotokenid == "auth0|59b81494c71350685f02daa6"){
        return "Harry Julian";
    }else if (autotokenid == "auth0|59b81499cbb73b1e63a1cbc8"){
        return "Richie Shelley";
    }else if (autotokenid == "auth0|59b814937091e711e6300269"){
        return "Blaze Merrill";
    }else if (autotokenid == "auth0|59b814967091e711e630026c"){
        return "Raynard Darcy";
    }else if (autotokenid == "auth0|59b81495c71350685f02daa7"){
        return "Nikolas Maximilian";
    }else if (autotokenid == "auth0|59b81497cbb73b1e63a1cbc7"){
        return "Rodger Fearghas";
    }else if (autotokenid == "auth0|59b81490cbb73b1e63a1cbc4"){
        return "Rory Chet";
    }else if (autotokenid == "auth0|59b814937091e711e6300268"){
        return "Alpha Bodhi";
    }else if (autotokenid == "auth0|59b81497cbb73b1e63a1cbc6"){
        return "Norwood Pip";
    }
    else{
        console.log(autotokenid);
        return "Who is this?";        
    }
}

function displayArray(data){

    let teamInput = $("#team").val();

    teamInput = checkTeam(teamInput);

    // Not a lot of days and teams make sense to observe so these are put here as default for testing. 
    // teamInput = "Team 3"

    output = "<h5 style=\"font-family: Verdana; \">Today's reports for " + teamInput + "</h5>";

    output += "<table class=\"table table-bordered text-center\"><thead class=\"thead-light\"><tr>";

    // Prints Headers, meaning the name of the reports.
    output += "<th scope=\"col\" style=\"width: 160px;\">Name</th>"
    for (let r in data[0]){
        let header = data[0][r].charAt(0).toUpperCase() + data[0][r].slice(1);
        if(header == "Srpe")
            header = "SRPE"
        output += "<th scope=\"col\" style=\"width: 120px;\">" + header + "</th>";
    }
    output += "<th>Ignore</th></tr></thead>"
   
    let id = 0;
    for (let d in data){
        // skipping headers.
        if (d == 0)
            continue;
        output += "<tbody class=\"align-middle\"><tr>"
        for (let i in data[d]){
            id += 1;
            if (data[d][i] == 1)
                output += "<td class=\"table-success\">OK</td>";
            else if (data[d][i] == 0)
                output += "<td class=\"notify-btn-td table-danger\"><button id=\""+ d + i + "\" class=\"btn btn-dark mx-auto\" value=\"notify\" onclick=\"notify(\'"+ data[d][0] + "\', \'" + data[0][i-1] + "\', "+ d + i + ")\">NOTIFY!</button></td>";
            else
                output += "<td scope=\"row\"  align=\"left\" style=\"padding-left: 12px;\">" + convertName(data[d][i]) + "</td>";
        }
        output += "<td class=\"ignore-btn-td\"><button id=\""+ id + "\" class=\"btn btn-info mx-auto\" value=\"ignore\" onclick=\"ignorePlayer(\'"+ data[d][0] + "\', " + id + ")\">Ignore</button></td>";
        output += "</tr>"
        
    }    
    output += "</tbody></table>"
    $("#left-text").html(output);
    
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

function notify(name, report, id){
    var btn = document.getElementById(id);
    btn.innerHTML = "Notifed";
    name = convertName(name);
    alert("Sent notification to: " + name + "\nFor report: " + report);
}

function checkTeam(teamid){
    if(teamid == "59b8149")
        return "Team 1";
    else if (teamid == "59b8148")
        return "Team 2";
    else 
        return "Team 3";
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