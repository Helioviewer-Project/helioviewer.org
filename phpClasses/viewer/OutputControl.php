<?php
class OutputControl extends Control {
  public function getJSInitCode() {
		return "var ".$this->id." = new OutputReceiver('".$this->id."');\n";
  }
  
  public function outputHtml() {
?>
<div id="<?=$this->id?>" style="background-color: #fff">
</div>
<?php
  }
}
?>
