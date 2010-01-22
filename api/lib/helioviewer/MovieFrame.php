<?php
/**
 * @author Jaclyn Beck
 * @fileoverview The MovieFrame class is used when generating composite images, or 'frames', for movies.
 */

require('CompositeImage.php');

class MovieFrame extends CompositeImage {
    protected $frameNum;
    protected $layerImages;
    protected $cacheFileDir;
    protected $imageSize;
    
    /**
     * Constructor
     * @param int $zoomLevel
     * @param array $layerImages is an array of layer information strings in the format: "uri,xStart,xSize,yStart,ySize,opacity,opacityGrp"
     * @param array $options is an array with true/false values for "EdgeEnhance" and "Sharpen"
     * @param int $folderId is the unix timestamp of when the movie was requested, and is used to make a folder to store the movie in.
     * @param int $frameNum -- which frame this movieFrame belongs to
     * @param array $imageSize -- array of width and height of the image
     * @param array $timestamps -- Associative array containing the actual timestamps of each layer, obtained from the database
     */
    public function __construct($zoomLevel, $options, $layerImages, $frameNum, $folderId, $imageSize, $timestamps, $quality) {
        $this->frameNum     = $frameNum;
        $this->layerImages     = $layerImages;
        $this->imageSize     = $imageSize;
        $this->timestamps     = $timestamps;
        $this->quality        = $quality;
        
        $tmpDir = HV_CACHE_DIR . "movies/";

        parent::__construct($zoomLevel, $options, $tmpDir);

        // Directory to store all of the final frame images before they are compiled into a video    
        $this->cacheFileDir = $tmpDir . $folderId . "/";
        
        if(!file_exists($this->cacheFileDir))
            mkdir($this->cacheFileDir, 0777);
        
        $this->compileImages();
    }
}

?>