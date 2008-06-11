<?php
require('phpClasses/autoload.php');

$urlPrefix = 'http://virtualsolar.org/test/catalog/';

$srcs = $_REQUEST['src'];
$dates = array($_REQUEST['dateStart'], $_REQUEST['dateEnd']);
$showNonDisplayable = $_REQUEST['showNonDisplayable'];

$events = VsoEvent::getEvents($srcs, $dates, $showNonDisplayable);

echo json_encode($events);
?> 