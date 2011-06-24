<?php
/**
 * @package Helioviewer
 * @version 0.1
 */
/*
Plugin Name: Helioviewer.org - Latest Image
Description: Displays the most recent image of the Sun from Helioviewer.org.
Author: Keith Hughitt
Author URI: https://launchpad.net/~keith-hughitt
License: Mozilla Public License 1.1
Version: 0.1
*/

function helioviewer_widget() {
?>
<div id='helioviewer-wordpress-widget'>
    <h3 class="widget-title">Helioviewer.org</h3>
    <a href='http://www.helioviewer.org' target="_blank">
        <img src="http://helioviewer.org/api/?action=takeScreenshot&date=2099-01-01T00:00:00.000Z&layers=[SDO,AIA,AIA,304,1,100]&imageScale=9.6&x1=-1228.8&y1=-1228.8&x2=1228.8&y2=1228.8&display=true" alt="Latest AIA 304 image from Helioviewer.org." style='width: 100%;' />
    </a>
</div>
<?
}

function helioviewer_install()
{
    register_sidebar_widget(__('Helioviewer.org - Latest Image'), 'helioviewer_widget');
}

add_action("plugins_loaded", "helioviewer_install");
?>
