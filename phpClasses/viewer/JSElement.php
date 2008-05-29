<?php
abstract class JSElement extends OptionsElement {
  public $id;
  
  function __construct($options = null) {
    parent::__construct($options);
    if (!$this->id) $this->id = $this->getNextId();
  }
  
  public abstract function getJSInitCode();

  function getNextId() {
  	$class_name = strtolower(get_class($this));
    return $class_name . Counter::getNext($class_name);
  }
}
?>
