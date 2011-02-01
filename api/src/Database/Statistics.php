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
    public function getUsageStatistics($resolution)
    {
        require_once 'src/Helper/DateTimeConversions.php';
        
        // Determine time intervals to query
        $interval = $this->_getQueryIntervals($resolution);
        
        // Array to keep track of counts for each action
        $counts = array(
            "buildMovie"           => array(),
            "getJPX"               => array(),
            "takeScreenshot"       => array(),
            "uploadMovieToYouTube" => array()
        );
        
        // Format to use for displaying dates
        $dateFormat = $this->_getDateFormat($resolution);
        
        // Start date
        $date = $interval['startDate'];

        // Query each time interval
        for ($i = 0; $i < $interval["numSteps"]; $i++) {
            $dateIndex = $date->format($dateFormat); // Format date for array index
            $dateStart = toMySQLDateString($date);   // MySQL-formatted date string

            // Move to end date for the current interval
            $date->add($interval['timestep']);
            
            // Fill with zeros to begin with
            foreach ($counts as $action => $arr) {
                array_push($counts[$action], array($dateIndex => 0));
            }

            $dateEnd = toMySQLDateString($date);

            $sql = "SELECT action, COUNT(*) as count FROM statistics " . 
                   "WHERE timestamp BETWEEN '$dateStart' AND '$dateEnd' GROUP BY action;";
            
            $result = $this->_dbConnection->query($sql);
            
            // And append counts for each action during that interval to the relevant array
            while ($count = $result->fetch_array(MYSQL_ASSOC)) {
                $counts[$count['action']][$i][$dateIndex] = (int) $count['count'];
            }
        }
        return json_encode($counts);
    }
    
    /**
     * Determines date format to use for the x-axis of the requested resolution
     */
    private function _getDateFormat($resolution)
    {
        switch($resolution) {
            case "hourly":
                return "ga"; // 4pm
                break;
            case "daily":
                return "D";   // Tues
                break;
            case "weekly":
                return "M j"; // Feb 3
                break;
            case "monthly":
                return "M y"; // Feb 09
                break;
            case "yearly":
                return "Y";    // 2009
                
        }
    }
    
    /**
     * Determines time inverals to collect statistics for
     */
    private function _getQueryIntervals($resolution)
    {
        date_default_timezone_set('UTC');
        
        // Variables
        $date     = new DateTime();
        $timestep = null;
        $numSteps = null;
        
        // For hourly resolution, keep the hours value, otherwise set to zero
        $hour = ($resolution == "hourly") ? (int) $date->format("H") : 0;
        
        // Round end time to nearest hour or day to begin with (may round other units later)            
        $date->setTime($hour, 0, 0);
        
        // Hourly
        if ($resolution == "hourly") {
            $timestep = new DateInterval("PT1H");
            $numSteps = 24;

            $date->add($timestep);
            
            // Subtract 24 hours
            $date->sub(new DateInterval("P1D"));
        }
        
        // Daily
        else if ($resolution == "daily") {
            $timestep = new DateInterval("P1D");
            $numSteps = 14;
  
            $date->add($timestep);
            
            // Subtract 2 weeks
            $date->sub(new DateInterval("P2W"));
        }
        
        // Weekly
        else if ($resolution == "weekly") {
            $timestep = new DateInterval("P1W");
            $numSteps = 12;

            $date->add(new DateInterval("P1D"));
            
            // Subtract 2 weeks
            $date->sub(new DateInterval("P12W"));
        }
        
        // Monthly
        else if ($resolution == "monthly") {
            $timestep = new DateInterval("P1M");
            $numSteps = 12;
            
            $date->modify('first day of next month'); // Yay PHP 5.3
            $date->sub(new DateInterval("P12M"));
        }
        
        // Yearly
        else if ($resolution == "yearly") {
            $timestep = new DateInterval("P1Y");
            $numSteps = 3;
            
            $year = (int) $date->format("Y");
            $date->setDate($year - $numSteps + 1, 1, 1);
        }

        // Array to store time intervals
        $intervals = array(
            "startDate" => $date,
            "timestep"  => $timestep,
            "numSteps"  => $numSteps
        );
//        $intervals = array();

//        for ($i=0; $i < $numSteps; $i++) {
//            $startDate = $date;
//            $date->add($timestep);
//            $endDate   = $date;
//            
//            array_push($intervals, array("start" => $startDate, "end" => $endDate));
//        }
        
        return $intervals;
    }
}
?>
