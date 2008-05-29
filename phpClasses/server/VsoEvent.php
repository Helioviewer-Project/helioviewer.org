<?php
class VsoEvent extends Event {
  const URL_PREFIX = 'http://virtualsolar.org/test/catalog/';

  public function __construct($catalog, $fields) {
    $dataLayout = DataLayout::getInstance($catalog);
    $timestamp = $dataLayout->getField('timestamp', $fields);
    $label = $dataLayout->getField('label', $fields);
    $position = $dataLayout->getField('position', $fields);
    $properties = $dataLayout->getProperties($fields);
    parent::__construct($label, $timestamp, $position, $properties);
  }
  
  public function isDisplayable() {
    return ($this->timestamp && $this->position);
  }
  
  public static function getEvents($srcs, $dates, $showNonDisplayable = false) {
    $comps = array('gte', 'lte');
    $results = array();
    
    foreach($srcs as $s) {
      $requestUrl = self::URL_PREFIX . "$s?";
      
      for($i=0;$i<=1;$i++) {
        $f = "filter[$i]";
        $c = $comps[$i];
        $d = date('m/d/Y', $dates[$i]);
        $requestUrl .= "${f}[field]=date&${f}[data][type]=date&${f}[data][comparison]=$c&${f}[data][value]=$d";
        if ($i == 0) $requestUrl .= '&'; 
      }
    
    //echo "$requestUrl\n";
      $request = new HTTPRequest($requestUrl);
      $json = $request->DownloadToString();
    //echo $json;
      $response = json_decode(trim($json,'()'));
    //phpinfo();
    //print_r($response->results);
    
      foreach ($response->results as $fields) {
        $vsoEvent = new VsoEvent($s, get_object_vars($fields));
        if ($vsoEvent->isDisplayable() || $showNonDisplayable) $results[$s][] = $vsoEvent; 
      }
    }
    
    return $results;
  }
}
?>
