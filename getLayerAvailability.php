<?php
require('phpClasses/autoload.php');
$dbConnection = new DbConnection();

//return format
$return = $_GET['type'];

//master array
$observatories = array();

//query observatories
$query = "SELECT name FROM observatory";
$result = $dbConnection->query($query);
while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
    array_push($observatories, $row["name"]);
}

if ($return == "json") {
    //header("Content-type: application/json");
    echo json_encode($observatories);
}

?>
