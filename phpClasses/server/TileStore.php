<?php
class TileStore {
	private $dbConnection;
	private $tilestable = "tile";
	private $noImage = "images/transparent.gif";

	public function __construct($dbConnection) {
		$this->dbConnection = $dbConnection;
	}

	function getNumTiles($detector, $zoom) {
		$query = "SELECT lowestRegularZoomLevel FROM detector WHERE name = '$detector';";
		$result = $this->dbConnection->query($query);
		$row = mysql_fetch_array($result);
		
		$difference = $row['lowestRegularZoomLevel'] - $zoom;
		if ($difference > 0)
			return pow(4, 1 + $difference);
		else
			return 4;     
	}

	function getTile($imageId, $zoom, $x, $y) {
		$query = "SELECT tile FROM tile WHERE imageId=$imageId AND zoom=$zoom AND x=$x AND y=$y";
		//echo $query;
		$result = $this->dbConnection->query($query);
		if (!$result) {
			echo "$query - failed\n";
			die (mysql_error());
		}
		if (mysql_num_rows($result) > 0) {
			$row = mysql_fetch_array($result);
			return $row;
		} else {
			//return file_get_contents($this->noImage);
			return false;
		}
	}

	function outputTileURI($imageId, $zoom, $x, $y) {
		$query = "SELECT url FROM tile WHERE imageId=$imageId AND zoom=$zoom AND x=$x AND y=$y";
		//echo $query;
		$result = $this->dbConnection->query($query);
		if (!$result) {
			echo "$query - failed\n";
			die (mysql_error());
		}
		if (mysql_num_rows($result) > 0) {
			$row = mysql_fetch_array($result);
			return $row;
		} else {
			//return file_get_contents($this->noImage);
			return false;
		}
	}

	function outputTile($imageId, $detector, $zoom, $x, $y) {
		// Cache-Lifetime (in minutes)
		$lifetime = 60;
		$exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
		header("Expires: " . $exp_gmt);
		header("Cache-Control: public, max-age=" . $lifetime * 60);
		// Special header for MSIE 5
		header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);

		$numTiles = $this->getNumTiles($detector, $zoom);
		if ($numTiles >1) {
			$offset = max(1, (int)(sqrt($numTiles)/2));
			$row = $this->getTile($imageId, $zoom, $x + $offset, $y + $offset);
			header('Content-type: image/jpeg');
			if ($row) echo $row['tile'];
			else readfile($this->noImage);
		} else {
			header('Content-type: image/jpeg');
			readfile($this->noImage);
		}
	}
}
?>
