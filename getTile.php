<?php
require('phpClasses/autoload.php');

$dbConnection = new DbConnection();
$imgIndex = new ImgIndex($dbConnection);
$tileStore = new TileStore($dbConnection);

$map = (array_key_exists('map', $_GET) && $_GET['map'] !== '' ? urldecode($_GET['map']) : $imgIndex->getDefaultMap());
$zoom = $_GET['zoom'];
$x = $_GET['x'];
$y = $_GET['y'];

$tileStore->outputTile($map, $zoom, $x, $y);
?>