<?php 

require_once("interface.Module.php");

class JHelioViewer implements Module
{
    public function __construct() 
    {
        
    }
    
    public function execute() 
    {
        
    }
    
    public function validate() 
    {
        
    }
    
    public function printDoc() 
    {
        
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function getJP2Image () 
    {
        require('lib/helioviewer/ImgIndex.php');
        $imgIndex = new ImgIndex(new DbConnection());

        $date = $this->params['date'];

        // Search by source id
        if (isset($this->params['source'])) {
            $filepath = $imgIndex->getJP2FilePath($date, $this->params['source']);
        }
        // Search by human-readable parameters
        else {
            foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field)
                $parameters["$field"] = $this->params[$field];

            $filepath = $imgIndex->getJP2FilePath($date, $parameters);
        }

        $uri = HV_JP2_DIR . $filepath;
        
        // http url (relative path)getUTC
        if ($this->params['getRelativeURL']) {
            $jp2RootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
            $url = preg_replace($jp2RootRegex, "", $uri);
            echo $url;
        }getJP2
        
        // http url (full path)
        else if ($this->params['getURL']) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
        //echo HV_JP2_ROOT_URL . "<br>";
        //echo $webRootRegex . "<br>";
        //echo $uri . "<br>";
            $url = preg_replace($webRootRegex, HV_JP2_ROOT_URL, $uri);
            echo $url;
        }
        
        // jpip url
        else if ($this->params['getJPIP']) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
            $jpip = "jpip" . substr(preg_replace($webRootRegex, HV_JPIP_ROOT_URL, $uri), 4);
            echo $jpip;
        }
        
        // jp2 image
        else {
            $fp = fopen($uri, 'r');
            $stat = stat($uri);
            
            $exploded = explode("/", $filepath);
            $filename = end($exploded);
            
            header("Content-Length: " . $stat['size']);
            header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JP2));
            header("Content-Disposition: attachment; filename=\"$filename\"");

            $contents = fread($fp, $stat['size']);

            echo $contents;
            fclose($fp);
        }

        return 1;
    }    
    
    
    /**
     * @return int Returns "1" if the action was completed successfully.
     * 
     *  Converting timestamp to a PHP DateTime:
     *     $dt = new DateTime("@$startTime");
     *     echo $dt->format(DATE_ISO8601);
     *     date_add($dt, new DateInterval("T" . $cadence . "S"));
     *  (See http://us2.php.net/manual/en/function.date-create.php)
     */
    private function getJP2ImageSeries () 
    {
        $startTime   = toUnixTimestamp($this->params['startTime']);
        $endTime     = toUnixTimestamp($this->params['endTime']);
        $cadence     = $this->params['cadence'];
        $format      = $this->params['format'];
        $jpip        = $this->params['getJPIP'];
        
        $observatory = $this->params['observatory'];
        $instrument  = $this->params['instrument'];
        $detector    = $this->params['detector'];
        $measurement = $this->params['measurement'];

        // Create a temporary directory to store image-  (TODO: Move this + other directory creation to installation script)
        $tmpdir = HV_TMP_ROOT_DIR . "/movies/";
        if (!file_exists($tmpdir)) {
            mkdir($tmpdir);
            chmod($tmpdir, 0777);
        }

        // Filename (From,To,By)
        $filename = implode("_", array($observatory, $instrument, $detector, $measurement, "F$startTime", "T$endTime", "B$cadence")) . "." . strtolower($format);
        
        // Filepath
        $filepath = "$tmpdir" . $filename;

        // URL
        $url = HV_TMP_ROOT_URL . "/movies/" . $filename;

        // If the file doesn't exist already, create it
        if (!file_exists($filepath))
            $this->buildJP2ImageSeries($filepath);

        // Output the file/jpip URL
        if ($jpip) {        
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_ROOT_DIR) . "/";
            $mj2 = "jpip" . substr(preg_replace($webRootRegex, HV_WEB_ROOT_URL, $url), 4);
            echo $mj2;
        } else {
            echo $url;
        }
        return 1;
    }
    
    /**
     * @param string The filename to use
     * Constructs a JPX/MJ2 image series
     */
    private function buildJP2ImageSeries ($output_file) {
        require_once('ImgIndex.php');
        
        $startTime   = toUnixTimestamp($this->params['startTime']);
        $endTime     = toUnixTimestamp($this->params['endTime']);
        $cadence     = $this->params['cadence'];
        $format      = $this->params['format'];
        $links       = $this->params['links'];
        $debug       = $this->params['debug'];

        // Layer information
        foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
          $src["$field"] = $this->params[$field];
        }

        // Connect to database
        $imgIndex = new ImgIndex(new DbConnection());

        // Determine number of frames to grab
        $timeInSecs = $endTime - $startTime;
        $numFrames  = min(HV_MAX_MOVIE_FRAMES, ceil($timeInSecs / $cadence));
        
        // Timer
        $time = $startTime;

        $images = array();

        // Get nearest JP2 images to each time-step
        for ($i = 0; $i < $numFrames; $i++) {
            $isoDate = toISOString(parseUnixTimestamp($time));
            $jp2 = HV_JP2_DIR . $imgIndex->getJP2FilePath($isoDate, $src, $debug);
            array_push($images, $jp2);
            $time += $cadence;
        }

        // Remove redundant entries
        $images = array_unique($images);

        // Append filepaths to kdu_merge command
        $cmd = HV_KDU_MERGE_BIN . " -i ";
        foreach($images as $jp2) {
            $cmd .= "$jp2,";
        }

        // Drop trailing comma
        $cmd = substr($cmd, 0, -1);

        // Virtual JPX files
        if ($links)
            $cmd .= " -links";
        
        $cmd .= " -o $output_file";
    
        // MJ2 Creation
        if ($format == "MJ2")
            $cmd .= " -mj2_tracks P:0-@25";
    
        //die($cmd);
    
        // Execute kdu_merge command
        exec(HV_PATH_CMD . " " . escapeshellcmd($cmd), $output, $return);

    }
}

?>