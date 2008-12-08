<?php
/**
 * Helioviewer.org - getFitsHeader
 * By Keith Hughitt
 * December 2008
 */
require('lib/helioviewer/DbConnection.php');

getFitsHeader($_GET['imageId']);

function getFitsHeader ($id) {
	$db  = new DbConnection();
	$sql = "SELECT uri FROM image WHERE id=$id;";
	
	$row = mysql_fetch_array($db->query($sql), MYSQL_ASSOC);
	$url = $row['uri'];
	
	// Query header information using Exiftool
	$cmd = "exiftool $url | grep Fits | grep -v Descr";
	//print "<span style='color:red'>$cmd</span><br><br>";
	exec($cmd, $out, $ret);
	
	//  cmd = "exiftool %s | grep \"%s [^D]\"" % (img, tag) 
	
	//print_r($out);
	$fits = array();
	foreach ($out as $index => $line) {
		//print strtoupper($line) . "<br>";
		$data = explode(":", $line);
		$param = substr(strtoupper(str_replace(" ", "", $data[0])), 4);
		$value = $data[1];
		//print "$param: $value <br>";
		array_push($fits, $param . ": " . $value);
	}
	
	header('Content-type: application/json');
	echo json_encode($fits);
}

?>
