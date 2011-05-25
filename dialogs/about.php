<?php
if (!$config = parse_ini_file("../settings/Config.ini"))
    die("Missing config file!");
?>
<img src="resources/images/logos/about_white.png" alt="Helioviewer.org Logo"><br>
<div style="width:100%; text-align: center;">
    <span style="margin-left: auto; margin-right: auto; font-size:small;"><?php printf("Last Updated: %s (2.2.0)", $config["last_update"]); ?></span>
</div>
<br />

Helioviewer.org is an open-source project for the visualization of solar and heliospheric data. 
The project is funded by <acronym title="European Space Agency">ESA</acronym> and <acronym title="National Aeronautics and Space Administration">NASA</acronym>. 

<br /><br />

<!-- The Helioviewer Team -->
<div style='width:100%; text-align:center;'>
    <span style="margin-left:auto; margin-right: auto;">
        For more information, please visit our <a href="http://helioviewer.org/wiki/Main_Page" style="text-decoration: underline;" class="light">Wiki</a>.
    </span>
</div>
