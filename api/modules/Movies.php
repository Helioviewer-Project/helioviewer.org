<?php 

require_once("interface.Module.php");

class Movies implements Module
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
     * @description All possible parameters: startDate, zoomLevel, numFrames, frameRate, timeStep, layers, imageSize ("x,y"),
     *     filename, edges, sharpen, format.
     * 
     * API example: http://localhost/helioviewer/api/index.php?action=buildMovie&startDate=1041465600&zoomLevel=13&numFrames=20
     *     &frameRate=8&timeStep=86400&layers=SOH,EIT,EIT,304,1,100x0,1034,0,1034,-230,-215/SOH,LAS,0C2,0WL,1,100x0,1174,28,1110,-1,0
     *     &imageSize=588,556&filename=example&sharpen=false&edges=false
     * 
     * Note that filename does NOT have the . extension on it. The reason for this is that in the media settings pop-up dialog,
     * there is no way of knowing ahead of time whether the image is a .png, .tif, .flv, etc, and in the case of movies, the file is 
     * both a .flv and .mov/.asf/.mp4
     * 
     * @return int Returns "1" if the action was completed successfully.
     */
    private function buildMovie () 
    {
        require_once('Movie.php');

        // Required parameters
        $startDate = $this->params['startDate'];
        $zoomLevel = $this->params['zoomLevel'];
        $numFrames = $this->params['numFrames'];
        $frameRate = $this->params['frameRate'];
        $timeStep  = $this->params['timeStep'];
        $quality   = $this->params['quality'];
           
        // Layerstrings are separated by "/"
        $layerStrings = explode("/", $this->params['layers']);

        $imageCoords = explode(",", $this->params['imageSize']);
        $imageSize      = array("width" => $imageCoords[0], "height" => $imageCoords[1]);
        $filename       = $this->params['filename'];      
        $hqFormat  = $this->params['format'];
        //$hqFormat = "mp4";
        
        // Optional parameters
        $options = array();
        $options['enhanceEdges'] = $this->params['edges'] || false;
        $options['sharpen']      = $this->params['sharpen'] || false;    
                
        //Check to make sure values are acceptable
        try {    
            //Limit number of layers to three
            if (strlen($this->params['layers']) == 0) {
                throw new Exception("Invalid layer choices! You must specify 1-3 command-separate layernames.");
            }

            //Limit number of frames
            if (($numFrames < 10) || ($numFrames > HV_MAX_MOVIE_FRAMES)) {
                throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than " . HV_MAX_MOVIE_FRAMES . ".");
            }

            $layers = $this->_formatLayerStrings($layerStrings);

            $movie = new Movie($layers, $startDate, $zoomLevel, $numFrames, $frameRate, $hqFormat, $options, $timeStep, $imageSize, $filename, $quality);
            $movie->buildMovie();

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }

        return 1;
    }
    
    /**
     * @description gets the movie url and loads it into MC Mediaplayer
     * @return int Returns "1" if the action was completed successfully.
     */
    private function playMovie () 
    {
        $url = $this->params['url'];
        $width  = $this->params['width'];
        $height = $this->params['height'];

        ?>
            <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
            <html>
            <head>
                <title>Helioviewer.org QuickMovie</title>
            </head>
            <body style="background-color: black; color: #FFF;">
                <!-- MC Media Player -->
                <div style="text-align: center;">
                    <script type="text/javascript">
                        playerFile = "http://www.mcmediaplayer.com/public/mcmp_0.8.swf";
                        fpFileURL = "<?php print $url?>";
                        fpButtonSize = "48x48";
                        fpAction = "play";
                        cpHidePanel = "mouseout";
                        cpHideDelay = "1";
                        defaultEndAction = "repeat";
                        playerSize = "<?php print $width . 'x' . $height?>";
                    </script>
                    <script type="text/javascript" src="http://www.mcmediaplayer.com/public/mcmp_0.8.js"></script>
                    <!-- / MC Media Player -->
                </div>
                <br>
            </body>
            </html>
        <?php
        return 1;
    }
}

?>