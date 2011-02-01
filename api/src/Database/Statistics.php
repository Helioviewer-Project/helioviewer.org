<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Statistics Class definition
 *
 * PHP version 5
 *
 * @category Database
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * A simple module for recording query statistics
 *
 * @category Database
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Database_Statistics
{
    private $_dbConnection;

    /**
     * Creates an Statistics instance
     *
     * @return void
     */
    public function __construct()
    {
        include_once 'DbConnection.php';
        $this->_dbConnection = new Database_DbConnection();
    }
    
    /**
     * Adds a new entry to the statistics table
     * 
     * param $type string The action type associated with the query
     */
    public function log($type)
    {
    	$this->_dbConnection->query("INSERT INTO statistics VALUES (NULL, NULL, '$type');");
    	return true;
    }
    
    /**
     * Gets latest usage statistics and returns them as JSON
     */
    public function getUsageStatistics($options)
    {
        require_once 'src/Helper/DateTimeConversions.php';

        $defaults = array(
            "startDate" => "1970-01-01 00:00:00",
            "endDate"   => "9999-01-01 00:00:00"
        );
        
        $options = array_replace($defaults, $options);
        
        $options['startDate'] = isoDateToMySQL($options['startDate']);
        $options['endDate']   = isoDateToMySQL($options['endDate']);
        
        $sql = "SELECT action, COUNT(*) as count FROM statistics " . 
               "WHERE timestamp BETWEEN '{$options['startDate']}' AND '{$options['endDate']}' GROUP BY action;";
        
        $result = $this->_dbConnection->query($sql);
        
        $counts = array();

        while ($count = $result->fetch_array(MYSQL_ASSOC)) {
            array_push($counts, $count);
        }
        
        return json_encode($counts);
    }
}
?>
