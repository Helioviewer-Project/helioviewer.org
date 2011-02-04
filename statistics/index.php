<!DOCTYPE html>
<html lang="en">
    <head>
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript">
        google.load("jquery", "1.4.2");
        google.load("visualization", "1", {packages:["corechart"]});
        google.setOnLoadCallback(drawChart);
        
        function drawChart() {
              
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Time');
            data.addColumn('number', 'Count');

            $.getJSON("../api/index.php", {action: "getUsageStatistics", resolution: "daily"}, function (response) {
                data.addRows(response['buildMovie'].length);
                var row = 0;
                $.each(response['buildMovie'], function (i, pair) {
                    // Grab key and value from the pair
                    for (key in pair) {
                        data.setValue(row, 0, key);
                        data.setValue(row, 1, pair[key]);                         
                    }
                    row++;
                });

                var chart = new google.visualization.ColumnChart(document.getElementById('bargraph'));
                chart.draw(data, {
                    width : 640,
                    height: 480,
                    title: 'Usage Statistics (buildMovie)',
                    hAxis: {title: 'Date/Time', titleTextStyle: {color: 'blue'}}
                });
            });
        }
    </script>
</head>

<body>
    <div id="bargraph"></div>
</body>
</html>