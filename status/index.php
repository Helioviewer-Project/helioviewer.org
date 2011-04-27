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
        .datasource {display: none; color: gray;}
        .status-icon {width: 18px; height: 18px;}
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
         * computeStatusLevel
         * 
         * @param {int}    $elapsed
         * @param {string} $inst
         */
        function computeStatusLevel($elapsed, $inst) {
            // Default values
            $t1 = 7200;  // 2 hrs
            $t2 = 14400; // 4 hrs
            $t3 = 43200; // 12 hrs
            $t4 = 86400; // 24 hrs
            
            if ($inst == "EIT") {
                $t1 = 7 * 3600;
                $t2 = 12 * 3600;
                $t3 = 24 * 3600;
                $t4 = 48 * 3600;                
            } else if ($inst == "LASCO") {
                $t1 = 6 * 3600;
                $t2 = 12 * 3600;
                $t3 = 24 * 3600;
                $t4 = 48 * 3600;   
            }
 
            if ($elapsed <= $t1) {
                return 1;
            } else if ($elapsed <= $t2) {
                return 2;
            } else if ($elapsed <= $t3) {
                return 3;
            } else {
                return 4;
            }
        }
        
        /**
         * getStatusIcon
         * 
         * @var unknown_type
         */
        function getStatusIcon($level) {
            $levels = array(
                1 => "green",
                2 => "yellow",
                3 => "orange",
                4 => "red"
            );
            
            return sprintf("<img class='status-icon' src='status_icon_%s.png' alt='%s status icon' />", $levels[$level], $levels[$level]);
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
                "level"    => 0,
                "datetime" => null,
                "icon"     => null
            );
            $maxElapsed = 0;
            $oldestDate = null;
            $subTableHTML = "";
            
            // Create table row for a single datasource
            foreach($datasources as $ds) {
                
                // Determine status icon to use
                $date = $imgIndex->getNewestImage($ds['id']);
                $elapsed = $now - strtotime($date);
                $level = computeStatusLevel($elapsed, $name);
                
                // Create status icon
                $icon = getStatusIcon($level);

                // Convert to human-readable date
                $timestamp = strtotime($date);
                $datetime = new DateTime("@$timestamp");
                
                // CSS classes for row
                $classes = "datasource $name";

                // create HTML for subtable row
                $subTableHTML .= sprintf($tableRow, $classes, "&nbsp;&nbsp;&nbsp;&nbsp;" . $ds['name'], $datetime->format('M j H:i:s'), $icon);
                
                // If the elapsed time is greater than previous max store it
                if ($level > $oldest['level']) {
                    $oldest = array(
                        'level'   => $level,
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
                <td></td>
                <td>:)</td>
            </tr>
            <tr>
                <td></td>
                <td>:|</td>
            </tr>
            <tr>
                <td></td>
                <td>:(</td>
            </tr>
            <tr>
                <td></td>
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
        var locateStorageEnabled, jsonEnabled;

        // Check for localStorage and native JSON support
        locateStorageEnabled = ('localStorage' in window) && 
                                window['localStorage'] !== null;

        jsonEnabled = typeof (JSON) !== "undefined";

        // Initialize localStorage
        if (locateStorageEnabled && jsonEnabled) {
            if (!localStorage.dataMonitorOpenGroups) {
                localStorage.dataMonitorOpenGroups = "[]";
            } else {
                $.each(JSON.parse(localStorage.dataMonitorOpenGroups), function (i, inst) {
                    $(".datasource." + inst).show();
                });
            }
        }

        // Instrument click-handler
        $(".instrument").click(function (e) {
            var inst = $($(this).find("td")[0]).text();
            $(".datasource." + inst).toggle();

            if (locateStorageEnabled && jsonEnabled) {
                var open, index;

                open = JSON.parse(localStorage.dataMonitorOpenGroups);

                // Add or remove instrument from list of opened groups
                index = $.inArray(inst, open);
                if (index == -1) {
                    open.push(inst);
                } else {
                    open.splice(index, 1);
                }
                localStorage.dataMonitorOpenGroups = JSON.stringify(open);
            }
        });
    });
    </script>
</body>
</html>
