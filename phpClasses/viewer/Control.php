<?php
abstract class Control extends UIElement {
  protected $controller;
  
  public function __construct($controller, $options = null) {
    parent::__construct($options);
    $this->controller = $controller;
  }

}
?>
