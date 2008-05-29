<?php
abstract class Viewer extends JSElement {
  protected $uielements;
  protected $config;
      
  public function outputJSInitCode() {
    echo $this->getJSInitCode();
		return $this;
  }

	public function getJSInitCode() {
		$str = '';
		foreach ($this->uielements as $uielement) {
      $str .= $uielement->getJSInitCode();
    }
    return $str;
	}

  public function addUiElement($uielement, $name = null) {
  	$this->uielements[] = $uielement;
  	if ($name) $this->$name = $uielement;
  	return $this;
  }

	public function addUiElements(array $uielements) {
		foreach($uielements as $key => $uielement) {
			$name = (is_numeric($key) ? null : $key);
			$this->addUiElement($uielement, $name);
		}
		return $this;
	}
}
?>
