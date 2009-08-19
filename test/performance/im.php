#!/usr/bin/php
<?php
/******************************************************************************
* Comparing PHP Imagick vs. exec Performance
* Keith Hughitt
* 2009/03/12
*
* To expand initial image + mask form the provided JP2
* image, use:
*
* kdu_expand -i c3_alpha.jp2 -raw_components -o image.pgm,mask.tif 
*			 -region \{0.25,0.25\},\{0.36,0.36\}
******************************************************************************/
$image = "image.pgm";
$mask  = "mask.tif";
$clut  = "ctable.png";
$final = "php_imagick_final.png";
$qual  = 60;

function using_imagick () {
	global $image, $mask, $clut, $final, $qual;
	$im = new Imagick($image);
	
	# Apply color lookup table
	$im->clutImage(new Imagick($clut));
	
	# Apply transparency mask
	$im->compositeImage(new Imagick($mask), imagick::COMPOSITE_COPYOPACITY, 0, 0);

	# Save the image
	$im->setCompressionQuality($qual);
	$im->setImageDepth(8);
	$im->setFormat("png");
	$im->writeImage($final);
}

function using_exec () {
	global $image, $mask, $clut, $final, $qual;
	exec("composite -compose CopyOpacity $mask $image -depth 8 -quality $qual intermediate.png");
	exec("convert intermediate.png -quality $qual -depth 8 $clut -clut $final");
}

// Main
if ($argv[1] == 1)
	using_imagick();
elseif ($argv[1] == 2)
	using_exec();
else {
	system("clear");
	echo "Usage:\n";
	echo " php im.php [1|2]\n";
	echo "    1 - Use PHP Imagick module\n";
	echo "    2 - Manually call ImageMagick using exec\n\n";
	echo "example: \"php im.php 1\"\n";	
}

?>
