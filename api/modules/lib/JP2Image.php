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
 */
class JP2Image {
    private $file;   //$jp2;
    private $width;  //$jp2Width;
    private $height; //$jp2Height;
    private $scale;  //$jp2Scale;
    
    /**
     * @param string file -- Location of the JPEG 2000 image to work with
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
    
    public function getWidth() {
        return $this->width;
    }
    
    public function getHeight() {
        return $this->height;
    }

    /**
     * Extract a region using kdu_expand
     * @return String - outputFile of the expanded region 
     * @param $outputFile String - JP2 outputFile
     * 
     * @TODO: Should precision of -reduce be limited in same manner as region strings? (e.g. MDI @ zoom-level 9)
     */
    public function extractRegion($outputFile, $roi, $scaleFactor = 0) {
        $cmd = HV_KDU_EXPAND . " -i $this->file -o $outputFile ";
         
        // Case 1: JP2 image resolution = desired resolution
        // Nothing special to do...
    
        // Case 2: JP2 image resolution > desired resolution (use -reduce)        
        if ($scaleFactor > 0)
            $cmd .= "-reduce $scaleFactor ";

        // Case 3: JP2 image resolution < desired resolution
        // Don't do anything...

        // Add desired region
        $cmd .= $this->getRegionString($roi);
        
        //echo $cmd;
        //exit();

        // Execute the command
        try {
            $line = exec(HV_PATH_CMD . $cmd, $out, $ret);
            if (($ret != 0) || (sizeof($out) > 5)) {
                var_dump($out);
                throw new Exception("COMMAND: $cmd\n\t $line");
            }
                
        } catch(Exception $e) {
            $error = "[kdu][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(HV_ERROR_LOG, $error,FILE_APPEND);
            print $error;
        }
    }
    
    /**
     * getRegionString
     * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
     * 
     * NOTE: Because kakadu's internal precision for region strings is less than PHP,
     * the numbers used are cut off to prevent erronious rounding.
     */
    private function getRegionString($roi) {
        $precision = 6;
        
        $top    = $roi["top"];
        $left   = $roi["left"];
        $bottom = $roi["bottom"];
        $right  = $roi["right"];

        // Calculate the top, left, width, and height in terms of kdu_expand parameters (between 0 and 1)
        $scaledTop      = substr($top / $this->height, 0, $precision);    
        $scaledLeft   = substr($left / $this->width, 0, $precision);
        $scaledHeight = substr(($bottom - $top) / $this->height, 0, $precision);
        $scaledWidth  = substr(($right - $left) / $this->width,  0, $precision);
        
        $region = "-region \{$scaledTop,$scaledLeft\},\{$scaledHeight,$scaledWidth\}";

        return $region;        
    }    
}
?>
