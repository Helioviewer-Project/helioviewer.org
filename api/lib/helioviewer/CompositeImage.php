<?php
/*
 * Created on Sep 12, 2008
 * Last modified July 29, 2009 -- Jaclyn Beck
 * by Keith Hughitt
 */

require 'SubFieldImage.php';

/**
 * @fileoverview Abstract class used for screenshots and movies. Handles most of the functionality and building.
 */
abstract class CompositeImage {
	protected $composite;
	protected $zoomLevel;
	protected $options;
	protected $imageSize;
	protected $tmpDir;
	protected $layerImages;
	protected $transImageDir;
	protected $compositeImageDir;

	/**
	 * Constructor
	 * @description Creates folder directories where necessary
	 * @param object $zoomLevel a number between 8-15, default is 10.
	 * @param object $options an array with ["edges"] => true/false, ["sharpen"] => true/false
	 * @param string $tmpDir -- The temporary directory where images are cached
	 */
	protected function __construct($zoomLevel, $options, $tmpDir) { 
		date_default_timezone_set('UTC');

		$this->zoomLevel  	= $zoomLevel;
		$this->options    	= $options;
		$this->tmpDir 	   	= $tmpDir;

		// Create the temp directory where images will be stored.
		// $this->tmpDir is determined in either the MovieFrame or Screenshot class.
		if(!file_exists($this->tmpDir)) {
			mkdir($this->tmpDir);
			chmod($this->tmpDir, 0777);
		}

		// Directory where all intermediate images with opacity levels of < 100 are created and stored		
		$this->transImageDir = CONFIG::CACHE_DIR . "transparent_images/";
		if(!file_exists($this->transImageDir)) {
			mkdir($this->transImageDir);
			chmod($this->transImageDir, 0777);
		}			
		
		$this->compositeImageDir = CONFIG::CACHE_DIR . "composite_images/";
		if(!file_exists($this->compositeImageDir)) {
			mkdir($this->compositeImageDir);
			chmod($this->compositeImageDir, 0777);
		}
	}

	/**
	 * Builds each image separately and then composites them together if necessary.
	 */	
	protected function compileImages() {
		// builtImages array holds the filepaths for all 'built' images.
		// opacities array holds the "opacityValue" and "opacityGroup" for each image.
		$builtImages = array();
		$opacities 	 = array("value" => array(), "group" => array());
		
		// At this point, layerImages should be an array of image strings
		try  {		
			if(empty($this->layerImages)) {
				throw new Exception("Error: No valid layers specified in layerImages[" . $this->layerImages . "]");
			}
			
			// For each layer, extract info from the string and create a SubfieldImage out of it.
			// Add the subfield image to an array and add its opacity levels to another array	
			foreach($this->layerImages as $image) {
				// Each $image is a string: "uri,xStart,xSize,yStart,ySize,offsetX,offsetY,opacity,opacityGrp";
				$imageInfo = explode(",", $image);
				$uri = $imageInfo[0];
	
				$xRange = array("start" => $imageInfo[1], "end" => $imageInfo[2]);
				$yRange = array("start" => $imageInfo[3], "end" => $imageInfo[4]);
				
				$this->hcOffset = array("x" => $imageInfo[5], "y" => $imageInfo[6]);				
				array_push($opacities["value"], $imageInfo[7]);
				array_push($opacities["group"], $imageInfo[8]);
		
				$subFieldImage = new SubFieldImage($uri, $this->zoomLevel, $xRange, $yRange, $this->imageSize, $this->hcOffset);
				$filepath = $subFieldImage->getCacheFilepath();

				if(!file_exists($filepath))
					throw new Exception("Cached image $filepath does not exist.");
					
				array_push($builtImages, $filepath);
			}
		}	
		catch(Exception $e) {
            $error = "[compileImages][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(Config::ERROR_LOG, $error,FILE_APPEND);
            print $error;
			die();
		}
		
		// All layers should be built, and $builtImages should contain all of the subfield images.
		// Composite images on top of one another if there are multiple layers.
		if (sizeOf($this->layerImages) > 1) {
			$this->composite = $this->buildComposite($builtImages, $opacities);
		} 
		
		// If the image is identified by a frameNum, just copy the image to the movie directory
		elseif (isset($this->frameNum))  {
			$builtImages[0] = $this->watermark($builtImages[0]);
			$cacheImg = $this->cacheFileDir . $this->frameNum . ".tif";
			copy($builtImages[0], $cacheImg);
			$this->composite = $cacheImg;
		}
				
			// Otherwise, the image is a screenshot and needs to be converted into a png.
		else {
			$builtImages[0] = $this->watermark($builtImages[0]);
			$cmd = CONFIG::PATH_CMD . " && convert " . $builtImages[0] . " " . $this->cacheFileDir . $this->id . ".png";
			exec($cmd, $out, $ret);

			$this->composite = $this->cacheFileDir . $this->id . ".png";
		}

		//Optional settings
/*		if ($this->options['enhanceEdges'] == "true")
			$this->composite->edgeImage(3);

		if ($this->options['sharpen'] == "true")
			$this->composite->adaptiveSharpenImage(2,1);
*/
	}
	
/*	protected function buildImage($image) {
//		$filepath = $this->getFilepath($image['uri']);
		
		// File extension
//		if ($layer->instrument() == "LAS")
			$ext = "png";
//		else
//			$ext = "jpg";

		$image->setImageFormat($ext);
		// Set background to be transparent for LASCO
		if ($inst == "LAS")
			$tiles->setBackgroundColor(new ImagickPixel("transparent"));

		return $image;
	}
*/
	/**
	 * @description Composites a watermark (the timestamps of the image) onto the lower left corner.
	 * 				Layer names are added togeter as one string, and timestamps are added as a separate string,
	 * 				to line them up nicely.
	 * 				An example string would  be: -annotate +20+0 'EIT 304\nLAS C2 WL\n'
	 * 										and: -annotate +100+0 '2003-01-01 12:00\n2003-01-01 11:30\n'
	 * 				These two strings are then layered on top of each other and put in the southwest corner of the image.
	 * @return string $image -- The filepath to the watermarked image
	 * @param object $image -- Filepath to the image to be watermarked
	 */
	private function watermark($image) {
		// If the image is too small, text won't fit. Don't put a timestamp on it. 215x215 is very small
		// and probably will not be requested anyway.
		if($this->imageSize['width'] < 215) {
			return $image;
		}
		
		$cmd = CONFIG::PATH_CMD . " && convert " . $image . " -fill white -gravity SouthWest -annotate +20+0 '";
		$timeCmd = "";
		
		// Put the names on first, then put the times on as a separate layer so the times are nicely aligned.
		foreach($this->timestamps as $key => $time) {
			$rawName = explode('_', $key);
			$obs = $rawName[0];
			$inst = $rawName[1];
			$det = $rawName[2];
			$meas = $rawName[3];
			
			// Decide what to include in the name. EIT and MDI only need detector and measurement
			if($inst === $det) {
				$name = $det . " " . $meas;
			}
			
			// LASCO needs instrument detector and measurement. Take out the 0's in 0C2/0C3 and 0WL
			else {
				$name = $inst . " " . str_replace("0", "", $det) . " " . str_replace("0", "", $meas);
			}
			
			$cmd .= $name . "\n";
			
			// Get rid of seconds, since they don't really matter and it makes time more readable
			// Add extra spaces between date and time for readability.
			$time = str_replace(" ", "   ", substr($time, 0, -3));
			$timeCmd .= $time . "\n";
		}
		$cmd .= "' -annotate +100+0 '" . $timeCmd . "' -type TrueColor -alpha off " . $image;

		exec($cmd, $out, $ret);

		return $image;
	}
	
	/**
	 * buildComposite composites the layers on top of each other after putting them in the right order.
	 */
	private function buildComposite($images, $opacities) {
		// Put images into the order they will be composited onto each other. 
		// sortedImages is an array of image info arrays. Each image info array has the keys
		// "image" (the filepath of the image) and "opacity" (opacity value of the image)
		$sortedImages = $this->sortByOpacityGroup($images, $opacities["group"], $opacities["value"]); 

		if(isset($this->frameNum))		
			$tmpImg = $this->cacheFileDir . $this->frameNum . ".tif";
		else
			$tmpImg = $this->cacheFileDir . $this->id . ".png";
			
		$cmd = CONFIG::PATH_CMD . " && composite -gravity Center";
		
		// It is assumed that the array $images is already in the correct order for opacity groups,
		// since it was sorted above.
		$i = 1;
		foreach($sortedImages as $image) {
			$img = $image["image"];
			$op  = $image["opacity"];
			
			// If the image has an opacity level of less than 100, need to set its opacity.
			if($op < 100) {
				// Get the image's uri
				$imgFilepath = explode("/", $img);
				$imgUri = array_pop($imgFilepath);
				
				$tmpOpImg = $this->transImageDir . substr($imgUri, 0, -4) . "-op" . $op . ".tif";
				
				// If it's not in the cache, make it
				if(!file_exists($tmpOpImg)) {
					// setImageOpacity does not work on my machine but might elsewhere
//					copy($img, $tmpOpImg);
//					$img = new Imagick($tmpOpImg);
//					$img->setImageOpacity($op/100);

					$opacityCmd = CONFIG::PATH_CMD . " && convert $img -alpha on -channel o -evaluate set $op% $tmpOpImg";
					exec($opacityCmd);
				}
				
				$img = $tmpOpImg;
			}
			
/*			$img = new Imagick($image["image"]);
			$img->setImageOpacity($image["opacity"]);

			header('Content-type: image/tif');
			echo $img;

			exit();
*/

			$cmd .= " " . $img;

			// If there are more than 2 layers, then the composite command needs to be called after every layer,
			// compositing the last composite image and the current image.
			if($i > 1 && isset($sortedImages[$i])) {
				$tmpCompImg = $this->compositeImageDir . time() . "-comp.tif";
				$cmd .= " -compose dst-over $tmpCompImg && composite -gravity Center $tmpCompImg";
			}
			$i++;
		}
		$cmd .= " -compose dst-over -depth 8 -quality 10 " . $tmpImg;

		try {
			exec($cmd, $out, $ret);
			if($ret != 0) {
				throw new Exception("Error executing command $cmd.");
			}

			exec(CONFIG::PATH_CMD . " && convert $tmpImg -background black -alpha off $tmpImg", $out, $ret);
			if($ret != 0) {
				throw new Exception("Error turning alpha channel off on $tmpImg.");
			}
		}
		catch(Exception $e) {
            $error = "[buildComposite][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(Config::ERROR_LOG, $error,FILE_APPEND);
            print $e->getMessage();
			die();
		}
		$tmpImg = $this->watermark($tmpImg);
		return $tmpImg;	
	}

	/**
	 * Sorts the layers by opacity group. 
	 * Opacity groups that are used currently are 3 (C3 images), 2 (C2 images), 1 (EIT/MDI images).
	 * The array is sorted like this: Group 3, Group 2, Group 1(layer order that the user has in their viewport).
	 * The parameters "$images" and "$opacities" are each an array_reverse of the arrays they came from.
	 */
	private function sortByOpacityGroup($images, $opacityGroups, $opacityValues) {
		$sortedImages = array();

//		array_multisort($opacities["group"], SORT_ASC, $opacities["value"], $images);
		/* multisort sorts by group and by value, which is not good, because the order of layers with opacity group 1 needs to be preserved.
		 * Example: If the bottom layer is EIT 100% opacity, and the next layer is MDI 25%, and the top layer is another EIT 60%, we do not
		 * want to sort this because the picture will come out differently (EIT 100%, EIT 60%, MDI 25%) than what the user was looking at. 
		 */
		$i = 0;
		
		// Array to hold any images with opacity group 2 or 3. These images must go in the sortedImages array last because of how compositing works.
		$groups = array("2" => array(), "3" => array());
		
		// Push all opacity group 1 images into the sortedImages array, push group 2 and higher into separate array.
		foreach($opacityGroups as $group) {
			if($group > 1)
				array_push($groups[$group], array("image" => $images[$i], "opacity" => $opacityValues[$i]));
			else
				array_push($sortedImages, array("image" => $images[$i], "opacity" => $opacityValues[$i]));
			$i++;
		}
		
		// Push the group 2's and group 3's into the sortedImages array now.
		foreach($groups as $group) {
			foreach($group as $image)
			array_push($sortedImages, $image);
		}

		// return the sorted array in order of smallest opacity group to largest.
		return $sortedImages;
	}
	
	/*
	 * printImage
	 */
	public function printImage() {
		header( "Content-Type: image/png" );
		echo $this->composite;
	}

	/*
	 * getImage
	 */
	public function getImage() {
		return $this->composite;
	}
	
	/*
	 * writeImage
	 */
	public function writeImage($filename) {
		$this->composite->writeImage($filename);
	}
 
	public function timestamps() {
		return $this->timestamps;
	}
	
	public function nextTime() {
		return array_shift($this->timestamps);
	}
	
	public function numFrames() {
		return sizeOf($this->timestamps);
	}

	/**
	 * @name getFilepath
	 * @description Builds a directory string for the given layer
	 */
	protected function getFilepath($uri) {
		// Extract the relevant data from the image uri (excluding the .jp2 at the end)
		$uriData = explode("_", substr($uri, 0, -4));
		$year 	 = $uriData[0];
		$month 	 = $uriData[1];
		$day 	 = $uriData[2];
		// Skip over the unix timestamp in the middle
		$obs 	 = $uriData[4];
		$inst  	 = $uriData[5];
		$det 	 = $uriData[6];
		$meas 	 = $uriData[7];
	
		$path  = CONFIG::JP2_DIR . implode("/", array($year, $month, $day));
		$path .= "/$obs/$inst/$det/$meas/";
		$path .= $uri;

		return $path;
	}
	
	/**
	 * Returns the composite image. 
	 */
	function getComposite() {
		return $this->composite;
	}
}
?>
