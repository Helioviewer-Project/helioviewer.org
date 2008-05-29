<?php
class ImgIndex {
  private $dbConnection;

  //const SRC_IDENTIFYING_FIELDS = array('observatory', 'instrument', 'detector', 'measurement');

  public function __construct($dbConnection) {
    $this->dbConnection = $dbConnection;
  }

  public function getMap($fields) {
    $query = "SELECT map FROM maps WHERE";
    $i = 0;
    foreach($fields as $key => $value) {
      if ($i>0) $query .= " AND";
      $query .= " $key='$value'";
      $i++;
    }
    $query .= " ORDER BY timestamp";
    $result = $this->dbConnection->query($query);
    $row = mysql_fetch_array($result);
    return $row['map'];
  }

  public function getProperties($map) {
    $query = "SELECT * FROM maps WHERE map=$map";
    $result = $this->dbConnection->query($query);
    return mysql_fetch_array($result, MYSQL_ASSOC);
  }

  public function getClosestMap($timestamp, $src) {
    $query = "SELECT *, UNIX_TIMESTAMP(timestamp) - UNIX_TIMESTAMP('1970-01-01 00:00:00') AS timestamp,
                UNIX_TIMESTAMP(timestamp) - UNIX_TIMESTAMP('1970-01-01 00:00:00') - $timestamp AS timediff,
                ABS(UNIX_TIMESTAMP(timestamp) - UNIX_TIMESTAMP('1970-01-01 00:00:00') - $timestamp) AS timediffAbs 
              FROM maps WHERE";
    $i=0;
    foreach($src as $key => $value) {
      if ($i>0) $query .= " AND";
      $query .= " $key='$value'";
      $i++;
    }

    $query .= " ORDER BY timediffAbs LIMIT 0,1";
//echo "$query\n<br>";
    $result = $this->dbConnection->query($query);
    return mysql_fetch_array($result, MYSQL_ASSOC);
  }

  public function getDefaultMap() {
    $query = "SELECT map FROM maps WHERE instrument='EIT' ORDER BY timestamp DESC LIMIT 0,1";
    $result = $this->dbConnection->query($query);
    $row = mysql_fetch_array($result);
    return $row['map'];
  }
  // ToDo: Search function
}
?>
