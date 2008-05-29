<?php
class DateLayout implements Layout {
  protected $fieldname;

  public function __construct($fieldname) {
    $this->fieldname = $fieldname;
  }

  public function getValue($fields) {
    return strtotime($fields[$this->fieldname]);
  }
}
?>
