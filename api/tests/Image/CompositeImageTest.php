<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * CompositeImage Tests that are run on the classes "HelioviewerCompositeImageLayer" and "HelioviewerCompositeImage".
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'PHPUnit/Framework.php';
require_once 'api/src/Config.php';
require_once 'api/src/Image/HelioviewerCompositeImageLayer.php';
require_once 'api/src/Image/Composite/HelioviewerCompositeImage.php';
require_once 'api/src/Image/HelioviewerImageMetaInformation.php';

$config = new Config("settings/Config.ini");

class CompositeImageTest extends PHPUnit_Framework_TestCase
{
	protected $eitImage;
	protected $c2Image;
	protected $c3Image;
	protected $outputFile;
	protected $roi;
	protected $time;

	protected function setUp() 
	{
		$this->eitImage = HV_JP2_DIR . '/2010/EIT/171/2010/01/01/2010_01_01__07_00_12_692__SOHO_EIT_EIT_171.jp2';
		$this->c2Image = HV_JP2_DIR . '/2010/LASCO-C2/white-light/2010/01/01/2010_01_01__00_54_06_432__SOHO_LASCO_C2_white-light.jp2';
		$this->c3Image = HV_JP2_DIR . '/2010/LASCO-C3/white-light/2010/01/02/2010_01_02__00_18_05_495__SOHO_LASCO_C3_white-light.jp2';
		$this->outputFile = HV_CACHE_DIR . "/test/image" . rand(0,1000) . ".png";
		$this->roi = array(
					"top" => 0,
					"left" => 0,
					"bottom" => 1024,
					"right" => 1024
				);
		$this->meta = new Image_ImageMetaInformation(1024, 1024, 10.52);
		$this->time = "2010-03-01T12:12:12Z";
	}

	public function testCreatingEITCompositeImageLayer()
	{
		$meta = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "EIT", "EIT", "171", $this->roi, 0, 0);
		
		$layer = new Image_HelioviewerCompositeImageLayer($this->eitImage, $this->outputFile, 'png', $meta, 1024, 1024, 2.63,  $this->time);
		
		$this->assertTrue(isset($layer));
		$this->assertFileExists($this->outputFile);
	}

	public function testCreatingC2CompositeImageLayer()
	{
		$meta = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "LASCO", "C2", "white-light", $this->roi, 0, 0);
		
		$layer = new Image_HelioviewerCompositeImageLayer($this->c2Image, $this->outputFile, 'png', $meta, 1024, 1024, 11.9, $this->time);
		
		$this->assertTrue(isset($layer));
		$this->assertTrue($layer->hasAlphaMask());
		$this->assertFileExists($this->outputFile);
	}
	
	public function testCreatingC3CompositeImageLayer()
	{
		$meta = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "LASCO", "C3", "white-light", $this->roi, 0, 0);
		
		$layer = new Image_HelioviewerCompositeImageLayer($this->c3Image, $this->outputFile, 'png', $meta, 1024, 1024, 14, $this->time);
		
		$this->assertTrue(isset($layer));
		$this->assertTrue($layer->hasAlphaMask());
		$this->assertFileExists($this->outputFile);
	}
	
	public function testCreatingCompositeImageWithOneLayer() 
	{
		$meta = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "LASCO", "C2", "white-light", $this->roi, 0, 0);
		
		$layer = new Image_HelioviewerCompositeImageLayer($this->c2Image, $this->outputFile, 'png', $meta, 1024, 1024, 11.9, $this->time);

		$this->assertFileExists($this->outputFile);
		
		$compImg = new Composite_HelioviewerCompositeImage($meta, array("edges" => false, "sharpen" => false), HV_CACHE_DIR . "/test");
		$this->assertTrue(isset($compImg));
		
		$compImg->compositeImageFromImageArray(array($layer));
		$this->assertFileExists($compImg->getComposite());
	}
	
	public function testCreatingTwoLayerCompositeImage() {
		$meta1 = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "EIT", "EIT", "171", $this->roi, 0, 0);
		$layer1 = new Image_HelioviewerCompositeImageLayer($this->eitImage, $this->outputFile, 'png', $meta1, 1024, 1024, 2.63, $this->time);

		$this->assertFileExists($this->outputFile);
		
		$outputFile2 = HV_CACHE_DIR . "/test/image" . rand(0,1000) . "c2.png";
		$meta2 = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "LASCO", "C2", "white-light", $this->roi, 0, 0);
		$layer2 = new Image_HelioviewerCompositeImageLayer($this->c2Image, $outputFile2, 'png', $meta2, 1024, 1024, 11.9, $this->time);

		$this->assertFileExists($outputFile2);
		
		$compImg = new Composite_HelioviewerCompositeImage($this->meta, array("edges" => false, "sharpen" => false), HV_CACHE_DIR . "/test");
		$compImg->compositeImageFromImageArray(array($layer1, $layer2));
		$this->assertFileExists($compImg->getComposite());
	}
	
	public function testCreatingMultiLayerCompositeImage() {
		$meta1 = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "EIT", "EIT", "171", $this->roi, 0, 0);
		$layer1 = new Image_HelioviewerCompositeImageLayer($this->eitImage, $this->outputFile, 'png', $meta1, 1024, 1024, 2.63, $this->time);

		$this->assertFileExists($this->outputFile);
		
		$outputFile2 = HV_CACHE_DIR . "/test/image" . rand(0,1000) . "c2.png";
		$meta2 = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "LASCO", "C2", "white-light", $this->roi, 0, 0);
		$layer2 = new Image_HelioviewerCompositeImageLayer($this->c2Image, $outputFile2, 'png', $meta2, 1024, 1024, 11.9, $this->time);

		$this->assertFileExists($outputFile2);

		$outputFile3 = HV_CACHE_DIR . "/test/image" . rand(0,1000) . "c3.png";
		$meta3 = new Image_HelioviewerImageMetaInformation(1024, 1024, 10.52, "SOHO", "LASCO", "C3", "white-light", $this->roi, 0, 0);
		$layer3 = new Image_HelioviewerCompositeImageLayer($this->c3Image, $outputFile3, 'png', $meta3, 1024, 1024, 14, $this->time);

		$this->assertFileExists($outputFile3);
		
		$compImg = new Composite_HelioviewerCompositeImage($this->meta, array("edges" => false, "sharpen" => false), HV_CACHE_DIR . "/test");
		$compImg->compositeImageFromImageArray(array($layer1, $layer2, $layer3));
		$this->assertFileExists($compImg->getComposite());
	}
}