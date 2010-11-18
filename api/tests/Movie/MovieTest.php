<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie Tests that are run on "HelioviewerMovie.php"
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'PHPUnit/Framework.php';
require_once 'api/src/Config.php';
require_once 'api/src/Image/ImageMetaInformation.php';

$config = new Config("settings/Config.ini");

class MovieTest extends PHPUnit_Framework_TestCase
{
	protected $eitImage;
	protected $c2Image;
	protected $c3Image;
	protected $outputDir;
	protected $outputFile;
	protected $startTime;
	protected $timeStep;
	protected $numFrames;
	protected $frameRate;
	protected $movieMeta;
	
	protected function setUp() 
	{
		$this->eitImage   = HV_JP2_DIR . '/2010/EIT/171/2010/01/01/2010_01_01__07_00_12_692__SOHO_EIT_EIT_171.jp2';
		$this->c2Image    = HV_JP2_DIR . '/2010/LASCO-C2/white-light/2010/01/01/2010_01_01__00_54_06_432__SOHO_LASCO_C2_white-light.jp2';
		$this->c3Image    = HV_JP2_DIR . '/2010/LASCO-C3/white-light/2010/01/02/2010_01_02__00_18_05_495__SOHO_LASCO_C3_white-light.jp2';
		$this->outputDir  = HV_CACHE_DIR . "/test";
		$this->outputFile = "test" . rand(0,1000);
		$this->roi = array(
					"top" => 0,
					"left" => 0,
					"bottom" => 1024,
					"right" => 1024
				);
		$this->startTime = "2010-03-01T12:12:12Z"; // ISO string
		$this->timeStep	 = 86400;
		$this->numFrames = 3;
		$this->frameRate = 8;
		$this->movieMeta = new Image_ImageMetaInformation(512,512,21.04);
	}
/*
	public function testHelioviewerMovieCreation() {
		require_once 'api/src/Movie/HelioviewerMovie.php';
		$hvMovie = new Movie_HelioviewerMovie(
			$this->startTime, $this->numFrames, $this->frameRate,
        	$this->timeStep, $this->outputFile,$this->movieMeta
        );
        $this->assertTrue(isset($hvMovie));
        $images = array();
        $timestamps = array();
        
        $startTime = toUnixTimestamp($this->startTime);
        for ($time = $startTime; $time < $startTime + $this->numFrames * $this->timeStep; $time += $this->timeStep) {
        	array_push($timestamps, $time);
        }
        
        foreach ($timestamps as $time) {
        	$isoTime = toISOString(parseUnixTimestamp($time));
        	$params = array(
        		'width' 	 => 512,
        		'height' 	 => 512,
        		'imageScale' => 21.04,
        		'obsDate' 	 => $isoTime,
        		'layers' 	 => "SOHO,EIT,EIT,284/SOHO,LASCO,C2,white-light"
        	);
        	
        	$client = new Module_WebClient($params);
        	$image = $client->takeFullImageScreenshot();
        	$this->assertFileExists($image);
        	array_push($images, $image);
        	echo "Built frame\n";
        }
        
        $hvMovie->build($images);
        
        $file = $hvMovie->getFilepath();
        $this->assertFileExists($file);
	}
*/
	public function testAPICallBuildMovie() {
		require_once 'api/src/Module/Movies.php';
		$params = array(
			'width'  	 => 512,
			'height'	 => 512,
			'imageScale' => 21.04,
			'startDate'	 => $this->startTime,
			'timeStep'	 => $this->timeStep,
			'frameRate'	 => $this->frameRate,
			'numFrames'	 => 20,
			'hqFormat'	 => "mp4",
			'quality'	 => 10,
			'filename'	 => "test",
			'layers'	 => "3,true,100,0,1024,0,1024,0,0/4,true,100,0,1024,0,1024,0,0"
		);
		$movieClient = new Module_Movies($params);
		$file = $movieClient->buildMovie();
		$this->assertFileExists($file);
	}
	
	public function testAPICallBuildQuickMovie() {
		require_once 'api/src/Module/Movies.php';
		$params = array(
			'width' 	 => 512,
			'height' 	 => 512,
			'imageScale' => 21.04,
			'startDate'  => $this->startTime,
			'layers'	 => "1/4"
		);
		
		$movieClient = new Module_Movies($params);
		$file = $movieClient->buildQuickMovie();
		$this->assertFileExists($file);
	}
}