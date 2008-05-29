<?php
require('phpClasses/autoload.php');

$dbConnection = new DbConnection();
$imgIndex = new ImgIndex($dbConnection);

$action = $_GET['action'];
// eventually this will change to id
$queryForField = 'abbreviation';

switch ($action) {
  case 'getProperties':
    header('Content-type: application/json');
    echo json_encode($imgIndex->getProperties($_GET['imageId']));
    break;
  case 'getClosest':
    header('Content-type: application/json');
    foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
      $src["$field.$queryForField"] = $_GET[$field];
    }
    echo json_encode($imgIndex->getClosestImage($_GET['timestamp'], $src));
    //$imgIndex->getClosestImage($_GET['timestamp'], $src);
    break;
}
?>
