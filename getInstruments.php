<?php

header("Content-type: application/json");
require('phpClasses/autoload.php');

$dbConnection = new DbConnection();
$query = "SELECT DISTINCT instrument.name as instrument, " .
         "detector.name as detector, " .
         "observatory.name as observatory, " .
         "measurement.name as measurement " .
         "FROM observatory " .
            "INNER JOIN instrument ON observatory.id = instrument.observatoryId " .
            "INNER JOIN detector ON detector.instrumentId = instrument.id " .
            "INNER JOIN measurement ON measurement.detectorId = detector.id " .
         "GROUP BY instrument.name;";
         
$result = $dbConnection->query($query);
$instruments = array();

while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
    array_push($instruments, $row);
}
echo json_encode($instruments);
?>
