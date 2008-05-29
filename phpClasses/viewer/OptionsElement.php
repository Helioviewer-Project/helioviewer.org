<?php
abstract class OptionsElement {
  public function __construct($options) {
    if (is_array($options))
      foreach ($options as $key=>$value)
        $this->$key = $value;                        	
  }
}
?>
