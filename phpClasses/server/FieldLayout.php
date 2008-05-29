<?php
class FieldLayout implements Layout {
  protected $layout;
  protected $fieldnames;
  
  public function __construct($fieldnames, $layout = '') {
    $this->layout = $layout;
    if ($fieldnames) {
      if (is_array($fieldnames)) {
        $this->fieldnames = $fieldnames;    
      } else {
        $this->fieldnames = array($fieldnames);
      }
    } else {
      $this->fieldnames = array();
    }
  }
  
  public function getValue($fields) {
    $str = $this->layout;
    foreach($this->fieldnames as $fieldname) {
      $loc = strpos($this->layout, '?');
      $str = substr_replace($str, $fields[$fieldname], $loc, 1);
    }
    return $str;
  }
}
?>
