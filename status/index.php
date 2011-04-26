<?php
    date_default_timezone_set('UTC');
    $dt = new DateTime();
    $now = $dt->format('Y-m-d H:i:s');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Helioviewer.org - Data Monitor</title>
    <style type='text/css'>
        #main {width:40%; margin: 20px auto; text-align: center;}
        #header {vertical-align: middle; margin: 15px auto 26px auto;}
        #headerText {display: inline-block; vertical-align: super; font-family: arial,helvetica,liberation sans,bitstream vera sans,freesans,clean,sans-serif; font-size:2.4em;}
        #currentTime {font-size:0.8em; font-style: italic;}
        #statuses {margin-left: auto; margin-right: auto; width:65%; min-width:480px; text-align: left; font-size:0.9em;}
        .status-icon {width: 18px; height: 18px; mask: url(mask.svg#mask); -webkit-mask-box-image: url(mask.svg);}
        
    </style>
</head>
<body>
    <div id='main'>
	<div id="header">
        <img src="../resources/images/logos/hvlogo1s_transparent_logo.png" alt="Helioviewer logo" />
        <div id='headerText'>The Helioviewer Project - Data Monitor</div>
        <div id='currentTime'>Current time: <?php echo $now;?></div>
    </div>

    <table id='statuses'>
    <tr style='font-weight:bold;'>
        <td width='100'>Datasource</td>
        <td width='100'>Latest Image</td>
        <td width='50' align='center'>Status</td>
    </tr>    
    <?php
        include_once "../api/src/Database/DbConnection.php";
        include_once "../api/src/Database/ImgIndex.php";
        include_once "../api/src/Config.php";

       /**
        * Returns a CSS RGB triplet ranging from green (close to requested time) to yellow (some deviation from requested
        * time) to red (requested time differs strongly from actual time).
        * 
        * The weight should range from:
        *   0 = green
        *   1 = red
        * 
        * @param float $weight  Numeric ranging from 0.0 (green) to 1.0 (red)
        * @param int   $rOffset Offset to add to red value
        * @param int   $gOffset Offset to add to green value
        * @param int   $bOffset Offset to add to blue value
        */
        function chooseTimeStampColor($weight, $rOffset=0, $gOffset=0, $bOffset=0) {
            $red   = min(255, $rOffset + (int)(2 * $weight * 255));
            $green = min(255, $gOffset + (int)(2 * 255 * (1 - $weight)));
            $blue  = $bOffset;

            return sprintf("rgb(%d,%d,%d)", $red, $green, $blue);
        } 
        
        $config = new Config("../settings/Config.ini");
        
        
        // Current time
        $now = time();
        
        $db = new Database_DbConnection();
        $imgIndex = new Database_ImgIndex();
        
        $datasources = $db->query("SELECT * FROM datasources ORDER BY name");

        // Add an entry to the table for each data source
        while($ds = mysqli_fetch_assoc($datasources)) {
            // Get date of most recent image
            $date = $imgIndex->getNewestImage($ds['id']);
            
            $icon = "<div class='status-icon' style='background-color:%s' />";

            // Determine status from 1 (out of date) to 4 (recent)
            $elapsed = $now - strtotime($date);
            
            if ($elapsed < 60 * 60) {
                $icon = sprintf($icon, chooseTimeStampColor(0));
            } else if ($elapsed < 2 * 60 * 60) {
                $icon = sprintf($icon, chooseTimeStampColor(0.33));
            } else if ($elapsed < 3 * 60 * 60) {
                $icon = sprintf($icon, chooseTimeStampColor(0.66));
            } else {
                $icon = sprintf($icon, chooseTimeStampColor(1));
            }
            
            //$dateStr = getdate(strtotime($date));
            $timestamp = strtotime($date);
            $datetime = new DateTime("@$timestamp");

            printf("<tr><td>%s</td><td>%s</td><td align='center'>%s</td></tr>", 
                   $ds['name'], $datetime->format('M j H:i:s'), $icon);
        }
    ?>
    </table>
    </div>
</body>
</html>
