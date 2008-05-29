<?php
// ImageMaps or Events
class Displayable {
  public $name;
  public $timestamp;
  
  public function __construct($name, $timestamp) {
    $this->name = $name;
    $this->timestamp = $timestamp;
  }
}
?>
