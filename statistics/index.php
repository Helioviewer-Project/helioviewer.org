<!DOCTYPE html>
<html lang="en">
    <head>
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <title>Helioviewer.org - Usage Statistics</title>
    <style type="text/css">
    	#main {text-align: center; margin:50px auto 0px; width: 80%;}
    	#overview {font-size: 1em}
    	#numScreenshots {color: #8e305c;}
    	#numMovies {color: #5d8f31;}
    	#numJPXMovies {color: #315d8f;}
    	.summaryCount {font-weight: bold; font-size:1.5em; cursor: pointer;}
    	#summaryPieChart {margin-left: auto; margin-right: auto; width: 100%;}
    </style>
    <script type="text/javascript">
        google.load("jquery", "1.5");
        google.load("visualization", "1", {packages:["corechart"]});
        google.setOnLoadCallback(function (e) {

            $.getJSON("../api/index.php", {action: "getUsageStatistics", resolution: "daily"}, function (response) {
                var overview, chart, height, row, summaryChart, movieChart, screenshotChart, jpxChart;

                overview = getOverviewText(
                	"two weeks", response.summary['takeScreenshot'], response.summary['buildMovie'],
                				 response.summary['getJPX'], response.summary['uploadMovieToYouTube']
                );

                $("#overview").html(overview);

                height = Math.max(400, $(window).height() - 200);

				// Create summary pie chart
                createPieChart('summaryPieChart', height, response.summary);

                // Create bar graphs for each request type
                createColumnChart('takeScreenshot', response['takeScreenshot'], 'Number of screenshots created', height, "#8e305c");
                createColumnChart('buildMovie', response['buildMovie'], 'Number of movies created', height, "#5d8f31");
                createColumnChart('getJPX', response['getJPX'], 'Number of JPX movies created', height, "#315d8f");

                // Get references to each of the new charts added
                summaryChart    = $("#summaryPieChart");
                screenshotChart = $("#takeScreenshotChart").hide();
                movieChart      = $("#buildMovieChart").hide();
                jpxMovieChart   = $("#getJPXChart").hide();

                // Mouse-over events
                $("#numScreenshots").hover(function () {
                    summaryChart.hide();
                	screenshotChart.show();
                }, function () {
                	screenshotChart.hide();
                	summaryChart.show();
                });

                $("#numMovies").hover(function () {
                    summaryChart.hide();
                    movieChart.show();
                }, function () {
                	movieChart.hide();
                	summaryChart.show();
                });

                $("#numJPXMovies").hover(function () {
                    summaryChart.hide();
                    jpxMovieChart.show();
                }, function () {
                	jpxMovieChart.hide();
                	summaryChart.show();
                });
            });

            // Create pie chart
            var createPieChart = function (id, height, summary) {
                var chart, data = new google.visualization.DataTable();

                data.addColumn('string', 'Request');
                data.addColumn('number', 'Number of requests');

                data.addRows(3);

                data.setValue(0, 0, 'Movies');
                data.setValue(0, 1, summary['buildMovie']);
                data.setValue(1, 0, 'JPX Movies');
                data.setValue(1, 1, summary['getJPX']);
                data.setValue(2, 0, 'Screenshots');
                data.setValue(2, 1, summary['takeScreenshot']);

                chart = new google.visualization.PieChart(document.getElementById(id));
                chart.draw(data, {height: height, colors: ["#8e305c", "#5d8f31", "#315d8f"]});
            };

            // Create bar graph
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

                $("#main").append('<div id="' + id + 'Chart"></div>');

                chart = new google.visualization.ColumnChart(document.getElementById(id + "Chart"));
                chart.draw(data, {
                    height: height,
                    colors: [color]
                });
            };
            
            // Display summary information
            var getOverviewText = function (when, numScreenshots, numMovies, numJPXMovies, numUploads) {
            	return '<span id="when">During the last <b>' + when + '</b> Helioviewer.org users created</span> ' +
            		   '<span id="numScreenshots" class="summaryCount">' + numScreenshots + ' screenshots</span>, ' +
            		   '<span id="numMovies" class="summaryCount">' + numMovies + ' movies</span>, and ' +
            		   '<span id="numJPXMovies" class="summaryCount">' + numJPXMovies + ' JPX movies</span>.';
            		   
            };
        });
    </script>
</head>

<body>
	<div id="main">
		<img id="logo" src="../resources/images/logos/hvlogo1s_transparent_logo.png" alt="Helioviewer logo" />
		<span style='font-size:2em'>The Helioviewer Project - Recent Activity</span><br /><br /><br />
		<div id="overview"></div>
    	<div id="summaryPieChart"></div>
	</div>
</body>
</html>