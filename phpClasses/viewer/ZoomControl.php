<?php
class ZoomControl extends Control {
  public function __construct($controller, $options = null) {
    $this->style = array();
    parent::__construct($controller, $options);
    
    if (!$this->style['position']) $this->style['position'] = 'absolute';
    if (!$this->style['left']) $this->style['left'] = '20px';
    if (!$this->style['top']) $this->style['top'] = '20px';
    if (!$this->style['z-index']) $this->style['z-index'] = '101';
  }

  public function getJSInitCode() {
    return "var $this->id = new ZoomControl('$this->id', ".$this->controller->id.");\n";  
  }
  
  public function outputHtml() {
    $strStyle = "";
    if ($this->style) {
      foreach($this->style as $property => $value) {
        $strStyle .= "$property: $value;";
      }
    }
?>
<div id="<?=$this->id?>" style="<?=$strStyle?>">
<div id="<?=$this->id?>zoomIn" style="width:15px;height:15px;background-color:#fff; color: #000; font-size: 12pt; line-height: 10pt; -moz-user-select: none; cursor: pointer; text-align: center; margin-bottom: 5px" unselectable="on">+</div>
<div id="<?=$this->id?>track" style="width:15px;background-color:#aaa;height:150px;">
  <div id="<?=$this->id?>handle" style="width:15px;height:15px;background-color:#fff; color: #000; font-size: 8pt; font-weight: bold; -moz-user-select: none; cursor: pointer; text-align: center;" unselectable="on"> </div>
</div>
<div id="<?=$this->id?>zoomOut" style="width:15px;height:15px;background-color:#fff; color: #000; font-size: 12pt; line-height: 10pt; -moz-user-select: none; cursor: pointer; text-align: center; margin-top: 5px;" unselectable="on">&#8722;</div>
</div>
<?php
  }
}
?>
