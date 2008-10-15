<?php
    header("Content-type: application/json");
    $url = "http://washington.tm.uni-karlsruhe.de/Dispatcher/resources/eventCatalogs?" . $_SERVER['QUERY_STRING'];
    echo file_get_contents($url);
?>
