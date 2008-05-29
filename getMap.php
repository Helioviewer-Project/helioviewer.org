<?php
require('phpClasses/autoload.php');

$dbConnection = new DbConnection();
$imgIndex = new ImgIndex($dbConnection);

$action = $_GET['action'];

switch ($action) {
  case 'getProperties':
    header('Content-type: application/json');
    echo json_encode($imgIndex->getProperties($_GET['map']));
    break;
  case 'getClosest':
    header('Content-type: application/json');
    foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
      $src[$field] = $_GET[$field];
    }
    echo json_encode($imgIndex->getClosestMap($_GET['timestamp'], $src));
    break;
}

/*
function getClosest($imgIndex, $timestamp) {
  foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
    $src[$field] = $_GET[$field];
  }
  return $imgIndex->getClosestMap($timestamp, $src);
}

function getProperties($imgIndex, $map) {
  return $imgIndex->getProperties($map);
}
*/
?>