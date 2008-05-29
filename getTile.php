<?php
require('phpClasses/autoload.php');

$dbConnection = new DbConnection();
$imgIndex = new ImgIndex($dbConnection);
$tileStore = new TileStore($dbConnection);

$imageId = $_GET['imageId']; //(array_key_exists('imageId', $_GET) && $_GET['imageId'] !== '' ? urldecode($_GET['id']) : $imgIndex->getDefaultMap());
$zoom = $_GET['zoom'];
$x = $_GET['x'];
$y = $_GET['y'];

$tileStore->outputTile($imageId, $zoom, $x, $y);
?>