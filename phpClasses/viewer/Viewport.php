<?php
class Viewport extends Control {
  protected $tileLayers;
  protected $overlayLayers;
  protected $zoomLevel;
  
  public function setZoomLevel($level) {
    $this->zoomLevel = $level;
    return $this;
  }
  
  public function getJSInitCode() {
    $str = "var ".$this->id." = new Viewport('".$this->id."', ".$this->controller->id.", ".$this->zoomLevel.($this->controller->output ? ", " . $this->controller->output->id : "").");\n";
    foreach ($this->tileLayers as $tileLayer) {
      $str .= $this->id.".addLayer(".$tileLayer->getJSInitCode().");\n";
    }
    $str .= $this->controller->id.".addViewport(".$this->id.");\n";
    return $str;
  }
  
  public function addTileLayer($tileLayer) {
    $this->tileLayers[] = $tileLayer;
    return $this;
  }
  
  public function outputHtml() {
?>
    <div id="<?=$this->id?>" class="viewport" style="height: 100%; margin-bottom: 10px">
      <div style="position: absolute; left: 0px; top: 0px; overflow: hidden; width: 100%; height: 100%;">
        <div id="<?=$this->id?>movingContainer" class="movingContainer">
        </div>  
      </div>  
    </div>
<?php
    return $this;
  }
}
?>
