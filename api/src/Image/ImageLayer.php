<?php 
/**
 * Image_ImageLayer class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Image_ImageLayer class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
abstract class Image_ImageLayer
{
    protected $outputFile;
    protected $image;
    
    /**
     * Constructor
     * 
     * @param object $image      A built ImageType object
     * @param string $outputFile The output file of the image
     */
    public function __construct($image, $outputFile)
    {
        $this->outputFile 	= $outputFile;
        $this->image		= $image;
    }
    
    /**
     * Gets the filepath
     * 
     * @return string outputFile
     */
    public function getFilePathString() 
    {
        return $this->image->outputFile();
    }

    /**
     * Sets a new filepath 
     * 
     * @param string $filePath New filepath
     * 
     * @return void
     */
    public function setNewFilePath($filePath) 
    {
        $this->image->setNewFilePath($filePath);
    }
}
?>