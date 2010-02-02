<?php

require_once("interface.Module.php");

class JHelioviewer implements Module
{
    private $params;

    public function __construct(&$params)
    {
        require_once("Helper.php");
        $this->params = $params;


        $this->execute();

    }

    public function execute()
    {
        if($this->validate())
        {
            $this->{$this->params['action']}();
        }
    }

    public function validate()
    {
        switch($this->params['action'])
        {
            case "getJP2Image":
                $bools = array("getURL", "getJPIP", "debug");
                $this->params = Helper::fixBools($bools, $this->params);
                break;
            case "buildJP2ImageSeries":
                $bools = array("getURL", "getJPIP", "links", "frames", "debug");
                $this->params = Helper::fixBools($bools, $this->params);
                if ($this->params['links'] && ($this->params['format'] != "JPX"))
                    die('<b>Error</b>: Format must be set to "JPX" in order to create a linked image series.');
                break;
            case "getJPX":
                break;
            case "getMJ2":
                break;
            case "getJP2ImageSeries":
                break;
            default:
                throw new Exception("Invalid action specified. See the <a href='http://www.helioviewer.org/api/'>API Documentation</a> for a list of valid actions.");
        }
        return true;
    }

    public static function printDoc()
    {

    }

    /**
     * @description Converts a regular HTTP URL to a JPIP URL
     */
    private function getJPIPURL($url) {
        $webRootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
        $jpip = preg_replace($webRootRegex, HV_JPIP_ROOT_URL, $url);
        return $jpip;
    }

    /**
     */
    public function getJP2Image ()
    {
        require_once('lib/ImgIndex.php');
        require_once("lib/DbConnection.php");
        $imgIndex = new ImgIndex(new DbConnection());

        $date = $this->params['date'];

        // Search by source id
        if (!isset($this->params['sourceId']))
            $this->params['sourceId'] = $imgIndex->getSourceId($this->params['observatory'], $this->params['instrument'], $this->params['detector'], $this->params['measurement']);

        $filepath = $imgIndex->getJP2FilePath($date, $this->params['sourceId'], $this->params['debug']);
        
        $uri = HV_JP2_DIR . $filepath;

        // http url (full path)
        if ($this->params['getURL']) {
            $webRootRegex = "/" . preg_replace("/\//", "\/", HV_JP2_DIR) . "/";
            $url = preg_replace($webRootRegex, HV_JP2_ROOT_URL, $uri);
            echo $url;
        }

        // jpip url
        else if ($this->params['getJPIP']) {
            echo $this->getJPIPURL($uri);
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

    public function getJPX ()
    {
        $this->params['format'] = 'JPX';
        $this->params['action'] = 'buildJP2ImageSeries';
        $this->execute();
    }

    public function getMJ2 ()
    {
        $this->params['format'] = 'MJ2';
        $this->params['action'] = 'buildJP2ImageSeries';
        $this->execute();
    }
    
    public function getJP2ImageSeries () {
        $this->params['action'] = 'buildJP2ImageSeries';
        $this->execute();
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     * @param string The filename to use
     *  Converting timestamp to a PHP DateTime:
     *     $dt = new DateTime("@$startTime");
     *     echo $dt->format(DATE_ISO8601);
     *     date_add($dt, new DateInterval("T" . $cadence . "S"));
     *  (See http://us2.php.net/manual/en/function.date-create.php)
     */

    /**
     *
     * Constructs a JPX/MJ2 image series
     */
    private function buildJP2ImageSeries () {
        require_once('lib/ImgIndex.php');
        require_once('lib/DbConnection.php');
    
        $startTime   = toUnixTimestamp($this->params['startTime']);
        $endTime     = toUnixTimestamp($this->params['endTime']);
        $cadence     = $this->params['cadence'];
        $jpip        = $this->params['getJPIP'];
        $format      = $this->params['format'];
        $links       = $this->params['links'];
        $frames      = $this->params['frames'];
        $debug       = $this->params['debug'];
        $observatory = $this->params['observatory'];
        $instrument  = $this->params['instrument'];
        $detector    = $this->params['detector'];
        $measurement = $this->params['measurement'];

        // Create a temporary directory to store image-  (TODO: Move this + other directory creation to installation script)
        $dir = HV_JP2_DIR . "/movies/";

        // Filename (From,To,By)
        $from = str_replace(":", ".", $this->params['startTime']);
        $to   = str_replace(":", ".", $this->params['endTime']);
        $filename = implode("_", array($observatory, $instrument, $detector, $measurement, "F$from", "T$to", "B$cadence"));

        // Differentiate linked JPX files
        if ($links)
            $filename .= "L";

        // File extension
        $filename = str_replace(" ", "-", $filename) . "." . strtolower($format);

        // Filepath
        $output_file = $dir . $filename;

        // URL
        $url = HV_JP2_ROOT_URL . "/movies/" . $filename;
        
        // If the file doesn't exist already, create it
        if (!file_exists($output_file) || $frames)
        {
            // Connect to database
            $imgIndex = new ImgIndex(new DbConnection());

            if (!isset($this->params['sourceId']))
                $source = $imgIndex->getSourceId($observatory, $instrument, $detector, $measurement);
            else
                $source = $this->params["sourceId"];
            
            //var_dump($source);

            // Determine number of frames to grab
            $timeInSecs = $endTime - $startTime;
            $numFrames  = min(HV_MAX_JPX_FRAMES, ceil($timeInSecs / $cadence));

            // Timer
            $time = $startTime;

            $images = array();

            // Get nearest JP2 images to each time-step
            for ($i = 0; $i < $numFrames; $i++) {
                $isoDate = toISOString(parseUnixTimestamp($time));
                $jp2 = HV_JP2_DIR . $imgIndex->getJP2FilePath($isoDate, $source, $debug);
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

        // URL
        if ($jpip)
            $uri = $this->getJPIPURL($output_file);
        else
            $uri = $url;
            
        // Include image timestamps to speed up streaming
        if ($frames) {
        	$timestamps = array();
        	foreach ($images as $img) {
                $exploded = explode("/", $img);
                $dateStr = substr(end($exploded), 0, 24);
                $regex   = '/(\d+)_(\d+)_(\d+)__(\d+)_(\d+)_(\d+)_(\d+)/';
                $utcDate = preg_replace($regex, '$1-$2-$3T$4:$5:$6.$7Z', $dateStr);
                array_push($timestamps, toUnixTimestamp($utcDate));
        	}
        	header('Content-Type: application/json');
        	print json_encode(array("uri" => $uri, "frames" => $timestamps));
        }
        else {
            print $uri;	
        }        
    }
}

?>