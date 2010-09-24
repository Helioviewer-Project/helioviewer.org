<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer-specific JPEG 2000 JPX Image Class Definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'JPXImage.php';
/**
 * Class for generating JPX images in Helioviewer
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_JPEG2000_HelioviewerJPXImage extends Image_JPEG2000_JPXImage
{
    private $_observatory;
    private $_instrument;
    private $_detector;
    private $_measurement;
    private $_sourceId;
    private $_startTime;
    private $_endTime;
    private $_cadence;
    private $_message;
    private $_summaryFile;
    private $_url;

    /**
     * Creates a new Helioviewer JPX image
     *
     * @param string $obs       Observatory
     * @param string $inst      Instrument
     * @param string $det       Detector
     * @param string $meas      Measurement
     * @param int    $sourceId  Image source id
     * @param string $startTime Requested start time for JPX (ISO 8601 UTC date string)
     * @param string $endTime   Requested finish time for JPX (ISO 8601 UTC date string)
     * @param int    $cadence   Number of seconds between each frame in the image series
     * @param bool   $linked    Whether or not requested JPX image should be a linked JPX
     *
     * @return void
     */
    public function __construct($obs, $inst, $det, $meas, $sourceId, $startTime, $endTime, $cadence, $linked)
    {
        $this->_observatory = $obs;
        $this->_instrument  = $inst;
        $this->_detector    = $det;
        $this->_measurement = $meas;
        $this->_sourceId    = $sourceId;
        $this->_startTime   = $startTime;
        $this->_endTime     = $endTime;
        $this->_cadence     = $cadence;

        $filename = $this->_getJPXFilename($obs, $inst, $det, $meas, $startTime, $endTime, $cadence, $linked);
        $filepath = HV_JP2_DIR . '/movies/' . $filename;

        $this->_url = HV_JP2_ROOT_URL . "/movies/" . $filename;

        // Location to store JPX generation summary information
        $this->_summaryFile = substr($filepath, 0, -3) . "json";

        parent::__construct($filepath);
        
        // If the file doesn't exist already, create it
        if (!file_exists($filepath)) {
            list ($images, $timestamps) = $this->_queryJPXImageFrames();
            $this->_timestamps = $timestamps;
            $this->_images     = $images;
            
            // Make sure that at least some movie frames were found
            if (sizeOf($images) > 0) {
                $this->buildJPXImage($images, $linked);
            } else {
                throw new Exception("No images were found for the requested time range.");
            }            
            
            $this->_writeFileGenerationReport();
        }
    }

    /**
     * Returns a list of JP2 files to use for JPX generation
     *
     * @return array Returns list of filepaths to images to use during JPX generation
     *               and also a list of the times for each image in the series.
     */
    private function _queryJPXImageFrames()
    {
        include_once 'src/Helper/DateTimeConversions.php';
        include_once 'src/Database/ImgIndex.php';

        $imgIndex = new Database_ImgIndex();

        // Get image sourceId
        $sourceId = $this->_getSourceId($imgIndex);

        // Replace start and end request dates with actual matches in order to account for gaps at either side
        $this->_checkRequestDates($imgIndex, $sourceId);

        $start = toUnixTimestamp($this->_startTime);
        $end   = toUnixTimestamp($this->_endTime);
        
        // If cadence is manually specified check to make sure it is reasonable
        if ($this->_cadence) {
            $numFrames = floor(($end - $start) / $this->_cadence);
            if ($numFrames > HV_MAX_JPX_FRAMES) {
                $oldCadence = $this->_cadence;
                $this->_cadence = floor(($end - $start) / HV_MAX_JPX_FRAMES);
                $numFrames      = HV_MAX_JPX_FRAMES;
                $this->_message = "Warning: Movie cadence has been changed from one image every $oldCadence " .
                                    "seconds to one image every {$this->_cadence} seconds in order to avoid " .
                                    "exceeding the maximum allowed number of frames (" . HV_MAX_JPX_FRAMES . ").";
            }
        } else {
            // Choose an optimal cadence
            // If possible, all images between the start and end dates will be included in the jpx.  
            // If the number of images in the date range exceeds the maximum number of frames allowed, a lower 
            // cadence (increased time between images) is chosen.
            $count = $imgIndex->getImageCount($this->_startTime, $this->_endTime, $sourceId);
            
            if ($count > HV_MAX_JPX_FRAMES) {
                $this->_cadence  = floor(($end - $start) / HV_MAX_JPX_FRAMES);
                $numFrames       = HV_MAX_JPX_FRAMES;    
            } else {
                return $this->_queryJPXImageFramesByRange($imgIndex, $sourceId);
            }
        }

        return $this->_queryJPXImageFramesByCadence($imgIndex, $sourceId, $numFrames);
    }
    
    /**
     * Retrieves filepaths and timestamps of all images of a given type between the start and end dates specified
     * 
     * @param object $imgIndex an ImgIndex object with access to the database
     * @param in     $sourceId the source ID of the image
     * 
     * @return array Returns list of filepaths to images to use during JPX generation
     *               and also a list of the times for each image in the series.
     */
    private function _queryJPXImageFramesByRange($imgIndex, $sourceId)
    {
        $images = array();
        $dates  = array();
        
        $results = $imgIndex->getImageRange($this->_startTime, $this->_endTime, $sourceId);
        
        foreach ($results as $img) {
            $filepath = HV_JP2_DIR . $img["filepath"] . "/" . $img["filename"];
            array_push($images, $filepath);
            array_push($dates, toUnixTimestamp($img['date']));
        }
        
        return array($images, $dates);
    }
    
    /**
     * Retrieves filepaths and timestamps for images at a specified cadence of a given type between 
     * the start and end dates specified
     * 
     * @param object $imgIndex  An ImgIndex object with access to the database
     * @param int    $sourceId  Image source id
     * @param int    $numFrames The number of frames to go into the JPX movie
     * 
     * @return array Returns list of filepaths to images to use during JPX generation
     *               and also a list of the times for each image in the series.
     */
    private function _queryJPXImageFramesByCadence($imgIndex, $sourceId, $numFrames)
    {
        $images = array();
        $dates  = array();
        
        // Timer
        $time = toUnixTimestamp($this->_startTime);
       
        // Get nearest JP2 images to each time-step
        for ($i = 0; $i < $numFrames; $i++) {
            // Get next image
            $isoDate = toISOString(parseUnixTimestamp($time));

            $img = $imgIndex->getImageFromDatabase($isoDate, $sourceId);
            $jp2 = HV_JP2_DIR . $img["filepath"] . "/" . $img["filename"];

            // Ignore redundant images
            if (end($images) != $jp2) {
                array_push($images, $jp2);
                array_push($dates, toUnixTimestamp($img['date']));
            }
            $time += $this->_cadence;
        }
        
        return array($images, $dates);
    }

    /**
     * Checks the request start and end dates. If either are outside of the range of available data, then
     * they are adjusted so that they fall within the available data range. If the request range falls completely
     * outside of the range of available data then no movie is generated. 
     * 
     * @param object $imgIndex An instance of ImgIndex
     * @param int    $sourceId The source id of the image
     * 
     * @return void 
     */
    private function _checkRequestDates($imgIndex, $sourceId)
    {
        // TODO 08/02/2010: Make note when dates use differ significantly from request date.
        // Perhaps instead of returning a "message" parameter, just return the items of interest: startTime,endTime,
        // overmax, etc.
        $startImage = $imgIndex->getClosestImageAfterDate($this->_startTime, $sourceId);
        $endImage   = $imgIndex->getClosestImageBeforeDate($this->_endTime, $sourceId);
        
        $this->_startTime = isoDateToMySQL($startImage["date"]);
        $this->_endTime   = isoDateToMySQL($endImage["date"]);
    }

    /**
     * Checks to see if the sourceId property is set and queries it if it isn't
     *
     * @param Database_ImgIndex $imgIndex Database helper connection
     *
     * @return string Source id.
     */
    private function _getSourceId($imgIndex)
    {
        if (!isset($this->_sourceId)) {
            $this->_sourceId = $imgIndex->getSourceId(
                $this->_observatory, $this->_instrument, $this->_detector, $this->_measurement
            );
        }

        return $this->_sourceId;
    }

    /**
     * Determines filename to use for storing generated JPX image. Filenames are of the form:
     *
     *  Obs_Inst_Det_Meas_FROM_TO_BY(L).jpx
     *
     * @param string $obs       Observatory
     * @param string $inst      Instrument
     * @param string $det       Detector
     * @param string $meas      Measurement
     * @param string $startTime Requested start time for JPX (ISO 8601 UTC date string)
     * @param string $endTime   Requested finish time for JPX (ISO 8601 UTC date string)
     * @param int    $cadence   Number of seconds between each frame in the image series
     * @param bool   $linked    Whether or not requested JPX image should be a linked JPX
     *
     * @return string Filename to use for generated JPX image
     */
    private function _getJPXFilename($obs, $inst, $det, $meas, $startTime, $endTime, $cadence, $linked)
    {
        $from = str_replace(":", ".", $startTime);
        $to   = str_replace(":", ".", $endTime);
        $filename = implode("_", array($obs, $inst, $det, $meas, "F$from", "T$to"));

        // If cadence was manually specified include it in the filename
        if ($cadence) {
            $filename .= "B$cadence";
        }

        // Differentiate linked JPX files
        if ($linked) {
            $filename .= "L";
        }

        return str_replace(" ", "-", $filename) . ".jpx";
    }
    
    /**
     * Creates a summary file for the generated JPX file including the filepath, image timestamps, and any
     * warning messages encountered during the creation process.
     *
     * @return void
     */
    private function _writeFileGenerationReport()
    {
        $contents = array(
            "uri"     => $this->_url,
            "frames"  => $this->_timestamps,
            "message" => $this->_message
        );

        $fp = fopen($this->_summaryFile, "w");
        fwrite($fp, json_encode($contents));
        fclose($fp);
    }

    /**
     * Parses a file which contains summary information about a JPX file
     *
     * @return void
     */
    private function _parseFileGenerationReport()
    {
        $fp = fopen($this->_summaryFile, "r");
        $contents = fread($fp, filesize($this->_summaryFile));

        $summary = json_decode($contents);

        $this->_timestamps = $summary->frames;
        $this->_message    = $summary->message;
    }
    
    /**
     * Returns the number of images that make up the JPX movie
     * 
     * @return int Number of images
     */
    public function getNumJPXFrames()
    {
        return sizeOf($this->_images); 
    }
    
    /**
     * Returns a message describing any errors encountered during the JPX generation process
     *
     * @return string Error message
     */
    public function getErrorMessage ()
    {
        return $this->_message;     
    }

    /**
     * Converts a regular HTTP URL to a JPIP URL
     *
     * @param string $jp2Dir      The JPEG 2000 archive root directory
     * @param string $jpipBaseURL The JPIP Server base URL
     *
     * @return string A JPIP URL.
     */
    public function getJPIPURL($jp2Dir = HV_JP2_DIR, $jpipBaseURL = HV_JPIP_ROOT_URL)
    {
        $webRootRegex = "/" . preg_replace("/\//", "\/", $jp2Dir) . "/";
        $jpip = preg_replace($webRootRegex, $jpipBaseURL, $this->outputFile);
        return $jpip;
    }

    /**
     * Prints summary information including HTTP/JPIP URI as JSON
     *
     * @param bool $jpip    Formats URI as JPIP URL if true
     * @param bool $frames  Includes individual jpx frame timestamps if true
     * @param bool $verbose Includes any warning messages encountered during file generation if true
     *
     * @return void
     */
    public function printJSON($jpip, $frames, $verbose)
    {
        // Read in jpx meta-information from cache
        if (!isset($this->_timestamps)) {
            $this->_parseFileGenerationReport();
        }

        $output = array("message" => $this->_message);

        // JPIP URL
        if ($jpip) {
            $output["uri"] = $this->getJPIPURL();
        } else {
            $output["uri"] = $this->_url;
        }

        // Image timestamps
        if ($frames) {
            $output["frames"] = $this->_timestamps;
        }

        // Print
        header('Content-Type: application/json');
        print json_encode($output);
    }
}
?>