<?php
class TileStore {
	private $dbConnection;
	private $noImage     = "images/transparent.gif";
	private $kdu_expand  = "kdu_expand";
	private $tmpdir      = "/var/www/hv/tmp/";
	private $defaultRes  = 2.63; //Resolution of an EIT image: 2.63 arcseconds/px
	private $defaultZoom = 10;   //Zoom-level at which images are of this resolution. (FOR EIT...Need to look-up/define for each image-source!)
	
	public function __construct($dbConnection) {
		$this->dbConnection = $dbConnection;
	}
	
	/**
	 * getTile
	 * @return 
	 * @param $imageId	Int
	 * @param $zoom		Int
	 * @param $x		Int
	 * @param $y		Int
	 * @param $ts		Int
	 */
	function getTile($imageId, $zoom, $x, $y, $ts=512) {
		// Retrieve meta-information
		$imageInfo = $this->getMetaInfo($imageId);
		
		// Tile name & filepath
		$tilename = $imageId . "_" . $zoom . "_" . $x . "_" . $y . ".tif";
		$tilepath = $this->tmpdir . $tilename;
		
		// kdu_expand command
		$cmd = "$this->kdu_expand -i " . $imageInfo['uri'] . " -o $tilepath ";
		
		// Determine desired image resolution
		$zoomOffset = $this->defaultZoom - $zoom;
		$desiredRes = $this->defaultRes * (pow(2, $zoomOffset));
		
		// Scale Factor
		$scaleFactor = abs($zoomOffset);
		
		// Relative tile-size
		$relTs = $ts;
		
		// Case 1: JP2 image resolution = desired resolution
		// Nothing special to do...
		
		// Case 2: JP2 image resolution > desired resolution (use -reduce)
		if ($imageInfo['imgScaleX'] > $desiredRes) {
			$cmd .= "-reduce " . $scaleFactor . " ";
		}
		
		// Case 3: JP2 image resolution < desired resolution (get smaller tile and then enlarge)
		if ($imageInfo['imgScaleX'] < $desiredRes) {
			$relTs = $ts / (1 + $scaleFactor);
		}
		
		// Add desired region
		$cmd .= $this->getRegionString($imageInfo['width'], $imageInfo['height'], $x, $y, $relTs);

		// Check to see if tile exists (can this be done any earlier?)
		if ((($x * $ts) <= ($imageInfo['width']/2)) && (($y * $ts) <= ($imageInfo['height']/2))) {
			exec($cmd, $output, $return);
			//print_r($output);
			//print "<br><br>".$cmd;			
		}
		
		// Open in ImageMagick
		$im = new Imagick($tilepath);
		
		// Apply color table
		//$clut = new Imagick('/var/www/hv/images/color-tables/colortables_EIT/ctable_EIT_195.png');
		//$im->clutImage( $clut );
		
		// Resize if necessary
		if ($relTs < $ts)
			$im->scaleImage($ts, $ts);
			
		// Pad if tile is smaller than it should be
		if ($zoomOffset < 0) {
			// pad
			$clear = new ImagickPixel( "transparent" );
			$padx = $ts - $im->getImageWidth();
			$pady = $ts - $im->getImageHeight();
			$im->borderImage($clear, $padx, $pady);
			
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
			
		}
			
		
		// Convert to png
		$im->setFilename(substr($tilepath, 0, -3) . "png");
		$im->writeImage($im->getFilename);
		header( "Content-Type: image/png" );
		echo $im;
		
		
		exit();
	}
	
	/**
	 * getRegionString
	 * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
	 */
	function getRegionString($width, $height, $x, $y, $ts) {
		// Determine region to tile from (Note: assuming that image dimensions are a factor of TS)
		$numTilesX = $width / $ts;
		$numTilesY = $height / $ts;
		
		// Shift so that 0,0 now corresponds to the top-left tile
		$relX = (0.5 * $numTilesX) + $x;
		$relY = (0.5 * $numTilesY) + $y;
		
		// Convert to percentages
		$tsPercentX = 1 / $numTilesX;
		$tsPercentY = 1 / $numTilesY;

		$region = "-region {" . ($relY * $tsPercentY) . "," . ($relX * $tsPercentX) . "},{" . $tsPercentX . "," . $tsPercentY . "} ";
		
		return $region;
	}
	
	/**
	 * getMetaInfo
	 * @return 
	 * @param $imageId Object
	 */
	function getMetaInfo($imageId) {
		$query = "SELECT uri, width, height, imgScaleX, imgScaleY FROM image WHERE id=$imageId";

		// Query database
		$result = $this->dbConnection->query($query);
		if (!$result) {
		        echo "$query - failed\n";
		        die (mysql_error());
		}
		if (mysql_num_rows($result) > 0)
			return mysql_fetch_array($result, MYSQL_ASSOC);
		else
			return false;
	}

	function outputTile($imageId, $zoom, $x, $y) {
		// Cache-Lifetime (in minutes)
		$lifetime = 60;
		$exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
		header("Expires: " . $exp_gmt);
		header("Cache-Control: public, max-age=" . $lifetime * 60);
		// Special header for MSIE 5
		header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);

		#$numTiles = $this->getNumTiles($imageId, $zoom);
		#if ($numTiles >1) {
		$this->getTile($imageId, $zoom, $x, $y);
			
			#header('Content-type: image/jpeg');
			#if ($row) echo $row['tile'];
			#else readfile($this->noImage);
		

		#} else {
			#header('Content-type: image/jpeg');
			#readfile($this->noImage);
		#}
	}
}
?>
