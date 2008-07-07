<?php
  /* Example usage:
   *    php file2sql.php /path/to/tiles
   */ 
  set_time_limit(0);
  ini_set('display_errors', 'On');
  
  $GLOBALS['limit'] = 0;
  $GLOBALS['count'] = 0;
  $GLOBALS['cwd'] = str_replace('\\', '/', getcwd());
    $GLOBALS['tables'] = array();
    $GLOBALS['tiles'] = array();
  
  $dir = ($_GET['dir'] ? $_GET['dir'] : $_SERVER['argv'][1]);
  
  if (!mysql_connect('localhost', 'helioviewer', 'helioviewer')) die ("error connecting to db");
  mysql_select_db('esahelio_svdb0');
  
  //header("Content-type: text/plain");
  parseDir($dir);
  populateDb();

//print_r($GLOBALS['observatory']);

  echo "Insertion successful\n";

  function parseDir($dir) {
    echo "Parsing $dir\n";
    $GLOBALS['count']++;
    if ($GLOBALS['count'] == $GLOBALS['limit']) exit;
    $hd = opendir($dir);
    $imgs = array();
    while ($entry = readdir($hd)) {
      if ($entry == '.' || $entry == '..') continue;
      if (is_dir("$dir/$entry")) parseDir("$dir/$entry");
      elseif (substr($entry, -4) == '.jpg' || substr($entry, -4) == '.png') {
        $tiles[] = "$dir/$entry";
        //echo "Found tile: $dir/$entry\n";
      }
    }
    closedir($hd);
    
    $num = count($tiles);
    if ($num > 0) {
        sort($tiles);
      $pathinfo = pathinfo($tiles[0]);
      $filename = $pathinfo['basename'];
      $extension = $pathinfo['extension'];
      $map = substr($filename, 0, 34);
      list($year, $month, $day, $time, $observatory, $instrument, $detector, $measurement) =
        explode('_', $map);
      $hour = substr($time, 0, 2);
      $min = substr($time, 2, 2);
      $sec = substr($time, 4, 2);
      
       //$ratio = (float) substr($filename, 47, 7);

        
      //Note: MySQL stores dates using the server's local timezone, but outputs UNIX_TIMESTAMP() in GMT time. Rather than requiring the
      //      server switch to using UTC to store dates by default, which is not entirely straight-forward, it is easier to pass it a
      //      local date, so that when UNIX_TIMESTAMP() is called, the returned timestamp is the actual UTC time.
      $ts = convertToLocalDate("$year-$month-$day $hour:$min:$sec");
      
      //echo "original date: " . "$year-$month-$day $hour:$min:$sec\n";
      //echo "offseted date: $ts\n";
      
      $GLOBALS['observatory'][$observatory]['abbreviation'] = $observatory;
      $GLOBALS['observatory'][$observatory]['instrument'][$instrument]['abbreviation'] = $instrument;
      $GLOBALS['observatory'][$observatory]['instrument'][$instrument]['detector'][$detector]['abbreviation'] = $detector;
      //$GLOBALS['observatory'][$observatory]['instrument'][$instrument]['detector'][$detector]['sunImgRatio'] = $ratio;
      // ToDo: Determine lowestRegularZoomLevel (lowest zoom level that still has the same image/sun diameter ratio as higher levels. The ratio decreases by the factor 2 for lower zoom levels)
      $GLOBALS['observatory'][$observatory]['instrument'][$instrument]['detector'][$detector]['measurement'][$measurement]['abbreviation'] = $measurement;
      $GLOBALS['observatory'][$observatory]['instrument'][$instrument]['detector'][$detector]['measurement'][$measurement]['image'][] = array('timestamp' => $ts, 'measurement' => $measurement, 'filetype' => $extension, 'tiles' => $tiles);
      


/*
      $GLOBALS['tables']['observatory'][$observatory] = array('abbreviation' => $observatory);
      $GLOBALS['tables']['instrument'][] = array('abbreviation' => $instrument, 'observatory' => $observatory);
      $GLOBALS['tables']['detector'][] = array('abbreviation' => $detector, 'instrument' => $instrument);
      $GLOBALS['tables']['measurement'][] = array('abbreviation' => $measurement, 'detector' => $detector);
      $GLOBALS['tables']['image'][] = array('timestamp' => "$year-$month-$day $hour:$min:$sec", 'measurement' => $measurement);
*/     
        //$GLOBALS['tiles'][$map] = $tiles;
        
/*
      echo "Adding image $map...\n";

      $query = sprintf("INSERT IGNORE INTO maps VALUES ('%s',
                        '%s',
                        %d, %d, %d, %d, %d, %d, 
                        '%s', '%s', '%s', '%s', '%s')",
        mysql_real_escape_string($map),
        "$year-$month-$day $hour:$min:$sec",
        $year, $month, $day, $hour, $min, $sec,
        $observatory, $instrument, $detector, $measurement, $extension
      );
      $result = mysql_query($query);
      if (!$result) {
        echo "$query - failed\n";
        die (mysql_error());
      }
*/
//      if (mysql_affected_rows() > 0) {
//        echo "Adding tiles in $dir: ";

//      }
    }

    unset($tiles);
  }

    function populateDb() {
        parseLevels($GLOBALS['observatory'], 'observatory');
    }
  
  function parseLevels($level, $table, $parentTable = null, $parentId = null) {
    foreach($level as $key => $entry) {
//print_r($entry);
            $subelements = null;
            $fields = array();
            $tiles = false;
            foreach ($entry as $name => $value) {
                if ($name == 'tiles') {
                    $tiles = $value;
                } elseif (is_array($value)) {
                    $subelements = $value;
                } else {
                    $fields[$name] = $value;
                }
        }

            if ($parentTable) $fields[$parentTable] = $parentId;
            // insert fields into table
            // get and save the id
            $fields['id'] = getIdOrInsert($table, $fields, $parentTable, $parentId);

            if ($tiles) addTiles($tiles, $fields['id']);
            //if ($parentTable) { 
                //echo "$table($fields[id]) -> $parentTable($parentId)\n";
            //}
            if ($subelements) parseLevels($subelements, $name, $table, $fields['id']);
        }
  }
  
  
  function getIdOrInsert($table, $fields, $parentTable = null, $parentId = null) {
//echo "parentField: ${parentTable}Id ($parentId)\n";
    // Check if row exists
    $query = "SELECT id FROM $table WHERE";
    $and = false;
    foreach ($fields as $field => $value) {
        if ($and)   $query .= " AND";
      else      $and = true;
        
      if ($field == $parentTable) $query .= " ${parentTable}Id=$parentId";
      else                                              $query .= " $field='$value'";
    }
    $result = mysql_query($query);
        //echo "$query\n";
    
    if (mysql_num_rows($result) > 0) {
        // row exists
        $row = mysql_fetch_array($result);
        return $row['id'];
    } else {
        // row doesn't exist
        $query = "INSERT INTO $table (";
        if ($fields['abbreviation']) {
            $comma = true;
            $query .= 'name';
        } else {
            $comma = false;
        }
            foreach ($fields as $field => $value) {
                if ($comma) $query .= ", ";
                else          $comma = true;
                
                if ($field == $parentTable) $query .= "${parentTable}Id";
                else                                                $query .= "$field";
            }

        $query .= ") VALUES (";
        if ($fields['abbreviation']) {
            $comma = true;
            $query .= "'$fields[abbreviation]'";
        } else {
            $comma = false;
        }
            foreach ($fields as $field => $value) {
                if ($comma) $query .= ", ";
                else          $comma = true;

                if ($field == $parentTable) $query .= $parentId;
                else                                                $query .= "'$value'";
            }
        $query .= ")";
        //echo "$query\n";
        //return  'TBD';
        $result = mysql_query($query);
        return mysql_insert_id();
    }
  }

    function addTiles($tiles, $imageId) {
        $c = 0;
        $res = 5;
        $next = $res;
        $num = count($tiles);

        foreach($tiles as $filepath) {
            addTile($filepath, $imageId);
            $p = (int)($c / $num * 100);
            if ($p >= $next) {
                echo "$p% ";
                $next += $res;
            }
            $c++;
        }

        echo "100%\n";  
    }

  function addTile($filepath, $imageId) {
  //global $ratio;
    $pathinfo = pathinfo($filepath);
    $filename = $pathinfo['basename'];
    $filetype = $pathinfo['extension'];
    $map = substr($filename, 0, 34);
    $zoom = substr($filename, 35, 2);
    $x = substr($filename, 38, 2);
    $y = substr($filename, 41, 2);
    //if ($x == 0 && $y == 0) {
    //  $ratio = (float) substr($filename, 47, 7);
    //}
    //echo "Adding tile: $filename\n";
    //echo "$zoom, $x, $y, $ratio\n";
    $query = sprintf("INSERT IGNORE INTO tile (imageId, x, y, zoom, tile) VALUES ($imageId, $x, $y, $zoom, '%s')", mysql_real_escape_string(file_get_contents($filepath)));
    $result = mysql_query($query);
    if (!$result) {
      echo "$query - failed\n";
      die (mysql_error());
    }
  }
  
 function convertToLocalDate ($timestamp) {
      $time = date_create($timestamp);
      $offset = date_offset_get($time);
      $time->modify($offset . " seconds");
      return $time->format('Y-m-d H:i:s');
  }
?>

