<?php
/**
 * @class API
 * @author Keith Hughitt
 */
require_once('DbConnection.php');

class API {
	/**
	 * @constructor
	 */
	public function __construct ($params) {
		$this->params = $params;
		call_user_func(array("API" ,"_" . $params["action"]));
		exit();
	}
	
	/**
	 * getTile
	 * @return 
	 */
	private function _getTile () {
		require_once('lib/helioviewer/Tile.php');
		$tile = new Tile($this->params['imageId'], $this->params['zoom'], $this->params['x'], $this->params['y'], $this->params['ts']);
		$tile->display();
	}
	
	/**
	 * getClosestImage
	 */
	private function _getClosestImage () {
		require('lib/helioviewer/ImgIndex.php');
		$imgIndex = new ImgIndex(new DbConnection());
		
		$queryForField = 'abbreviation';
		foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
			$src["$field.$queryForField"] = $_GET[$field];
		}
		
		if (!isset($this->params["debug"])) {
			header('Content-type: application/json');
		}	
		
		echo json_encode($imgIndex->getClosestImage($_GET['timestamp'], $src, $debug));
	}
	
	/**
	 * getJP2
	 */
	private function _getJP2 () {
		require('lib/helioviewer/ImgIndex.php');
		$imgIndex = new ImgIndex(new DbConnection());
		
		$queryForField = 'abbreviation';
		foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
			$src["$field.$queryForField"] = $_GET[$field];
		}
		
		$filepath = $imgIndex->getJP2Location($this->params['timestamp'], $src);
		$filename = end(explode("/", $filepath));
		
		$fp = fopen($filepath, 'r');
		
		header("Content-Length: " . filesize($filepath));
		header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JP2));		
		header("Content-Disposition: attachment; filename=\"$filename\"");
		
		$contents = fread($fp, filesize($filepath));
		
		echo $contents;
 		fclose($fp);
	}
	
	/**
	 * getJP2Header
	 * @return 
	 * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
	 */
	private function _getJP2Header () {
		$id = $this->params["imageId"];
		
		$db  = new DbConnection();
		$sql = "SELECT uri FROM image WHERE id=$id;";
		
		$row = mysql_fetch_array($db->query($sql), MYSQL_ASSOC);
		$url = $row['uri'];
		
		// Query header information using Exiftool
		$cmd = "exiftool $url | grep Fits | grep -v Descr";
		exec($cmd, $out, $ret);
		
		$fits = array();
		foreach ($out as $index => $line) {
			$data = explode(":", $line);
			$param = substr(strtoupper(str_replace(" ", "", $data[0])), 4);
			$value = $data[1];
			array_push($fits, $param . ": " . $value);
		}
		
		header('Content-type: application/json');
		echo json_encode($fits);
	}
}
?>
