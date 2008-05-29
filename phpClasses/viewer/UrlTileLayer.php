<?php
class UrlTileLayer extends TileLayer {
  protected $queryUrl;
  protected $tileSize = 256;
  protected $map;

  function getTileUrl($zoomLevel, $x, $y, $map = "") {
    return "$this->queryUrl?zoom=$zoomLevel&x=$x&y=$y&map=$map";
  }
  
  function getJSInitCode() {
    return "new UrlTileLayer(" . $this->viewport->id . ", '$this->queryUrl', " . ($this->map ? "'$this->map'" : "null") . ($this->opacity < 1 ? ", $this->opacity" : "") . ")";
  }
}
?>
