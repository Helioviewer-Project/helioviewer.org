<?php
    $validResolutions = array("hourly", "daily", "weekly", "monthly", "yearly");
    if (isset($_GET['resolution']) && in_array($_GET['resolution'], $validResolutions)) {
        $resolution = $_GET['resolution'];
    } else {
        $resolution = "daily";
    }
?>
<!DOCTYPE html>
<html lang="en">
    <head>
    <meta charset="utf-8" />
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript" src="statistics.js"></script>
    <title>Helioviewer.org - Usage Statistics</title>
    <link rel='stylesheet' href='statistics.css' />
    <script type="text/javascript">
        google.load("jquery", "1.5");
        google.load("visualization", "1", {packages:["corechart"]});
        google.setOnLoadCallback(function (e) {
            getUsageStatistics("<?php echo $resolution;?>");
        });
    </script>
</head>

<body>
	<div id="main">
		<div id="header">
            <img src="../resources/images/logos/hvlogo1s_transparent_logo.png" alt="Helioviewer logo" />
            <div id='headerText'>The Helioviewer Project - Recent Activity</div>
        </div>
		<div id="overview"></div>
        <div id="visualizations">
            <div id="pieChart"></div>
            <div id="barCharts"></div>
        </div>
        <div id="footer">
            Note: Helioviewer.org only collects information about types of queries made.  Helioviewer.org does not collect or store any information that could be used to identify users.
        </div>
	</div>
</body>
</html>