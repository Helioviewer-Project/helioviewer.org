<?php
class TimeBrowserControl extends Control {
  public function getJSInitCode() {
		return "var ".$this->id." = new TimeBrowserControl('".$this->id."', ".$this->controller->id.");\n";
  }
  
  public function outputHtml() {
?>
<div id="<?=$this->id?>" class="timeBrowser">
  <div id="<?=$this->id?>Left" style="width: 100px; float: left; clear: both; overflow: hidden; height: 55px" class="tbLeft">
    <div style="height: 20px; line-height: 20px; vertical-align: middle">
      <a class="tbControl" style="float: left; width: 10px" href="#"><img src="images/TimeBrowser/left.gif" border="0"></a><div class="tbControl" style="float: left; width: 60px"><input id="<?=$this->id?>Day" class="tbDayControl"></div><a class="tbControl" style="float: left; width: 20px" href="#">go</a><a class="tbControl" style="float: left; width: 10px" href="#"><img src="images/TimeBrowser/right.gif" border="0"></a>
    </div>
    <div style="height: 35px; line-height: 35px">
      <a style="width: 33%; float: left" class="tbControl" href="#">(-)
      </a><a style="width: 34%; float: left" class="tbControl" href="#">(+)
      </a><a style="width: 33%; float: left" class="tbControl" href="#">[+]</a>
    </div>
    <div id="<?=$this->id?>Descriptions"></div>
  </div>
  <div id="<?=$this->id?>Right" style="height: 55px; position: relative" class="tbRight"></div>
  <div style="height: 10px; clear: both"><a href="#" id="<?=$this->id?>Toggle" class="tbControl" style="display: block; width: 100%; height: 10px; font-size: 8px; line-height: 10px"><img src="images/TimeBrowser/down.gif" border="0" style="margin: 3px; padding: 0; height: 5px;"></a></div>
</div>

<?php
  }
}

?>
