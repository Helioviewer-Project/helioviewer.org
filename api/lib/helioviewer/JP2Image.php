<?php
/**
 * @package JP2Image - JPEG 2000 Image Class
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 * @author Jaclyn Beck
 * @TODO: Extend Exception class to create more useful objects.
 * @TODO: Use different name for intermediate PNG than final version.
 * @TODO: Forward request to secondary server if it fails for a valid tile?
 * @TODO: build up a "process log" string for each tile process which can be
 *        output to the log in case of failure.
 * 6-12-2009 Converted this class to use pixels instead of tile coordinates when
 * 			 calculating padding and regions for kdu_expand. 
 * 			 If a tile is being generated, the Tile.php class converts its tile
 * 			 coordinates into pixels first before sending them here. 
 */
class JP2Image {
    private $kdu_expand_cmd = CONFIG::KDU_EXPAND; //$kdu_expand
    private $kdu_lib_path   = CONFIG::KDU_LIBS_DIR;

    private $file;   //$jp2;
    private $width;  //$jp2Width;
    private $height; //$jp2Height;
    private $scale;  //$jp2Scale;
    
    /**
     * @param object file -- Location of the JPEG 2000 image to work with
     * @param int zoomLevel -- The zoomlevel to work with
     * @param array imageSize -- an associative array containing "width" and "height" of the image
     */
    public function __construct($file, $width, $height, $scale) {
		$this->file   = $file;
		$this->width  = $width;
		$this->height = $height;
		$this->scale  = $scale;
    }
	
	/**
	 * getScale
	 * @return 
	 */
	public function getScale() {
		return $this->scale;
	}

    /**
     * Extract a region using kdu_expand
     * @return String - outputFile of the expanded region 
     * @param $outputFile String - JP2 outputFile
     */
    public function extractRegion($outputFile, $top, $left, $bottom, $right, $reduce = 0, $alphaMask=false) {
        // For images with transparent parts, extract a mask as well
        if ($this->hasAlphaMask()) {
            $mask = substr($outputFile, 0, -4) . "-mask.tif";
            $cmd = "$this->kdu_expand -i $this->file -raw_components -o $outputFile,$mask ";
        }
        else {
            $cmd = "$this->kdu_expand -i $this->file -o $outputFile ";
        }
        
        // Case 1: JP2 image resolution = desired resolution
        // Nothing special to do...
	
        // Case 2: JP2 image resolution > desired resolution (use -reduce)        
        if ($this->jp2Scale < $this->desiredScale) {
            $cmd .= "-reduce " . $this->scaleFactor . " ";
        }

        // Case 3: JP2 image resolution < desired resolution (get smaller tile and then enlarge)
        // Don't do anything yet...

        // Add desired region
        $cmd .= $this->getRegionString();

        // Execute the command
        try {
            $line = exec(CONFIG::PATH_CMD . " && " . CONFIG::DYLD_CMD . " && " . $cmd, $out, $ret);
            if (($ret != 0) || (sizeof($out) > 5)) {
                var_dump($out);
                throw new Exception("COMMAND: $cmd\n\t $line");
            }
                
        } catch(Exception $e) {
            $error = "[kdu][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(Config::ERROR_LOG, $error,FILE_APPEND);
            print $error;
            
            //Clean-up and exit
            $this->abort($outputFile);
        }
        
        return $pgm;
    }
    

    

    

	

}
?>
