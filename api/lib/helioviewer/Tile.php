<?php
/**
 * @class Tile
 * @author Keith Hughitt
 */
require('JP2Image.php');

class Tile extends JP2Image {
    private $x;
    private $y;

    /**
     * constructor
     */
    public function __construct($uri, $zoomLevel, $x, $y, $tileSize, $display = true) {
        $xRange = array("start" => $x, "end" => $x);
        $yRange = array("start" => $y, "end" => $y);

        parent::__construct($uri, $zoomLevel, $xRange, $yRange, $tileSize);

        $this->x = $x;
        $this->y = $y;
        $this->getTile($display);
    }

    /**
     * getTile
     */
    function getTile($display) {
       
        // Tile image format
        $format = $this->getImageFormat();
        
        // Filepaths (for intermediate pgm and final png/jpg image)
        $tile = $this->getTileFilepath($format);
        
        // If tile already exists in cache, use it
        if (Config::ENABLE_CACHE && $display) {
            if (file_exists($tile)) {
                $this->display($tile);
                exit();
            }
        }

        // If nothing useful is in the cache, create the tile from scratch
        $im = $this->buildImage($tile);

        // Store image
        $this->image = $im;
        
        // Display image
        if ($display)
            $this->display($tile);
    }

    /**
     * getTileFilepath
     * @return
     */
    function getTileFilepath($format) {
        // Base directory
        $filepath = $this->cacheDir;
                
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
        }
        // Base filename
        $filename = substr($this->uri, 0, -4);

        // Date information
        $year  = substr($this->timestamp,0,4);
        $month = substr($this->timestamp,5,2);
        $day   = substr($this->timestamp,8,2);
        
        // Create necessary directories
        $filepath .= $year . "/";
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
        }

        $filepath .= $month . "/";
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
        }

        $filepath .= $day . "/";
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
        }
        
        $filepath .= $this->observatory . "/";
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
         }
        
        $filepath .= $this->instrument . "/";
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
         }
       
        $filepath .= $this->detector . "/";
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
         }

        $filepath .= $this->measurement . "/";
        if (!file_exists($filepath)) {
            mkdir($filepath);
            chmod($filepath, 0777);
         }
         
        // Convert coordinates to strings
        $xStr = "+" . str_pad($this->x, 2, '0', STR_PAD_LEFT);
        if (substr($this->x,0,1) == "-")
            $xStr = "-" . str_pad(substr($this->x, 1), 2, '0', STR_PAD_LEFT);

        $yStr = "+" . str_pad($this->y, 2, '0', STR_PAD_LEFT);
        if (substr($this->y,0,1) == "-")
            $yStr = "-" . str_pad(substr($this->y, 1), 2, '0', STR_PAD_LEFT);

        $filepath .= $filename . "_" . $this->zoomLevel . "_" . $xStr . "_" . $yStr . ".$format";

        return $filepath;
    }
}
?>
