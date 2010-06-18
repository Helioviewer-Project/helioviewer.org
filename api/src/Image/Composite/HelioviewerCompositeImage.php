<?php
/**
 * Image_Composite_HelioviewerCompositeImage class definition
 *
 * PHP version 5
 *
 * @category Composite
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'CompositeImage.php';
/**
 * Image_Composite_HelioviewerCompositeImage class definition
 *
 * PHP version 5
 *
 * @category Composite
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_Composite_HelioviewerCompositeImage extends Image_Composite_CompositeImage
{
    /**
     * Constructor
     * 
     * @param object $meta     An ImageMetaInformation object
     * @param array  $options  An array with booleans for 'sharpen' and 'edges'
     * @param string $tmpDir   The directory where extracted images are stored
     * @param string $filename The filename of the output image
     */
    public function __construct($meta, $options, $tmpDir, $filename)
    {
        parent::__construct($meta, $options, $tmpDir, $filename);
    }
    
    /**
     * Builds an imagemagick command to composite watermark text onto the image
     * 
     * @return string command
     */
    protected function getWaterMarkText()
    {
        $cmd 	 = "";
        $nameCmd = "";
        $timeCmd = "";

        // Put the names on first, then put the times on as a separate layer so the times are nicely aligned.
        foreach ($this->layerImages as $layer) {
            $nameCmd .= $layer->getWaterMarkName();
            $timeCmd .= $layer->getWaterMarkTimestamp();
        }

        // Outline words in black
        $cmd .= " -stroke #000C -strokewidth 2 -annotate +20+0 '$nameCmd'";
        // Write words in white over outline
        $cmd .= " -stroke none -fill white -annotate +20+0 '$nameCmd'";
        // Outline words in black
        $cmd .= " -stroke #000C -strokewidth 2 -annotate +100+0 '$timeCmd'";
        // Write words in white
        $cmd .= " -stroke none -fill white -annotate +100+0 '$timeCmd'";

        return $cmd;
    }
}

?>