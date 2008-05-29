<?php
// ToDo: Change name
class DataLayout {
  private $newFields;
  private $hiddenFields;

  public function __construct($newFields = array(), $hiddenFields = array()) {
    $this->newFields = $newFields;
    $this->hiddenFields = $hiddenFields;
  }
  
  public function getField($fieldName, $fields) {
    if ($this->newFields[$fieldName])
      return $this->newFields[$fieldName]->getValue($fields);
    elseif ($fields[$fieldName])
      return $fields[$fieldName];
    else
      return '';    
  }
  
  public function getProperties($fields) {
    $properties = array();
    foreach ($fields as $fieldname => $value) {
      if (!in_array($fieldname, $this->hiddenFields)) $properties[$fieldname] = $value; 
    }
    return $properties;
  }


////////////////// static //////////////////

  private static $dataLayouts;
  
  private static function getLayouts() {
    if (!isset(self::$dataLayouts)) {
      self::$dataLayouts = array(
        'noaa' => new DataLayout(
          array(
            'label' => new FieldLayout('noaa', 'NOAA AR #?'),
            'position' => new PositionLayout(array('hlong', 'hlat'), PositionLayout::POS_MODE_LONLAT),
            'timestamp' => new DateLayout('date')
          ),
          array('day','noaa','hlong','hlat')
        ),
        'cmelist' => new DataLayout(
          array(
            'label' => new FieldLayout('entry', 'CME list #?'),
            'position' => new PositionLayout('centralpa', PositionLayout::POS_MODE_PA),
            'timestamp' => new DateLayout('date')
          ),
          array('matched','entry')
        ),
        'goes' => new DataLayout(
          array(
            'label' => new FieldLayout('entry', 'GOES #?'),
            'position' => new PositionLayout('pos', PositionLayout::POS_MODE_WENS),
            'timestamp' => new DateLayout('maxf')
          ),
          array('start','end','maxf','valid')
        ),
        'rhessi' => new DataLayout(
          array(
            'label' => new FieldLayout('flareno', 'RHESSI flare #?'),
            'position' => new PositionLayout(array('xpos', 'ypos'), PositionLayout::POS_MODE_ASEC),
            'timestamp' => new DateLayout('peak')
          ),
          array('valid')
        )
      );
    }
    return self::$dataLayouts;
  }
  
  public static function getInstance($catalog) {
    $layouts = self::getLayouts();
    return $layouts[$catalog];
  }
  
  public static function getCatalogs() {
    $layouts = self::getLayouts();
    return array_keys($layouts);
  }
}
?>
