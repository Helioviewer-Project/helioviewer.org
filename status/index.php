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
    <link rel="stylesheet" href="status.css" />
    <script src="http://code.jquery.com/jquery.min.js" type="text/javascript"></script>
    <script src="status.js" type="text/javascript"></script>
</head>
<body>
    <div id='main'>
	<div id="header">
        <img src="../resources/images/logos/hvlogo1s_transparent_logo.png" alt="Helioviewer logo" />
        <div id='headerText'>The Helioviewer Project - Data Monitor</div>
        <div id='currentTime'>Current time: <?php echo $now;?></div>
    </div>
    
    <!-- Legend -->
    <div id='legend-container'>
        <div id='legend'>
            <img class='status-icon' src='icons/status_icon_green.png' alt='green status icon' />
            <span class='status-text'>Up to date</span>
            <img class='status-icon' src='icons/status_icon_yellow.png' alt='yellow status icon' />
            <span class='status-text'>Lagging</span>
            <img class='status-icon' src='icons/status_icon_orange.png' alt='orange status icon' />
            <span class='status-text'>Lagging a lot</span>
            <img class='status-icon' src='icons/status_icon_red.png' alt='red status icon' />
            <span class='status-text'>Uh oh!</span>
            <img class='status-icon' src='icons/status_icon_gray.png' alt='gray status icon' />
            <span>Inactive</span>
        </div>
    </div>

    <table id='statuses'>
    <tr id='status-headers'>
        <th width='100'>Image</th>
        <th width='120'>Latest Image</th>
        <th width='120'>Source</th>
        <th width='50' align='center'>Status <span id='info'>(?)</span></th>
    </tr>    
    <?php
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
            $t4 = 604800; // 1 week
            
            if ($inst == "EIT") {
                $t1 = 14 * 3600;
                $t2 = 24 * 3600;
                $t3 = 48 * 3600;
            } else if ($inst == "HMI") {
                $t1 = 4 * 3600;
                $t2 = 8 * 3600;
                $t3 = 24 * 3600;
            } else if ($inst == "LASCO") {
                $t1 = 8 * 3600;
                $t2 = 12 * 3600;
                $t3 = 24 * 3600;
            } else if ($inst == "SECCHI") {
                $t1 = 84  * 3600; // 3 days 12 hours
                $t2 = 120  * 3600; // 5 days 
                $t3 = 144 * 3600; // 6 days
            }
 
            if ($elapsed <= $t1) {
                return 1;
            } else if ($elapsed <= $t2) {
                return 2;
            } else if ($elapsed <= $t3) {
                return 3;
            } else if ($elapsed <= $t4){
                return 4;
            } else {
                return 5;
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
                4 => "red",
                5 => "gray"
            );
            
            $icon = "<img class='status-icon' src='icons/status_icon_%s.png' alt='%s status icon' />";
            
            return sprintf($icon, $levels[$level], $levels[$level]);
        }
        
        $config = new Config("../settings/Config.ini");
        
        // Current time
        $now = time();
        
        $imgIndex = new Database_ImgIndex();
        
        // Get a list of the datasources grouped by instrument
        $instruments = $imgIndex->getDataSourcesByInstrument();

        $tableRow = "<tr class='%s'><td>%s</td><td>%s</td><td>%s</td><td align='center'>%s</td></tr>";
        
        // Create table of datasource statuses
        foreach($instruments as $name => $datasources) {
            $oldest = array(
                "level"    => 0,
                "datetime" => new DateTime(),
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

                $datetime = new DateTime();
                $datetime->setTimestamp($timestamp);
                
                // CSS classes for row
                $classes = "datasource $name";

                // create HTML for subtable row
                $subTableHTML .= sprintf($tableRow, $classes, "&nbsp;&nbsp;&nbsp;&nbsp;" . $ds['name'], $datetime->format('M j H:i:s'), "", $icon);
                
                // If the elapsed time is greater than previous max store it
                if ($datetime < $oldest['datetime']) {
                    $oldest = array(
                        'level'   => $level,
                        'datetime' => $datetime,
                        'icon'     => $icon
                    );
                }
            }

            // Data providers
            $providers = array(
                "lmsal"    => "<a class='provider-link' href='http://www.lmsal.com/' target='_blank'>LMSAL</a>",
                "stanford" => "<a class='provider-link' href='http://jsoc.stanford.edu/' target='_blank'>Stanford</a>",
                "sdac"     => "<a class='provider-link' href='http://umbra.nascom.nasa.gov/' target='_blank'>SDAC</a>"
            );

            // Attribution
            $attributions = array(
                "AIA"    => $providers['lmsal'] . " / " . $providers['stanford'],
                "HMI"    => $providers['lmsal'] . " / " . $providers['stanford'],
                "EIT"    => $providers['sdac'],
                "MDI"    => $providers['sdac'],
                "LASCO"  => $providers['sdac'],
                "SECCHI" => $providers['sdac']
            );

            // Only include datasources with data
            if ($oldest['datetime'] and $name !=="MDI") {
                if (isset($attributions[$name])) {
                    $attribution = $attributions[$name];
                } else {
                    $attribution = "";
                }
                
                $datetime = $oldest['datetime'];
                printf($tableRow, "instrument", $name, $datetime->format('M j H:i:s'), $attribution, $oldest['icon']);
                print($subTableHTML);
            }
        }
    ?>
    </table>
    </div>
</body>
</html>
