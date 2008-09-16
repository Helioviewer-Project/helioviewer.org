<?php
/*
 * Created on Sep 15, 2008
 * 
 * Note: For movies, it is easiest to work with Unix timestamps since that is what is returned
 *       from the database. To get from a javascript Date object to a Unix timestamp, simply
 *       use "date.getTime() * 1000." (getTime returns the number of miliseconds)
 */
require('CompositeImage.php');
require('../phpClasses/lib/DbConnection.php');
require_once('../phpClasses/phpvideotoolkit/config.php');
require_once('../phpClasses/phpvideotoolkit/phpvideotoolkit.php5.php');


class ImageSeries {
	private $images = array();
	private $maxFrames;
	private $startTime;
	private $endTime;
	private $timeStep;
	private $db;
	private $tmpdir = "/var/www/hv/api/tmp/";
	
	/*
	 * constructor
	 */
	public function __construct($layers, $startTime, $zoomLevel, $numFrames) {
		date_default_timezone_set('UTC');
		
		$this->layers = $layers;
		$this->startTime = $startTime;
		$this->zoomLevel = $zoomLevel;
		$this->numFrames = $numFrames;
		
		$this->db = new DbConnection();
	}
	
	/*
	 * toMovie
	 */
	public function toMovie() {
		
	}
	
	/*
	 * toArchive
	 */
	public function toArchive() {
		
	}
	
	/*
	 * getNumFrames
	 */
	 public function getNumFrames() {
	 	
	 }
	 
	 /*
	  * buildMovie
	  */
	private function buildMovie() {
		
	}
	
	/*
	 * quickMovie
	 */
	public function quickMovie() {
		// First layer is the primary one
		$layer = $this->layers[0];
		
		$obs  = "soho";
		$inst = substr($layer, 0, 3);
		$det  = substr($layer, 3,3);
		$meas = substr($layer, 6,3);		
		

		$sql = "SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - $this->startTime AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - $this->startTime) AS timediffAbs 
				FROM image
					LEFT JOIN measurement on measurementId = measurement.id
					LEFT JOIN measurementType on measurementTypeId = measurementType.id
					LEFT JOIN detector on detectorId = detector.id
					LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
					LEFT JOIN instrument on instrumentId = instrument.id
					LEFT JOIN observatory on observatoryId = observatory.id
             	WHERE observatory.abbreviation='$obs' AND instrument.abbreviation='$inst' AND detector.abbreviation='$det' AND measurement.abbreviation='$meas' ORDER BY timediffAbs LIMIT 0,$this->numFrames";
        
		//echo "SQL: $sql <br><br>";
             	
		$result = $this->db->query($sql);
		$resultArray = array();
		
		while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
    		array_push($resultArray, $row);
		}
		
		//Sort by time
		foreach ($resultArray as $key => $row) {
    		$timediff[$key]  = $row['timediff'];
		}
		array_multisort($timediff, SORT_ASC, $resultArray);

		//Create images
		$i = 0;
		foreach ($resultArray as $time) {
			
			//CompositeImage excepts an array of timestamps
			$ts = array();
			array_push($ts, $time['unix_timestamp']);
			
			$img = new CompositeImage($this->layers, $ts, $this->zoomLevel, false);
			$fn = $this->tmpdir . $i . '.jpg';
			$img->writeImage($fn);
			
			array_push($this->images, $fn);
			$i++;
		}
		
		// 	init PHPVideoToolkit class
		$toolkit = new PHPVideoToolkit($this->tmpdir);
				
		// 	compile the image to the tmp dir with an input frame rate of 10 per second
		$ok = $toolkit->prepareImagesForConversionToVideo($this->images, 10);
		if(!$ok)
		{
			// 		if there was an error then get it
			echo $toolkit->getLastError()."<br />\r\n";
			exit;
		}
		
		$toolkit->setVideoOutputDimensions(1024, 1024);

		// 	set the output parameters
		$output_filename = 'out.avi';
		$ok = $toolkit->setOutput($this->tmpdir, $output_filename, PHPVideoToolkit::OVERWRITE_EXISTING);
		if(!$ok)
		{
			// 		if there was an error then get it
			echo $toolkit->getLastError()."<br />\r\n";
			exit;
		}
		
		// 	execute the ffmpeg command
		$quickMov = $toolkit->execute(false, true);
		
		
		// 	check the return value in-case of error
		if($quickMov !== PHPVideoToolkit::RESULT_OK) {
			// 		if there was an error then get it
			echo $toolkit->getLastError()."<br />\r\n";
			exit;
		}
	
		$thumb = array_shift($toolkit->getLastOutput());
			echo "Video created from images... <b>".basename($thumb)."</b><br />";
			echo '<img src="tmp/'.basename($thumb).'" border="0" /><br /><br />';
		    echo '</body></html>';
	}
}
?>
