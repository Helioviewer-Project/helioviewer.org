<?php

require('phpClasses/autoload.php');
$dbConnection = new DbConnection();
$return = $_GET['type'];

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

if ($return == "json") {
    header("Content-type: application/json");
    echo json_encode($instruments);
}

else if ($return == "html") {
?>
<div style="float: left; width: 40%; color: white;">Instrument:</div>
<div style="float: right; width: 60%;">
    <select class='instrument-select'>
        <option value="explanation">Select Instrument</option>
<?php
    foreach ($instruments as $inst) {
        echo "        <option value='$inst[instrument]'>$inst[instrument]</option>\n";
    }
?>
    </select>
</div>
<?php
}
?>
