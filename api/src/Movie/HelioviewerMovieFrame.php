<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie_HelioviewerMovie Class Definition
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require 'src/Image/CompositeImage.php';

/**
 * Class is used when generating composite images, or 'frames', for movies.
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_HelioviewerMovieFrame extends Image_CompositeImage
{
    protected $frameNum;
    protected $layerImages;
    protected $cacheFileDir;
    protected $imageSize;
    
    /**
     * Movie_HelioviewerMovieFrame Constructor
     * 
     * @param int   $zoomLevel   Zoom-level for which the movie frame should be created\
     * @param array $options     An array with true/false values for "EdgeEnhance" and "Sharpen"
     * @param array $layerImages An array of layer information strings in the format:
     *                           "uri,xStart,xSize,yStart,ySize,opacity,opacityGrp"
     * @param int   $frameNum    Which frame this movieFrame belongs to
     * @param int   $folderId    Unix timestamp of when the movie was requested, and is used to make a 
     *                           folder to store the movie in.
     * @param array $imageSize   Array of width and height of the image
     * @param array $timestamps  Array containing the actual timestamps of each layer, obtained from the database
     * @param int   $quality     Movie quality
     */
    public function __construct(
        $zoomLevel, $options, $layerImages, $frameNum, $folderId, $imageSize, $timestamps, $quality
    ) {
        $this->frameNum    = $frameNum;
        $this->layerImages = $layerImages;
        $this->imageSize   = $imageSize;
        $this->timestamps  = $timestamps;
        $this->quality     = $quality;
        
        $tmpDir = HV_CACHE_DIR . "movies/";

        parent::__construct($zoomLevel, $options, $tmpDir);

        // Directory to store all of the final frame images before they are compiled into a video    
        $this->cacheFileDir = $tmpDir . $folderId . "/";
        
        if (!file_exists($this->cacheFileDir)) {
            mkdir($this->cacheFileDir);
            chmod($this->cacheFileDir, 0777);
        }
        
        $this->compileImages();
    }
}
?>