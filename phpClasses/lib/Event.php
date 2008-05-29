<?php
class Event extends Displayable {
  public $position;
  public $properties;
  
  public function __construct($label, $timestamp, $position, $properties) {
    parent::__construct($label, $timestamp);
    $this->position = $position;
    $this->properties = $properties;
  } 
}
?>
