<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_Composite_HelioviewerScreenshot class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Image/Composite/HelioviewerCompositeImage.php';
/**
 * Image_Composite_HelioviewerScreenshot class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_Composite_HelioviewerScreenshot
    extends Image_Composite_HelioviewerCompositeImage {

    public $id;

    /**
     * Creates a new screenshot
     */
    public function __construct($layers, $events, $eventLabels, $scale,
        $scaleType, $scaleX, $scaleY, $obsDate, $roi, $options) {

        parent::__construct($layers, $events, $eventLabels, $scale,
            $scaleType, $scaleX, $scaleY, $obsDate, $roi, $options);

        if ( array_key_exists('action', $options) &&
             $options['action'] == 'downloadScreenshot' ) {

            $this->id = $options['id'];
            $this->timestamp = $options['timestamp'];
            $this->date = $options['observationDate'];
        }
        else {
            $this->id = $this->_getScreenshotId();
            $this->timestamp = date('Y-m-d');
        }
        $this->build($this->_buildFilepath());

        //TODO: Either include a status field in db, or remove entry if
        //      build fails?
    }

    /**
     * Computes a filename to use for the screenshot
     *
     * @return string Filename
     */
    private function _buildFilepath() {
        $created = new DateTime($this->timestamp);
        return sprintf(
            '%s/screenshots/%s/%s/%s_%s.png',
            HV_CACHE_DIR,
            date('Y/m/d', $created->getTimestamp()),
            $this->id,
            substr(
                str_replace(
                    array(':', '-', 'T', 'Z', ' '),
                    '_',
                    $this->date),
                0, 19),
            $this->layers->toString()
        );
    }

    /**
     * Adds the screenshot to the database and returns its assigned identifier
     *
     * @return int Screenshot id
     */
    private function _getScreenshotId() {
        return $this->db->insertScreenshot(
            $this->date,
            $this->imageScale,
            $this->roi->getPolygonString(),
            $this->watermark,
            $this->layers->serialize(),
            $this->layers->getBitMask(),
            $this->events->serialize(),
            $this->eventsLabels,
            $this->scale,
            $this->scaleType,
            $this->scaleX,
            $this->scaleY,
            $this->layers->length()
        );
    }
}
?>