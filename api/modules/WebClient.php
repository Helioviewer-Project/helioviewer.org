<?php

require_once("interface.Module.php");

class WebClient implements Module
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

    /**
     * Handles input validation
     */
    public function validate()
    {
        switch($this->params['action'])
        {
            case "downloadFile":
                Helper::checkForMissingParams(array('url'), $this->params);
                if (!filter_var($this->params['url'], FILTER_VALIDATE_URL))
                    return false;
                break;
            case "getClosestImage":
                if (isset($this->params["sourceId"])) {
                    Helper::checkForMissingParams(array('server', 'date', 'sourceId'), $this->params);
                   if (filter_var($this->params['sourceId'], FILTER_VALIDATE_INT) === false)
                        return false;
                }
                else {
                    Helper::checkForMissingParams(array('server', 'date', 'observatory', 'instrument', 'detector', 'measurement'), $this->params);
                }
                
                if (!validateUTCDate($this->params['date'])) {
                	echo "Invalid date. Please enter a date of the form 2003-10-06T00:00:00.000Z";
                    return false;
                }
                // TODO 01/29/2010 Create separate method to fix ints
                if (filter_var($this->params['server'], FILTER_VALIDATE_INT) === false) {
                	echo "Error: Invalid server choice.";
                    return false;
                }
                else {
                    $this->params['server'] = (int) $this->params['server'];
                }

                break;
            case "getDataSources":
                break;
            case "getTile":
                $required = array('uri', 'x', 'y', 'zoom', 'ts', 'jp2Width', 'jp2Height', 'jp2Scale',
                                  'offsetX', 'offsetY', 'format', 'obs', 'inst', 'det', 'meas');
                Helper::checkForMissingParams($required, $this->params);
                break;
            case "getJP2Header":
                break;
            case "getViewerImage":
                break;
            case "formatLayerString":
                break;
            default:
                break;
        }
        return true;
    }

    public static function printDoc()
    {

    }

    /**
     * @description 'Opens' the requested file in the current window as an attachment, which pops up the "Save file as" dialog.
     * @TODO test this to make sure it works in all browsers.
     * @return 1 on success.
     */
    public function downloadFile()
    {
        $url = $this->params['url'];

        // Convert web url into directory url so stat() works.
        // Need to use stat() instead of filesize() because filesize fails for every file on Linux
        // due to security permissions with apache. To get the file size, do $stat['size']
        $url = str_replace(HV_WEB_ROOT_URL, HV_ROOT_DIR, $url);
        $stat = stat($url);

        if(strlen($url) > 1) {
            header("Pragma: public");
            header("Expires: 0");
            header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
            header("Cache-Control: private",false); // required for certain browsers
            header("Content-Disposition: attachment; filename=\"" . basename($url) . "\";" );
            header("Content-Transfer-Encoding: binary");

            header("Content-Length: " . $stat['size']);

            echo file_get_contents($url);
        }
        else {
            print("Error: Problem retrieving file.");
        }
        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     * http://localhost/hv/api/index.php?action=getClosestImage&date=2003-10-05T00:00:00Z&source=0&server=api/index.php
     * TODO: Add a more elegant check for local vs. remote server
     */
    public function getClosestImage ()
    {
        // Local Tiling Server
        if ($this->params['server'] === 0) {
            require_once('lib/ImgIndex.php');
            require_once('lib/DbConnection.php');
            $imgIndex = new ImgIndex(new DbConnection());

            // Convert human-readable params to sourceId if needed
            if (!isset($this->params['sourceId'])) {
                $this->params['sourceId'] = $imgIndex->getSourceId(
                    $this->params['observatory'], $this->params['instrument'], 
                    $this->params['detector'], $this->params['measurement']
                );
            }

            $result = $imgIndex->getClosestImage($this->params['date'], $this->params['sourceId'], false);

	        // Prepare cache for tiles
	        $this->createImageCacheDir($result["filepath"]);

	        $json = json_encode($result);

        // Remote Tiling Server
        // TODO 01/29/2010 Check to see if server number is within valid range of know authenticated servers.
        }
        else {
        	$baseURL = constant("HV_TILE_SERVER_" . $this->params['server']);
            $source  = $this->params['sourceId'];
            $date    = $this->params['date'];
            $url     = "$baseURL?action=getClosestImage&sourceId=$source&date=$date&server=1";

            $json = file_get_contents($url);
        }
        
        header('Content-Type: application/json');
        echo $json;
    }

    /**
     * getDataSources
     * @return Returns a tree representing the available data sources
     */
    public function getDataSources ()
    {
        require_once('lib/ImgIndex.php');
        require_once('lib/DbConnection.php');

        // NOTE: Make sure to remove database specification after testing completed!
        $imgIndex = new ImgIndex(new DbConnection($dbname = "helioviewer"));
        $dataSources = json_encode($imgIndex->getDataSources());

        header('Content-type: application/json');

        print $dataSources;

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     */
    public function getJP2Header ()
    {
        $filepath = HV_JP2_DIR . $this->params["file"];

        // Query header information using Exiftool
        $cmd = escapeshellcmd(HV_EXIF_TOOL . " $filepath") . ' | grep Fits';
        exec($cmd, $out, $ret);

        $fits = array();
        foreach ($out as $index => $line) {
            $data = explode(":", $line);
            $param = substr(strtoupper(str_replace(" ", "", $data[0])), 8);
            $value = $data[1];
            array_push($fits, $param . ": " . $value);
        }

        header('Content-type: application/json');
        echo json_encode($fits);
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    public function getTile ()
    {
        require_once("lib/HelioviewerTile.php");
        $tile = new HelioviewerTile($this->params['uri'], $this->params['x'], $this->params['y'], $this->params['zoom'], $this->params['ts'],
        $this->params['jp2Width'], $this->params['jp2Height'], $this->params['jp2Scale'], $this->params['offsetX'], $this->params['offsetY'],
        $this->params['format'],  $this->params['obs'], $this->params['inst'], $this->params['det'], $this->params['meas']);

        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    public function launchJHV ()
    {
        require_once('lib/JHV.php');
        if ((isset($this->params['files'])) && ($this->params['files'] != "")) {
            $jhv = new JHV($this->params['files']);
        } else {
            $jhv = new JHV();
        }
        $jhv->launch();
    }

    /**
     * sendEmail
     * TODO: CAPTCHA, Server-side security
     * @return
     */
    public function sendEmail()
    {
        // The message
        //$message = "Line 1\nLine 2\nLine 3";

        // In case any of our lines are larger than 70 characters, we should use wordwrap()
        //$message = wordwrap($message, 70);

        // Send
        //mail('test@mail.com', 'My Subject', $message);
    }


    /**
     * @description Obtains layer information, ranges of pixels visible, and the date being looked at and creates a composite image
     *                 (a Screenshot) of all the layers.
     *
     * All possible parameters: obsDate, zoomLevel, layers, imageSize, filename, edges, sharpen
     *
     * API example: http://localhost/helioviewer/api/index.php?action=takeScreenshot&obsDate=1041465600&zoomLevel=13
     *    &layers=SOH,EIT,EIT,304,1,100x0,1034,0,1034,-230,-215/SOH,LAS,0C2,0WL,1,100x0,1174,28,1110,-1,0
     *     &imageSize=588,556&filename=example&sharpen=false&edges=false
     *
     * Note that filename does NOT have the . extension on it. The reason for this is that in the media settings pop-up dialog,
     * there is no way of knowing ahead of time whether the image is a .png, .tif, .flv, etc, and in the case of movies, the file is
     * both a .flv and .mov/.asf/.mp4
     *
     * @return Returns 1 if the action was completed successfully.
     */
    public function takeScreenshot()
    {
        require_once('lib/Screenshot.php');

        $obsDate   = $this->params['obsDate'];
        $zoomLevel = $this->params['zoomLevel'];
        $quality   = $this->params['quality'];
        $layerStrings = explode("/", $this->params['layers']);

        $imgCoords = explode(",", $this->params['imageSize']);
        $imageSize = array("width" => $imgCoords[0], "height" => $imgCoords[1]);
        $filename  = $this->params['filename'];

        $options = array();
        $options['enhanceEdges'] = $this->params['edges'] || false;
        $options['sharpen']      = $this->params['sharpen'] || false;

        try {
            if(sizeOf($layerStrings) < 1)
            throw new Exception("Invalid layer choices! You must specify at least 1 layer.");

            $layers = $this->formatLayerStrings($layerStrings);

            $screenshot = new Screenshot($obsDate, $zoomLevel, $options, $imageSize, $filename, $quality);
            $screenshot->buildImages($layers);

            $composite = $screenshot->getComposite();
            if(!file_exists($composite))
            throw new Exception("The requested screenshot is either unavailable or does not exist.");

            if($this->params == $_GET) {
                header('Content-type: image/png');
                echo file_get_contents($composite);
            }

            else {
                header('Content-type: application/json');
                // Replace '/var/www/helioviewer', or wherever the directory is, with 'http://localhost/helioviewer' so it can be displayed.
                echo json_encode(str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $composite));
            }
        }
        catch(Exception $e) {
            echo 'Error: ' . $e->getMessage();
            exit();
        }
    }

    /**
     * getViewerImage (aka "getCompositeImage")
     *
     * Example usage: (outdated!)
     *         http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOH_EIT_EIT_195&timestamps=1065312000&zoomLevel=10&tileSize=512&xRange=-1,0&yRange=-1,0
     *         http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOH_EIT_EIT_195,SOH_LAS_0C2_0WL&timestamps=1065312000,1065312360&zoomLevel=13&tileSize=512&xRange=-1,0&yRange=-1,0&edges=false
     *
     * Notes:
     *         Building a UTC timestamp in javascript
     *             var d = new Date(Date.UTC(2003, 9, 5));
     *             var unix_ts = d.getTime() * 1000;
     *
     *         TODO
     *             * If no params are passed, print out API usage description (and possibly a query builder form)...
     *             * Add support for fuzzy times/var/www/hv/jp2/v2009051tamp matching. Could default to exact matching unless user specifically requests fuzzy date-matching.
     *             * Separate out layer details into a Layer PHP class?
     *             * Update getViewerImage to use "layers" instead of "layers" + "timestamps"
     *
     * @return int Returns "1" if the action was completed successfully.
     *
     */
    public function getViewerImage () {
        require('lib/CompositeImage.php');

        //Create and display composite image
        $img = CompositeImage::compositeImageFromQuery($params);
        $img->printImage();

        return 1;
    }

    /**
     * @description Takes the string representation of a layer from the javascript and formats it so that only useful/necessary information is included.
     * @return {Array} $formatted -- The array containing properly formatted strings
     * @param {Array} $layers -- an array of strings in the format: "obs,inst,det,meas,visible,opacityxxStart,xSize,yStart,ySize"
     *                     The extra "x" was put in the middle so that the string could be broken in half and parsing one half by itself
     *                     rather than parsing 10 different strings and putting the half that didn't need parsing back together.
     */
    private function formatLayerStrings($layers) {
        $formatted = array();

        foreach($layers as $layer) {
            $layerInfo = explode("x", $layer);

            // $meta is now: [xStart,xSize,yStart,ySize,hcOffsetx,hcOffsety]
            $meta = split(",", $layerInfo[1]);
            $offsetX = $meta[4];
            $offsetY = $meta[5];

            // Add a "+" in front of positive numbers so that the offsets are readable by imagemagick
            $meta[4] = ($offsetX >= 0? "+" : "") . $offsetX;
            $meta[5] = ($offsetY >= 0? "+" : "") . $offsetY;

            // Extract relevant information from $layerInfo[0] (obs,inst,det,meas,visible,opacity).
            $rawName = explode(",", $layerInfo[0]);
            $opacity = $rawName[5];
            //Get rid of the "visibility" boolean in the middle of the string.
            array_splice($rawName, 4);

            $name = implode("_", $rawName);
            // Stick opacity on the end. the $image string now looks like: "obs_inst_det_meas,xStart,xSize,yStart,ySize,hcOffsetx,hcOffsety,opacity"
            $image = $name . "," . implode(",", $meta) . "," . $opacity;
            array_push($formatted, $image);
        }

        return $formatted;
    }
    
    /**
     * @description Creates the directory structure which will be used to cache generated tiles.
     * 
     * Note: mkdir may not set permissions properly due to an issue with umask.
     *       (See http://www.webmasterworld.com/forum88/13215.htm)
     */
    private function createImageCacheDir($filepath) {
        $dir = HV_CACHE_DIR . $filepath;
        
        if (!file_exists($dir)) {
           mkdir($dir, 0777, true);
           chmod($dir, 0777);
        } 
    }

}

?>