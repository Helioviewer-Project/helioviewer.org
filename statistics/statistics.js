/**
 * Helioviewer Usage Statistics Functions
 * 2011/02/09
 */

/**
 *  Fetches the usage statistics for the specified time interval and displays summary text and graphs
 *  
 *  @param timeInterval The time interval or resolution for which the usage statistics should be displayed, e.g.
 *                      hourly, daily, weekly, etc.
 *  @return void
 */
colors = ["#d82641", "#9bd927", "#27d9be", "#6527d9"];

var getUsageStatistics = function(timeInterval) {
    $.getJSON("../api/index.php", {action: "getUsageStatistics", resolution: timeInterval}, function (response) {
        displayUsageStatistics(response, timeInterval);
    });
};

/**
 * Handles the actual rendering of the usage statistics for the requested period
 * 
 * @param data          Usage statistics
 * @param timeInterval  Query time interval
 * 
 * @return void
 */
var displayUsageStatistics = function (data, timeInterval) {
    var pieChartHeight, barChartHeight, barChartMargin, summary, max;

    // Determine how much space is available to plot charts
    pieChartHeight = Math.min(0.4 * $(window).width(), $(window).height());
    barChartHeight = Math.min(150, pieChartHeight / 3);
    
    // Overview text
    summary = data['summary'];
    displaySummaryText(timeInterval, summary);

    // Create summary pie chart
    createPieChart('pieChart', summary, pieChartHeight);

    // Create bar graphs for each request type
    createColumnChart('takeScreenshot', data['takeScreenshot'], 'Screenshot', barChartHeight, colors[0]);
    createColumnChart('buildMovie', data['buildMovie'], 'Movie', barChartHeight, colors[1]);
    createColumnChart('getJPX', data['getJPX'], 'JPX', barChartHeight, colors[2]);
    createColumnChart('embed', data['embed'], 'Embeds', barChartHeight, colors[3])
    
    // Spreads bar graphs out a bit if space permits
    barChartMargin = Math.round(($("#visualizations").height() - $("#barCharts").height()) / 6);
    $(".columnChart").css("margin", barChartMargin + "px 0");
}

/**
 * Displays summary text to be shown at the top of the usage statistics page
 * 
 * @param timeInterval  Time interval for which the statistics are shown
 * @param summary       Total counts for each type of request
 * 
 * @return string HTML for the overview text block
 */
var displaySummaryText = function(timeInterval, summary) {
    var humanTimes, when, html;

    // Human readable text for the requested time intervals
    humanTimes = {
        "daily"  : "two weeks",
        "weekly" : "two months",
        "monthly": "year",
        "yearly" : "three years"
    };
    
    when = humanTimes[timeInterval];
    
    // Generate HTML
    html = '<span id="when">During the last <b>' + when + '</b> Helioviewer.org users created</span> ' +
           '<span style="color:"' + colors[0] + ';" class="summaryCount">' + summary['takeScreenshot'] + ' screenshots</span>, ' +
           '<span style="color:"' + colors[1] + ';" class="summaryCount">' + summary['buildMovie'] + ' movies</span>, ' +
           '<span style="color:"' + colors[2] + ';" class="summaryCount">' + summary['getJPX'] + ' JPX movies</span>, and ' + 
           'Helioviewer.org was <span style="color:"' + colors[3] + ';" class="summaryCount">embedded ' + summary['embed'] + ' times</span>.';

    $("#overview").html(html);
    
};

/**
 * Creates a bar chart representing the frequency of requests for the specified type across time
 * 
 * @param id        Id of the dom element where bar chart should be placed
 * @param rows      Data rows
 * @param desc      Description ...
 * @param height    Height of the bar chart
 * @param color     Color to use for the bars
 * 
 * @return void
 */
var createColumnChart = function (id, rows, desc, height, color) {
    // Build datatable
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Time');
    data.addColumn('number', desc);
    data.addRows(rows.length);

    // Set datatable values
    row = 0;
    $.each(rows, function (i, pair) {
        // Grab key and value from the pair
        for (key in pair) {
            data.setValue(row, 0, key);
            data.setValue(row, 1, pair[key]);                         
        }
        row++;
    });

    $("#barCharts").append('<div id="' + id + 'Chart" class="columnChart"></div>');

    chart = new google.visualization.ColumnChart(document.getElementById(id + "Chart"));
    chart.draw(data, {
        height: height,
        colors: [color],
        legend: 'none',
        title: 'Number of ' + desc + ' requests',
        hAxis: {slantedText: true}
    });
};

/**
 * Creates a pie chart to show proportion of each request type made
 *  
 * @param id        Id of the dom element where pie chart should be placed
 * @param totals    Array containing counts for each type of query
 * @param size      Length of each side of the graph
 * 
 * @return void
 */
var createPieChart = function (id, totals, size) {
    var chart, width, data = new google.visualization.DataTable();

    data.addColumn('string', 'Request');
    data.addColumn('number', 'Frequency of requests');

    data.addRows(4);

    data.setValue(0, 0, 'Screenshots');
    data.setValue(0, 1, totals['takeScreenshot']);
    data.setValue(1, 0, 'Movies');
    data.setValue(1, 1, totals['buildMovie']);
    data.setValue(2, 0, 'JPX Movies');
    data.setValue(2, 1, totals['getJPX']);
    data.setValue(3, 0, 'Helioviewer.org Embeds');
    data.setValue(3, 1, totals['embed']);

    chart = new google.visualization.PieChart(document.getElementById(id));
    chart.draw(data, {width: size, height: size, colors: colors, title: "Frequency of requests"});
};
