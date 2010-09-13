<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Database connection helper
 *
 * PHP version 5
 *
 * @category Database
 * @package  Helioviewer
 * @author   Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Database connection helper class
 *
 * @category Database
 * @package  Helioviewer
 * @author   Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Database_DbConnection
{
    private $_host     = HV_DB_HOST;
    private $_dbname   = HV_DB_NAME;
    private $_user     = HV_DB_USER;
    private $_password = HV_DB_PASS;

    /**
     * Create a DbConnection instance
     *
     * @param string $dbname   [Optional] Database name
     * @param string $user     [Optional] Database user
     * @param string $password [Optional] Database password
     * @param string $host     [Optional] Database hostname
     *
     * @return void
     */
    public function __construct($dbname = null, $user = null, $password = null, $host = null)
    {
        if ($user) {
            $this->_user = $user;
        }
        if ($password) {
            $this->_password = $password;
        }
        if ($host) {
            $this->_host = $host;
        }
        if ($dbname) {
            $this->_dbname = $dbname;
        }
        $this->connect();
    }

    /**
     * Connects to database and sets timezone to UTC
     *
     * @return void
     */
    public function connect()
    {
        if (!$this->link = mysqli_connect($this->_host, $this->_user, $this->_password)) {
            //die('Error connecting to data base: ' . mysqli_error($this->link));
            throw new Exception("Database not configured properly. Please check the database configuration file to
            make sure that the information is correct.");
        }
        mysqli_select_db($this->link, $this->_dbname);
        mysqli_query($this->link, "SET @@session.time_zone = '+00:00'");
    }

    /**
     * Queries database
     *
     * @param string $query SQL query
     *
     * @return mixed Query result
     */
    public function query($query)
    {
        $result = mysqli_query($this->link, $query);
        if (!$result) {
            throw new Exception(sprintf("Error executing database query (%s): %s", $query), mysqli_error($this->link));
        }
        return $result;
    }
}
?>