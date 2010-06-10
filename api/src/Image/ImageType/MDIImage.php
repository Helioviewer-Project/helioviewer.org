<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * ImageType_MDIImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 * 
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once HV_ROOT_DIR . '/api/src/Image/SubFieldImage.php';

class Image_ImageType_MDIImage extends Image_SubFieldImage
{
	private $_measurement;
	protected $tileSize;
	protected $width;
	protected $height;
	protected $_cacheDir = HV_CACHE_DIR;
    protected $_noImage  = HV_EMPTY_TILE;
	
	public function __construct(
		$width, $height, $date, $sourceJp2, $roi, $format, $jp2Width, $jp2Height, 
		$jp2Scale, $desiredScale, $detector, $measurement, $offsetX, $offsetY, $outputFile)
	{
		$this->_measurement = $measurement;
		parent::__construct($sourceJp2, $date, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, $outputFile);

		// MDI has no color table

        $this->width 	= $width;
        $this->height 	= $height;
	}
	
	public static function getFilePathNickName($det, $meas) 
	{
		return "MDI/$meas";
	}
}