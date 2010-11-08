<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Screenshot Tests that are run on "HelioviewerScreenshot.php"
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
require_once 'api/src/Image/HelioviewerImageMetaInformation.php';
$config = new Config("settings/Config.ini");

class ScreenshotTest extends PHPUnit_Framework_TestCase
{
	protected $eitImage;
	protected $c2Image;
	protected $c3Image;
	protected $outputFile;
	protected $time;
	
	protected function setUp() 
	{
		$this->eitImage = HV_JP2_DIR . '/2010/EIT/171/2010/01/01/2010_01_01__07_00_12_692__SOHO_EIT_EIT_171.jp2';
		$this->c2Image = HV_JP2_DIR . '/2010/LASCO-C2/white-light/2010/01/01/2010_01_01__00_54_06_432__SOHO_LASCO_C2_white-light.jp2';
		$this->c3Image = HV_JP2_DIR . '/2010/LASCO-C3/white-light/2010/01/02/2010_01_02__00_18_05_495__SOHO_LASCO_C3_white-light.jp2';
		$this->outputFile = HV_CACHE_DIR . "/test/image" . rand(0,1000) . ".png";
		$this->roi = array(
					"top" 	 => 0,
					"left" 	 => 0,
					"bottom" => 1024,
					"right"  => 1024
				);
		$this->time = "2010-03-01T12:12:12Z"; // ISO String
	}
/*
 * outdated. No longer use HelioviewerImageMetaInformation
	public function testSingleLayerScreenshotCreation() {
		require_once 'api/src/Image/Screenshot/HelioviewerScreenshot.php';
		$meta = new Image_HelioviewerImageMetaInformation(1024, 1024, 1, "SOHO", "EIT", "EIT", 171, $this->roi, 0, 0);
		$screenshot = new Screenshot_HelioviewerScreenshot($this->time, $meta, $this->outputFile, 10);
		$this->assertTrue(isset($screenshot));
		
		$screenshot->buildImages(array($meta));
		$this->assertFileExists($screenshot->getComposite());
	}
	
	public function testMultiLayerScreenshotCreation() {
		require_once 'api/src/Image/Screenshot/HelioviewerScreenshot.php';
		$eitMeta = new Image_HelioviewerImageMetaInformation(1024, 1024, 1, "SOHO", "EIT", "EIT", 171, $this->roi, 0, 0);
		$c2Meta = new Image_HelioviewerImageMetaInformation(1024, 1024, 1, "SOHO", "LASCO", "C2", "white-light", $this->roi, 0, 0);
		$c3Meta = new Image_HelioviewerImageMetaInformation(1024, 1024, 1, "SOHO", "LASCO", "C3", "white-light", $this->roi, 0, 0);
				
		$screenshot = new Screenshot_HelioviewerScreenshot($this->time, $eitMeta, $this->outputFile, 10);
		$this->assertTrue(isset($screenshot));
		
		$screenshot->buildImages(array($eitMeta, $c2Meta, $c3Meta));	
		$this->assertFileExists($screenshot->getComposite());
	}
*/	
	public function testAPICallToTakeScreenshot() {
		require_once HV_ROOT_DIR . "/api/src/Module/WebClient.php";
		$params = array(
			'obsDate' 	 => $this->time,
			'imageScale' => 10.52,
			'layers' 	 => "0,true,100,0,1024,0,1024,0,0/4,true,100,0,1024,0,1024,0,0",
			'width'  	 => 1024,
			'height'	 => 1024,
			'filename' 	 => 'testScreenshot' . time() . '.png',
			'quality' 	 => 10
		);
		$module = new Module_WebClient($params);
		$screenshot = $module->takeScreenshot();
		$this->assertFileExists($screenshot);
	}
	
	public function testAPICallToTakeFullImageScreenshot() {
		require_once HV_ROOT_DIR . "/api/src/Module/WebClient.php";
		$params = array(
			'obsDate' 	 => $this->time,
			'imageScale' => 21.04,
			'width' 	 => 512,
			'height'	 => 512,
			'layers'	 => "2/4"
		);
		$module = new Module_WebClient($params);
		$screenshot = $module->takeFullImageScreenshot();
		$this->assertFileExists($screenshot);
	}
}
?>