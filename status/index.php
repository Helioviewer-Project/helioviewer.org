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
        .instrument {font-weight: bold; cursor: pointer;}
        .datasource {display: none; background-color: #F9F9F9;}
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
    <tr style='font-weight:bold; background: #444; color: #fff;'>
        <th width='100'>Datasource</th>
        <th width='100'>Latest Image</th>
        <th width='50' align='center'>Status</th>
    </tr>    
    <?php
        include_once "../api/src/Database/DbConnection.php";
        include_once "../api/src/Database/ImgIndex.php";
        include_once "../api/src/Config.php";

       /**
        * Returns a CSS RGB triplet ranging from green (close to requested time)
        * to yellow (some deviation from requested time) to red (requested 
        * time differs strongly from actual time).
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
        
        /**
         * Computes the weight to use when choosing a color based off
         * the image cadence (min) and some reasonable lag time (max)
         * 
         * weight = e^[-(t_elapsed - t_min) / t_max]
         * 
         * @param int    $elapsed Number of elapsed seconds
         * @param string $inst    Name of the instrument
         * 
         * @return float a value from 0 (green) to 1 (red)
         */
        function computeStatusWeight($elapsed, $inst) {
            // Default values
            $min = 3600;  // 1 hr
            $max = 86400; // 24 hrs
            
            if ($inst == "EIT") {
                $min = 7 * 3600;
                $max = 48 * 3600;                
            } else if ($inst == "LASCO") {
                $min = 6 * 3600;
                $max = 48 * 3600;   
            } else if ($inst == "HMI") {
                $max = 12 * 3600;
            }

            return exp(- min(($elapsed - $min), 0) / $max);
        }
        
        $config = new Config("../settings/Config.ini");
        
        // Current time
        $now = time();
        
        $db = new Database_DbConnection();
        $imgIndex = new Database_ImgIndex();
        
        // Get a list of the datasources grouped by instrument
        $result = $db->query("SELECT * FROM instruments ORDER BY name");
        
        $instruments = array();

        while($instrument = mysqli_fetch_assoc($result)) {
            $instruments[$instrument['name']] = array();
            $datasources = $db->query(sprintf("SELECT * FROM datasources WHERE instrumentId=%d ORDER BY name", $instrument['id']));
            while($ds = mysqli_fetch_assoc($datasources)) {
                array_push($instruments[$instrument['name']], $ds);
            }
        }
        
        $tableRow = "<tr class='%s'><td>%s</td><td>%s</td><td align='center'>%s</td></tr>";
        
        // Create table of datasource statuses
        foreach($instruments as $name => $datasources) {
            $oldest = array(
                "weight"      => 0,
                "datetime"    => null,
                "icon"        => null
            );
            $maxElapsed = 0;
            $oldestDate = null;
            $subTableHTML = "";
            
            // Create table row for a single datasource
            foreach($datasources as $ds) {
                
                // Determine weight of status icon
                $date = $imgIndex->getNewestImage($ds['id']);
                $elapsed = $now - strtotime($date);
                $weight = computeStatusWeight($elapsed, $name);
                
                // Create status icon
                $icon = sprintf("<div class='status-icon' style='background-color:%s' />", chooseTimeStampColor($weight));
                
                // Convert to human-readable date
                $timestamp = strtotime($date);
                $datetime = new DateTime("@$timestamp");
                
                // CSS classes for row
                $classes = "datasource $name";

                // create HTML for subtable row
                $subTableHTML .= sprintf($tableRow, $classes, "&nbsp;&nbsp;&nbsp;&nbsp;" . $ds['name'], $datetime->format('M j H:i:s'), $icon);
                
                // If the elapsed time is greater than previous max store it
                if ($weight > $oldest['weight']) {
                    $oldest = array(
                        'weight'   => $weight,
                        'datetime' => $datetime,
                        'icon'     => $icon
                    );
                }
            }

            // Ignore datasources with no data
            if ($oldest['datetime']) {
                $datetime = $oldest['datetime'];
                printf($tableRow, "instrument", $name, $datetime->format('M j H:i:s'), $oldest['icon']);
                print($subTableHTML);
            }
        }
    ?>
    </table>
    
    <!-- Legend -->
    <!--
    <div id='legend' style='border: 1px solid black; margin: 0 auto; padding: 10px;'>
        <table>
            <tr>
                <th>Icon</th>
                <th>Status</th>
            </tr>
            <tr>
                <td><div class='status-icon' style='background-color:<?php echo chooseTimeStampColor(0);?>'></div></td>
                <td>:)</td>
            </tr>
            <tr>
                <td><div class='status-icon' style='background-color:<?php echo chooseTimeStampColor(0.33);?>'></div></td>
                <td>:|</td>
            </tr>
            <tr>
                <td><div class='status-icon' style='background-color:<?php echo chooseTimeStampColor(0.66);?>'></div></td>
                <td>:(</td>
            </tr>
            <tr>
                <td><div class='status-icon' style='background-color:<?php echo chooseTimeStampColor(1);?>'></div></td>
                <td>:*(</td>
            </tr>
        </table>
    </div>
    </div> -->

    <!-- jQuery -->
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js" type="text/javascript"></script>
    
    <!-- JavaScript -->
    <script type='text/javascript'>
    $(function() {
        $(".instrument").click(function (e) {
            var inst = $($(this).find("td")[0]).text();

            $(".datasource." + inst).toggle();
        });
    });    
    </script>
</body>
</html>
