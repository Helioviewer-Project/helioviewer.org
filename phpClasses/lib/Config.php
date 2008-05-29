<?php
class Config {
  public function __construct($configfile) {
    $lines = file($configfile);
    $section = 'global';
    foreach($lines as $line) {
      $line = trim($line);
      if (substr($line, 0, 1) == ';') continue;
      if (substr($line, 0, 1) == '[' && substr($line, -1) == ']')
        $section = substr($line, 1, -1);
      elseif (false !== ($equalsPos = strpos($line, '='))) {
        $key = trim(substr($line, 0, $equalsPos));
        $value = trim(substr($line, $equalsPos+1));
        $this->$section->$key = $value;
      }
    }
  }
}
?>