<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Event-related parsing methods. Any changes to how events are specified or should be parsed, will be made here.
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

/**
 * Takes in a polygon string in the format "POLYGON((....))" and parses it to 
 * find a rectangular region that includes the event.
 * 
 * @param string $polygon -- The polygon string in the above format
 * 
 * @return array 
 */
function polygonToBoundingBox($polygon)
{
    $coordinates = explode(",", str_replace(array("POLYGON", "(", ")"), "", $polygon));
    $x = array();
    $y = array();
    
    foreach ($coordinates as $pair) {
        $xy = explode(" ", $pair);
        $x[] = (float)$xy[0];
        $y[] = (float)$xy[1];
    }

    // sort all points by increasing value
    sort($x);
    sort($y);
        
    return array(
        "x1" => $x[0],
        "x2" => end($x),
        "y1" => $y[0],
        "y2" => end($y)
    );	
}

/**
 * Some temporarily hard-coded assumptions about what layers should be
 * used for certain event types
 * 
 * @param string $eventType The two-letter code for event type
 * 
 * @return array
 */
function getLayerInfoForEventType($eventType)
{
    $sourceIds  = array();
    $imageScale = 0.5999;
    switch($eventType) {
    case "AR":
        $sourceIds = array(10, 11, 12, 14);
        break;
    case "FL":
        $sourceIds = array(8, 9, 10, 11, 12, 13, 14, 15, 16, 17);
        break;
    default: 
        $sourceIds = array(10, 11, 12, 13, 14, 15);
        break;
    }
    
    return array("sourceIds" => $sourceIds, "imageScale" => $imageScale);
}
?>