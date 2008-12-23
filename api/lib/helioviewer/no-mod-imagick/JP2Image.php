<?php
require('DbConnection.php');

abstract class JP2Image {
	protected $noImage      = "images/transparent_512.gif";
	protected $kdu_expand   = "/home/esahelio/kakadu/bin/kdu_expand";
	protected $cacheDir     = "/home/esahelio/public_html/cache/";
	protected $jp2Dir       = "/home/esahelio/public_html/jp2/";
	protected $kdu_lib_path = "/home/esahelio/kakadu/lib";
	protected $baseScale    = 2.63; //Scale of an EIT image at the base zoom-level: 2.63 arcseconds/px
	protected $baseZoom     = 10;   //Zoom-level at which (EIT) images are of this scale.
	
	protected $db;
	protected $xRange;
	protected $yRange;
	protected $zoomLevel;
	protected $tileSize;
	protected $desiredScale;
	
	protected $image;
		
	protected function __construct($zoomLevel, $xRange, $yRange, $tileSize) {
		date_default_timezone_set('UTC');
		$this->db = new DbConnection();
		$this->zoomLevel = $zoomLevel;
		$this->tileSize  = $tileSize;
		$this->xRange    = $xRange;
		$this->yRange    = $yRange;

		// Determine desired image scale
		$this->zoomOffset   = $zoomLevel - $this->baseZoom;
		$this->desiredScale = $this->baseScale * (pow(2, $this->zoomOffset));
	}
	
	/**
	 * extractRegion
	 * @return Returns an Imagick object representing the extracted region
	 */
	protected function extractRegion($input, $output, $imageWidth, $imageHeight, $imageScale, $detector, $measurement) {
		$cmd = "$this->kdu_expand -i " . $input . " -o $output ";
		
		// Ratio of the desired scale to the actual JP2 image scale
		$desiredToActual = $this->desiredScale / $imageScale;
		
		// Scale Factor
		$scaleFactor = log($desiredToActual, 2);		
		
		$relTs = $this->tileSize * $desiredToActual;
		
		// Case 1: JP2 image resolution = desired resolution
		// Nothing special to do...

		// Case 2: JP2 image resolution > desired resolution (use -reduce)		
		if ($imageScale < $this->desiredScale) {
			$cmd .= "-reduce " . $scaleFactor . " ";
		}

		// Case 3: JP2 image resolution < desired resolution (get smaller tile and then enlarge)
		// Don't do anything yet...
		
		// Check to see if the tile requested is within the range of available data
		//$xRange = ceil($imageWidth  / (2 * $desiredToActual * $this->tileSize));
		//$yRange = ceil($imageHeight / (2 * $desiredToActual * $this->tileSize));
		//if ((abs($x) > $xRange) || (abs($y) > $yRange)) {
		//	print "Out of range tile request... Range- x: $xRange, y: $yRange";
		//	exit();
		//}
		
		// Add desired region
		$cmd .= $this->getRegionString($imageWidth, $imageHeight, $relTs);
		//print $cmd;

		// Execute the command
		$ret = 1;

		// Work-around: Keep trying until successful
		exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . "$this->kdu_lib_path; " . escapeshellcmd($cmd), $out, $ret);
	
		// On fail, write to Helioviewer log 
		if ($ret != 0) {
			$log = "/home/esahelio/www/HelioviewerLog.txt";
			$fp  = fopen($log, 'a');
			$time = date('Y-m-d h:m:s');
			fwrite($fp, $time . ": '$cmd'" . "\n");
			fclose($fp);
		}
		
		// Open in ImageMagick
		// $im = new Imagick($output);
		$tif = $output;

		// Work-around: Call Image-magick manually...
		$imcmd = "convert $tif ";

		// For images with transparent components, convert pixels with value "0" to be transparent.
		if ($measurement == "0WL")
			$imcmd .= "-transparent black ";
			//exec("convert -transparent black $tif $tif", $out, $ret);
			//$im->paintTransparentImage(new ImagickPixel("black"), 0,0);
		
		// Apply color table
		if (($detector == "EIT") || ($measurement == "0WL")) {
			//$clut = new Imagick($this->getColorTable($detector, $measurement));
			//$im->clutImage( $clut );
			$clut = $this->getColorTable($detector, $measurement);
			$imcmd .= "$clut -clut ";
			//exec("convert $tif $clut -clut $tif", $out, $ret);

		}
		
		// Pad if tile is smaller than it should be (Case 2)
		if ($imageScale < $this->desiredScale) {
			//$this->padImage($im, $this->tileSize, $this->xRange["start"], $this->yRange["start"]);
			$imcmd .= $this->padImage($tif, $this->tileSize, $this->xRange["start"], $this->yRange["start"], $relTs);
		}

		// Resize if necessary (Case 3)
		if ($relTs < $this->tileSize)
			$imcmd .= "-geometry " . $this->tileSize . "x" . $this->tileSize . "! ";
			//exec("convert -geometry " . $this->tileSize . "x" . $this->tileSize . "! $tif $tif", $out, $ret);
			//$im->scaleImage($this->tileSize, $this->tileSize);

		exec($imcmd . "$tif");

		//echo $imcmd . $tif;

		//return $im;
		return $tif;
	}
	
	/**
	 * getRegionString
	 * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
	 */
	public function getRegionString($width, $height, $ts) {
		// Number of tiles for the entire image
		$imgNumTilesX = max(2, $width / $ts);
		$imgNumTilesY = max(2, $height / $ts);
	
		// Shift so that 0,0 now corresponds to the top-left tile
		$relX = (0.5 * $imgNumTilesX) + $this->xRange["start"];
		$relY = (0.5 * $imgNumTilesY) + $this->yRange["start"];
		
		// number of tiles
		$numTilesX = min($imgNumTilesX - $relX, $this->xRange["end"] - $this->xRange["start"] + 1);
		$numTilesY = min($imgNumTilesY - $relY, $this->yRange["end"] - $this->yRange["start"] + 1);
		
		//print "numTilesX: $numTilesX, numTilesY: $numTilesY <br>";
		//print "imgNumTilesX: $imgNumTilesX, imgNumTilesY: $imgNumTilesY <br>";
		//exit();

		// Convert to percentages
		$tsPercentX = 1 / $imgNumTilesX;
		$tsPercentY = 1 / $imgNumTilesY;
		
		// Width and Height as a fraction of 1
		$width  = $numTilesX * $tsPercentX;
		$height = $numTilesY * $tsPercentY;
		
		// Starting coordinates
		$top  = $relY * $tsPercentY;
		$left = $relX * $tsPercentX;

		// Exit if either of the dimensions are not valid
		if (($width <= 0) || ($width > 1) || ($height <= 0) || ($height > 1)) {
			print "Error: Invalid tile dimensions.";
			exit();
		}
		
		// Make sure region is within bounds
		if (($top < 0) || ($top >= 1) || ($left < 0) || ($left >= 1)) {
			print "Error: Requested region out of bounds. Start coordinates: $relX, $relY";
			exit();
		}

		//$region = "-region \{$top,$left\},\{$height,$width\}";
		$region = "-region {" . $top . "," . $left . "},{" . $height . "," . $width . "} ";

		return $region;
	}
	
	/**
	 * padImage
	 */
	//function padImage($im, $ts, $x, $y) {
	function padImage($tif, $ts, $x, $y, $relTs) {
		// First pad all sides, then trim away unwanted parts
		//$clear = new ImagickPixel( "transparent" );
		//$padx = $ts - $im->getImageWidth();
		//$pady = $ts - $im->getImageHeight();
		$padx = $ts - $relTs;
		$pady = $ts - $relTs;
		
		//$im->borderImage($clear, $padx, $pady);
		//exec("convert $tif -background transparent -gravity center -extent 380x144 test2.png

		// left
		//if ($x <= -1)
		//	$im->cropImage($ts, $ts + $pady, 0, 0);
		
		// top-left
		if (($x == -1) && ($y == -1))
			return "-background transparent -gravity SouthEast -extent $ts" . "x" . "$ts ";
			//exec("convert $tif -background transparent -gravity SouthEast -extent " . $ts . "x" . $ts . " $tif", $out, $ret);
			//$im->cropImage($ts, $ts, 0, 0);

		// top-right
		if (($x == 0) && ($y == -1))
			return "-background transparent -gravity SouthWest -extent $ts" . "x" . "$ts ";
			//exec("convert $tif -background transparent -gravity SouthWest -extent " . $ts . "x" . $ts . " $tif", $out, $ret);
//			$im->cropImage($ts, $ts, $padx, 0);

		// bottom-right
		if (($x == 0) && ($y == 0))
			return "-background transparent -gravity NorthWest -extent $ts" . "x" . "$ts ";
			//exec("convert $tif -background transparent -gravity NorthWest -extent " . $ts . "x" . $ts . " $tif", $out, $ret);
			//$im->cropImage($ts, $ts, $padx, $pady);

		// bottom-left
		if (($x == -1) && ($y == 0))
			return "-background transparent -gravity NorthEast -extent $ts" . "x" . "$ts ";
			//exec("convert $tif -background transparent -gravity NorthEast -extent " . $ts . "x" . $ts . " $tif", $out, $ret);
			//$im->cropImage($ts, $ts, 0, $pady);

		/**
		// top-left
		if (($x == -1) && ($y == -1))
			$im->cropImage($ts, $ts, 0, 0);

		// top-right
		if (($x == 0) && ($y == -1))
			$im->cropImage($ts, $ts, $padx, 0);

		// bottom-right
		if (($x == 0) && ($y == 0))
			$im->cropImage($ts, $ts, $padx, $pady);

		// bottom-left
		if (($x == -1) && ($y == 0))
			$im->cropImage($ts, $ts, 0, $pady);
		*/
	}
	
	private function getColorTable($detector, $measurement) {
		if ($detector == "EIT") {
			return "/home/esahelio/public_html/images/color-tables/ctable_EIT_$measurement.png";
		}
		else if ($detector == "0C2") {
			return "/home/esahelio/public_html/images/color-tables/ctable_idl_3.png";
		}
		else if ($detector == "0C3") {
			return "/home/esahelio/public_html/images/color-tables/ctable_idl_1.png";
		}		
	}
	
	public function display() {
		// Cache-Lifetime (in minutes)
		$lifetime = 60;
		$exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
		header("Expires: " . $exp_gmt);
		header("Cache-Control: public, max-age=" . $lifetime * 60);

		// Special header for MSIE 5
		header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);
		
		header( "Content-Type: image/png" );
		//echo $this->image;
	    readfile($this->image);
	}
}
?>
