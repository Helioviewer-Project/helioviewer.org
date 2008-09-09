<?php
//Configuration
$root = '/var/www/hv/tiles/';
$zoom = 13;

//Get query information
$year = $_GET['year'];
$month = $_GET['month'];
$day = $_GET['day'];
$hour = $_GET['hour'];
$min = $_GET['min'];
$sec = $_GET['sec'];
$wl = $_GET['wavelength'];

//Some more hard-coded information
$c2_path = 'soho/LAS/0C2/0WL/';
$c3_path = 'soho/LAS/0C3/0WL/';
$eit_path = 'soho/EIT/EIT/' . $wl . "/";

//EIT
/*
$eitarray = array();
array_push($eitarray, 'images/2003_10_19_120000_soho_EIT_EIT_195-13-00-00-C-n011.229-p011.229.jpg',
					  'images/2003_10_19_120000_soho_EIT_EIT_195-13-01-00-C.jpg',
					  'images/2003_10_19_120000_soho_EIT_EIT_195-13-00-01-C.jpg',
					  'images/2003_10_19_120000_soho_EIT_EIT_195-13-01-01-C.jpg');
					  * */

$filepath = $root . $year . "/" . $month . "/" . $day . "/" . $hour" . "/";
$timestamp = $year . "_" . $month . "_" . $day . "_" . $hour . $min . $sec . "_";

$eitfull = $filepath . $eit_path .

$eitarray = array();
array_push($eitarray,

$eitImg = new Imagick ($eitarray);

$eit = $eitImg->montageImage( new imagickdraw(), "2x2+0+0", "512x512+0+0", imagick::MONTAGEMODE_UNFRAME, "0x0+0+0" );
$eit->setImageFormat("png");

//LASCO
$las = new Imagick("images/las.png");
$eit->compositeImage($las, $las->getImageCompose(), 0, 0);

header( "Content-Type: image/png" );
echo $eit;

?>
