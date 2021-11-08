$(function(){
    console.log("Hello world!");

    var dateControl = document.getElementById("start_time");
    var dateControl2 = document.getElementById("end_time");
    var today = new Date();
    lastWeek = new Date(today.getTime()  - 7 * 24 * 60 * 60 * 1000)
    var date = lastWeek.getFullYear()+'-'+String((lastWeek.getMonth()+1)).padStart(2, '0')+'-'+ String(lastWeek.getDate()).padStart(2, '0');
    var date2 = today.getFullYear()+'-'+String((today.getMonth()+1)).padStart(2, '0')+'-'+ String(today.getDate()).padStart(2, '0');
    
    console.log("Last week was: " + date);

    dateControl.value = date;
    dateControl2.value = date2;

    // Initial fetch of stats for testing

    let reportInput = $("#report").val();
    let starttimeInput = $("#start_time").val();
    let endtimeInput = $("#end_time").val();
    let teamInput = $("#team").val();

    url = "/api/stat?report=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput;

    $.get(url, function (data){
        console.log("Fetching stats");


        displayStats(data);
        

    });

    // This one is to prevent pressing "Enter" within the search box to refresh the page which is the default setting. 
    $("form").submit(function() { return false; });
    
});

function statsChange(){
    let reportInput = $("#report").val();
    let starttimeInput = $("#start_time").val();
    let endtimeInput = $("#end_time").val();
    let teamInput = $("#team").val();
    
    console.log("SWITCHY!! " + reportInput);

    url = "/api/stat?report=" + reportInput + "&&start_time=" + starttimeInput + "&&end_time=" + endtimeInput + "&&team=" + teamInput;
    console.log("Trying to fetch: " + url);

    $.get(url, function(data){
        displayStats(data);
    });

}

function displayStats(data){
    let output = "For now all I got is <br />";
    console.log(data)
   
    output += data;

    let stats = ['reports'];
    let days = [];
    for (let d in data){
        stats.push(data[d][1]);
        datetime_o = new Date(data[d][0])
        days.push(datetime_o.toDateString().split(' ').slice(1, 3).join(' '));
        // Removing the time of day and year to make it look clearner. 
    }

    // $("#textbox").html(days);

    var chart = c3.generate({
        bindto: '#chart',
        data: {
          columns: [stats],
          type: 'bar',
          onclick: function (d, i) { 
                console.log("onclick", d, i);
                let date = new Date($("#start_time").val());
                date.setDate(date.getDate() + d.index);
                let month_format = parseInt(date.getMonth()) + 1;
                console.log("Checking Month: " + month_format);
                let date_formated = date.getFullYear() + "-" + month_format + "-" + date.getDate();
                console.log(date_formated)
                
                let url = "/api/stat/absence?team=" + $("#team").val() + "&&date=" + date_formated + "&&schema=" + $("#report").val();

                $.get(url, function (data){
                    console.log(data);
                    
                    let output = "";
                    for (let i in data){
                        output += data[i][0] + "<br />";
                    }
                    $("#textbox").html(date + "<br />" + output);

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