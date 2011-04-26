<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Helioviewer.org - Data Monitor</title>
    <style type='text/css'>
        #header {font-size:2em; vertical-align: middle; margin-top: 15px; margin-bottom: 26px;}
        #headerText {display: inline-block; vertical-align: super; font-family: arial,helvetica,liberation sans,bitstream vera sans,freesans,clean,sans-serif; font-size:1.2em;}
    </style>
</head>
<body>
    <div id='main' style='width:50%; margin-left:auto; margin-right:auto;'>
	<div id="header">
        <img src="../resources/images/logos/hvlogo1s_transparent_logo.png" alt="Helioviewer logo" />
        <div id='headerText'>The Helioviewer Project - Data Monitor</div>
    </div>

    <table style='width:70%;'>
    <tr style='font-weight:bold;'>
        <td width='150'>Datasource</td>
        <td width='200'>Latest Image</td>
        <td width='50' align='center'>Status</td>
    </tr>    
    <?php
        include_once "../api/src/Database/DbConnection.php";
        include_once "../api/src/Database/ImgIndex.php";
        include_once "../api/src/Config.php";
        
        $config = new Config("../settings/Config.ini");
        date_default_timezone_set('UTC');
        
        // Current time
        $now = time();
        
        $db = new Database_DbConnection();
        $imgIndex = new Database_ImgIndex();
        
        $datasources = $db->query("SELECT * FROM datasources");

        // Add an entry to the table for each data source
        while($ds = mysqli_fetch_assoc($datasources)) {
            // Get date of most recent image
            $date = $imgIndex->getNewestImage($ds['id']);
            
            $img = "<img src='status_%02d.png' alt='datasource status' />";

            // Determine status from 1 (out of date) to 4 (recent)
            $elapsed = $now - strtotime($date);
            
            if ($elapsed < 60 * 60) {
                $img = sprintf($img, 4);
            } else if ($elapsed < 2 * 60 * 60) {
                $img = sprintf($img, 3);
            } else if ($elapsed < 3 * 60 * 60) {
                $img = sprintf($img, 2);
            } else {
                $img = sprintf($img, 1);
            }

            printf("<tr><td>%s</td><td>%s</td><td align='center'>%s</td></tr>", 
                   $ds['name'], $date, $img);
        }
    ?>
    </table>
    </div>
</body>
</html>
