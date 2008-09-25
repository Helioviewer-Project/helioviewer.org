<?php
  class DbConnection {
    private $user = "helioviewer";
    private $password = "helioviewer";
    private $host = "localhost";
    private $db = "hv2";

    public function __construct($user = null, $password = null, $host = null, $db = null) {
      if ($user) $this->user = $user;
      if ($password) $this->password = $password;
      if ($host) $this->host = $host;
      if ($db) $this->db = $db;
      $this->connect();
    }

    public function connect() {
      if (!mysql_pconnect($this->host, $this->user, $this->password))
        die('Error connecting to data base: ' . mysql_error());
      mysql_select_db($this->db);
    }

    public function query($query) {
      $result = mysql_query($query);
      if (!$result)	die("Error executing query:<br>\n$query <br>\n " . mysql_error());
      return $result;
    }
  }
?>
