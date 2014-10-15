<?php
    if ( !isset($_GET['resolution']) ) {
        header('location: '.$_SERVER['REQUEST_URI'].'?resolution=1D');
    }

    date_default_timezone_set("UTC");
    $utc = date("Y/m/d H:i e", time());

    $now = $_SERVER['SCRIPT_URI']
         . '?resolution=' . $_GET['resolution']
         . '&endDate=' . date("Y-m-d\TH:i:s\Z", time());
?>
<!DOCTYPE html>
<html lang="en">
    <head>
    <meta charset="utf-8" />
    <script type="text/javascript" src="https://www.google.com/jsapi"></script>
    <script type="text/javascript" src="coverage.js"></script>
    <title>Helioviewer.org - Data Coverage<?php echo ' - '.$utc; ?></title>
    <link rel='stylesheet' href='coverage.css' />
</head>

<body>
	<div id="main">
		<div id="header">
            <a href="<?php echo $now; ?>"><img src="../resources/images/logos/hvlogo1s_transparent_logo.png" alt="Helioviewer logo" /></a>
            <div id='headerText'>The Helioviewer Project - Data Coverage</div>
            <div class="resolutions">
                <a href="?resolution=30m<?php if ( isset($_GET['endDate']) ) { echo '&endDate='.$_GET['endDate']; } ?>"<?php if ($_GET['resolution']=='30m') { echo ' class="selected"'; } ?>>30 min</a>
                <a href="?resolution=1h<?php if ( isset($_GET['endDate']) ) { echo '&endDate='.$_GET['endDate']; } ?>"<?php if ($_GET['resolution']=='1h') { echo ' class="selected"'; } ?>>1 hour</a>
                <a href="?resolution=1D<?php if ( isset($_GET['endDate']) ) { echo '&endDate='.$_GET['endDate']; } ?>"<?php if ($_GET['resolution']=='1D') { echo ' class="selected"'; } ?>>1 day</a>
                <a href="?resolution=1W<?php if ( isset($_GET['endDate']) ) { echo '&endDate='.$_GET['endDate']; } ?>"<?php if ($_GET['resolution']=='1W') { echo ' class="selected"'; } ?>>1 week</a>
                <a href="?resolution=1M<?php if ( isset($_GET['endDate']) ) { echo '&endDate='.$_GET['endDate']; } ?>"<?php if ($_GET['resolution']=='1M') { echo ' class="selected"'; } ?>>1 month</a>
                <a href="?resolution=3M<?php if ( isset($_GET['endDate']) ) { echo '&endDate='.$_GET['endDate']; } ?>"<?php if ($_GET['resolution']=='3M') { echo ' class="selected"'; } ?>>3 months</a>
                <a href="?resolution=1Y<?php if ( isset($_GET['endDate']) ) { echo '&endDate='.$_GET['endDate']; } ?>"<?php if ($_GET['resolution']=='1Y') { echo ' class="selected"'; } ?>>1 year</a>
            </div>
        </div>
		<div id="datePicker">
            <select id="yyyy" name="YYYY"></select> / <select id="mm" name="MM"></select> / <select id="dd" name="DD"></select>
        </div>
        <div id="timePicker">
            <select id="hour" name="hh"></select> :
            <select id="min" name="mm"></select>
            <?php echo date("e", time()); ?>
        </div>
        <div id="visualizations">
            <!--<div id="pieChart"></div>-->
            <div id="barCharts"></div>
        </div>
        <div id="footer">
        </div>
	</div>
</body>
</html>
