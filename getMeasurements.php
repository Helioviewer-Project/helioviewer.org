<?php
header("Content-type: application/json");
require('phpClasses/autoload.php');

$dbConnection = new DbConnection();
$query = "SELECT DISTINCT measurement.name as measurement, measurementType.name as type " .
         "FROM measurement " . 
         "INNER JOIN detector ON measurement.detectorId = detector.id " . 
         "INNER JOIN measurementType ON measurement.measurementTypeId = measurementType.id " . 
         "WHERE detector.name = \"" . $_POST['detector'] . "\";";

//echo $query;
$result = $dbConnection->query($query);
$measurements = array();

while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
    array_push($measurements, $row);
}
echo json_encode($measurements);
?>