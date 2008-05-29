<?php
// This is the MVC Controller
class Helioviewer extends Viewer {
  public $viewports;
  
  public function __construct($options = null) {
  	parent::__construct($options);
  	
    $this->config = new Config('config/helioviewer.ini');
    
    $this->addUiElements(array(
    	'output' => new OutputControl($this, array('id' => 'output')),
    	'timeBrowser' => new TimeBrowserControl($this, array('id' => 'timeBrowser'))
    ));

    for ($i = 0; $i < $this->config->viewports->numViewports; $i++) {
      $viewport = new Viewport($this, array(
        'zoomLevel' => $this->config->viewports->defaultZoomLevel
      ));
      $viewport->addTileLayer(new UrlTileLayer(array(
      													'viewport' => $viewport,
                                'queryUrl' => 'getTile.php',
                                'map' => '2003_10_01_000000_soho_LAS_0C2_0WL')))
               ->addTileLayer(new UrlTileLayer(array(
               									'viewport' => $viewport,
                                'queryUrl' => 'getTile.php')));
			$zoom = new ZoomControl($viewport);
      $this->addUiElement($viewport);
    	$this->addUiElement($zoom);
      $this->viewports[] = $viewport; 
			$this->zooms[] = $zoom;    	
    }
  }
  
 	public function getJSInitCode() {
		$str = "var ".$this->id." = new Helioviewer();\n";
    $str .= parent::getJSInitCode();
		return $str;
  }
}
?>