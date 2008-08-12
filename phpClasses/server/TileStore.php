<?php
class TileStore {
  private $dbConnection;
  private $tilestable = "tile";
  private $noImage = "images/transparent.gif";

  public function __construct($dbConnection) {
    $this->dbConnection = $dbConnection;
  }

  function getNumTiles($imageId, $zoom) {
    $query = "SELECT COUNT(tile) AS numTiles FROM $this->tilestable WHERE imageId=$imageId AND zoom=$zoom";
    //echo $query;
    $result = $this->dbConnection->query($query);
		if (!$result) {
      echo "$query - failed\n";
      die (mysql_error());
    }
    if (mysql_num_rows($result) > 0) {
      $row = mysql_fetch_array($result);
      return $row['numTiles'];    
    } else {
      return false;
    }
  }

  function getTile($imageId, $zoom, $x, $y) {
    //$query = "SELECT t1.tile AS tile, t1.imgSunRatio AS imgSunRatio, t2.instrument AS instrument FROM $this->tilestable AS t1, $this->mapstable AS t2 WHERE t2.map='$map' AND t1.map='$map' AND t1.zoom=$zoom AND t1.x=$x AND t1.y=$y";
		$query = "SELECT tile FROM tile WHERE imageId=$imageId AND zoom=$zoom AND x=$x AND y=$y";
//echo "query: $query";
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
  
  function outputTile($imageId, $zoom, $x, $y) {
    // Cache-Lifetime (in minutes)
    $lifetime = 60;
    $exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
    header("Expires: " . $exp_gmt);
    header("Cache-Control: public, max-age=" . $lifetime * 60);
    // Special header for MSIE 5
    header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);
  
    $numTiles = $this->getNumTiles($imageId, $zoom);
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
