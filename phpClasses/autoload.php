<?php
ini_set('display_errors', 'On');

function __autoload($class_name) {
  $prefix = 'phpClasses/';
  $dirs = array('lib', 'viewer', 'server');
  
  $classpath = '';
  foreach ($dirs as $dir) {
    $file = "$prefix$dir/$class_name.php";
    if (file_exists($file)) {
      if ($classpath) {
        die("Error: ambigous class name: $class_name ('$classpath', '$file')");
      } else {
        $classpath = $file;
      }
    }
  }
  
	if (!$classpath) throw new Exception("Class $class_name not found");  
  
  require_once $classpath;
}
?>