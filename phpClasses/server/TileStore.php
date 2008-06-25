<?php
class TileStore {
  private $dbConnection;
  private $tilestable = "tile";
  //private $mapstable = "maps";
  private $noImage = "images/transparent.gif";

  const CUT_OUT_ONE_TILE_IMAGES = false;
  const SUN_DIAMETER_MULTIPLIER = 1.4;

  public function __construct($dbConnection) {
    $this->dbConnection = $dbConnection;
  }

  function getNumTiles($imageId, $zoom) {
    $query = "SELECT COUNT(tile) AS numTiles FROM $this->tilestable WHERE imageId=$imageId AND zoom=$zoom";
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
    /**
    if ($numTiles == 1 && ($x == 0 || $x == -1) && ($y == 0 || $y == -1)) {
      $row = $this->getTile($imageId, $zoom, 0, 0);
      $mask = self::CUT_OUT_ONE_TILE_IMAGES && ($row['instrument'] == 'EIT');
      $orgImg = imagecreatefromstring($row['tile']);
      $width = imagesx($orgImg);
      $height = imagesy($orgImg);
      $w2 = (int)($width / 2);
      $h2 = (int)($height / 2);
      if ($mask) {
        $col = ImageColorAllocate($orgImg, 255, 0, 255);
        $d = (int)(min($width, $height) / $row['imgSunRatio'] * self::SUN_DIAMETER_MULTIPLIER); 
        imageellipse($orgImg, $w2, $h2, $d, $d, $col);
      }
      $img = imagecreatetruecolor($width, $height);
      $black = imagecolorallocate($img, 0, 0, 0);
      imagefill($img, $black, 0, 0);
      $srcX = ($x+1) * $w2;
      $srcY = ($y+1) * $h2;
      $destX = (-$x) * $w2;
      $destY = (-$y) * $h2;
      imagecopy($img, $orgImg, $destX, $destY, $srcX, $srcY, $w2, $h2);      
      if ($mask) {
        $col = ImageColorAllocate($img, 255, 0, 255);
        imagefilltoborder($img, $srcX, $srcY, $col, $col);
        imagecolortransparent($img, $col);
        header('Content-type: image/png');
        imagepng($img);
      } else {
        header('Content-type: image/jpeg');
        imagejpeg($img);
      }
    } else if ($numTiles > 1) { **/
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
