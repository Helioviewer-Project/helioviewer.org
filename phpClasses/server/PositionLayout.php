<?php
class PositionLayout extends FieldLayout {
  const POS_MODE_AUTO = 0;
  const POS_MODE_LONLAT = 1;
  const POS_MODE_WENS = 2;
  const POS_MODE_PA = 3;
  const POS_MODE_ASEC = 4;
  const SUN_ANGULAR_DIAMETER = 32;    // In Arc Minutes. ToDo: Calculate based on day of year
  
  private $mode;
  
  public function __construct($fieldnames, $mode = POS_MODE_AUTO) {
    if ($fieldnames) {
      if (is_array($fieldnames)) {
        $this->fieldnames = $fieldnames;    
      } else {
        $this->fieldnames = array($fieldnames);
      }
    } else {
      $this->fieldnames = array();
    }
    $this->mode = $mode;
  }
  
  public function getValue($fields) {
    switch ($this->mode) {
      case self::POS_MODE_LONLAT:
        return $this->parseLonLat($fields[$this->fieldnames[0]], $fields[$this->fieldnames[1]]);
      	break;
      case self::POS_MODE_WENS:
        return $this->parseWens($fields[$this->fieldnames[0]]);
      	break;
      case self::POS_MODE_PA:
        return $this->parsePa($fields[$this->fieldnames[0]]);
      	break;
      case self::POS_MODE_ASEC:
        return $this->parseAsec($fields[$this->fieldnames[0]], $fields[$this->fieldnames[1]]);
      	break;
      case self::POS_MODE_AUTO:
      default:
        // Try to guess the position scheme
        if (sizeof($this->fieldnames) == 1) {
          if (preg_match('/[we]\d{1,2}[ns]\d{1,2}/i', $fields[$this->fieldnames[0]]))
            return $this->parseWens($fields[$this->fieldnames[0]]);
          elseif (preg_match('/\d{1,3}/', $fields[$this->fieldnames[0]]))
            return $this->parsePa($fields[$this->fieldnames[0]]);
        } elseif (sizeof($this->fieldnames) == 2) {
          if (abs($fields[$this->fieldnames[0]]) <= 90 && abs($fields[$this->fieldnames[1]]) <= 90
            && preg_match('/lon|lat/i', implode('', $this->fieldnames)))
            return $this->parseLonLat($fields[$this->fieldnames[0]], $fields[$this->fieldnames[1]]);
          elseif (preg_match('/x|y/i', implode('', $this->fieldnames)))
            return $this->parseAsec($fields[$this->fieldnames[0]], $fields[$this->fieldnames[1]]);
        }
      	break;
    }
    return '';
  }
  
  private function parseLonLat($lon, $lat) {
    return array('longitude' => $lon, 'latitude' => $lat);
  }
  
  private function parseWens($wens) {
    if (!$wens) return null;
    
    $lon = (int) substr($wens, 1, 2) * (strcasecmp(substr($wens,0,1), 'w') == 0 ? 1 : -1);
    $lat = (int) substr($wens, 3, 2) * (strcasecmp(substr($wens,2,1), 'n') == 0 ? 1 : -1);
    return $this->parseLonLat($lon, $lat);
  }
  
  private function parsePa($pa) {
    $lon = ($pa <= 180 ? 90 - $pa : $pa - 270);
    $lat = ($pa <= 180 ? 90 : -90);
    return $this->parseLonLat($lon, $lat);
  }
  
  private function parseAsec($x, $y) {
    // Workaround for db entries without position
    if (!$x && !$y) return null;

    $lon = $x / (self::SUN_ANGULAR_DIAMETER * 60) * 90;
    $lat = $y / (self::SUN_ANGULAR_DIAMETER * 60) * 90;
    return $this->parseLonLat($lon, $lat);
  }
}
?>
