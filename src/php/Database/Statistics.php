<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Statistics Class definition
 * A simple module for recording query statistics
 *
 * @category Database
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     https://github.com/Helioviewer-Project
 */

class Database_Statistics {

    private $_dbConnection;

    /**
     * Constructor
     *
     * @return void
     */
    public function __construct() {
        include_once HV_ROOT_DIR.'/src/php/Database/DbConnection.php';
        $this->_dbConnection = new Database_DbConnection();
    }

    /**
     * Add a new entry to the `statistics` table
     *
     * param $action string The API action to log
     *
     * @return boolean
     */
    public function log($action) {
        $sql = sprintf(
                  "INSERT INTO statistics "
                . "SET "
                .     "id "        . " = NULL, "
                .     "timestamp " . " = NULL, "
                .     "action "    . " = '%s';",
                $this->_dbConnection->link->real_escape_string($action)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return true;
    }

    /**
     * Get latest usage statistics as JSON
     *
     * @param  string  Time resolution
     *
     * @return str  JSON
     */
    public function getUsageStatistics($resolution) {
        require_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        // Determine time intervals to query
        $interval = $this->_getQueryIntervals($resolution);

        // Array to keep track of counts for each action
        $counts = array(
            "buildMovie"           => array(),
            "getClosestData"       => array(),
            "getClosestImage"      => array(),
            "getJPX"               => array(),
            "takeScreenshot"       => array(),
            "uploadMovieToYouTube" => array(),
            "embed"                => array()
        );

        // Summary array
        $summary = array(
            "buildMovie"           => 0,
            "getClosestData"       => 0,
            "getClosestImage"      => 0,
            "getJPX"               => 0,
            "takeScreenshot"       => 0,
            "uploadMovieToYouTube" => 0,
            "embed"                => 0
        );

        // Format to use for displaying dates
        $dateFormat = $this->_getDateFormat($resolution);

        // Start date
        $date = $interval['startDate'];

        // Query each time interval
        for ($i = 0; $i < $interval["numSteps"]; $i++) {

            // Format date for array index
            $dateIndex = $date->format($dateFormat);

            // MySQL-formatted date string
            $dateStart = toMySQLDateString($date);

            // Move to end date for the current interval
            $date->add($interval['timestep']);

            // Fill with zeros to begin with
            foreach ($counts as $action => $arr) {
                array_push($counts[$action], array($dateIndex => 0));
            }
            $dateEnd = toMySQLDateString($date);

            $sql = sprintf(
                      "SELECT action, COUNT(id) AS count "
                    . "FROM statistics "
                    . "WHERE "
                    .     "timestamp BETWEEN '%s' AND '%s' "
                    . "GROUP BY action;",
                    $this->_dbConnection->link->real_escape_string($dateStart),
                    $this->_dbConnection->link->real_escape_string($dateEnd)
                   );
            try {
                $result = $this->_dbConnection->query($sql);
            }
            catch (Exception $e) {
                return false;
            }

            // Append counts for each API action during that interval
            // to the appropriate array
            while ($count = $result->fetch_array(MYSQLI_ASSOC)) {
                $num = (int)$count['count'];

                $counts[$count['action']][$i][$dateIndex] = $num;
                $summary[$count['action']] += $num;
            }
        }

        // Include summary info
        $counts['summary'] = $summary;

        return json_encode($counts);
    }

    /**
     * Return date format string for the specified time resolution
     *
     * @param  string  $resolution  Time resolution string
     *
     * @return string  Date format string
     */
    public function getDataCoverageTimeline($resolution, $endDate, $interval,
        $stepSize, $steps) {

        require_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $sql = 'SELECT id, name, description FROM datasources ORDER BY description';
        $result = $this->_dbConnection->query($sql);

        $output = array();

        while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
            $sourceId = $row['id'];

            $output['sourceId'.$sourceId] = new stdClass;
            $output['sourceId'.$sourceId]->sourceId = $sourceId;
            $output['sourceId'.$sourceId]->label = $row['description'];
            $output['sourceId'.$sourceId]->data = array();
        }

        // Format to use for displaying dates
        switch($resolution) {
        case "5m":
        case "15m":
        case "30m":
            $dateFormat = "Y-m-d H:i";
            break;
        case "1h":
            $dateFormat = "Y-m-d H:i";
            break;
        case "1D":
            $dateFormat = "Y-m-d";
            break;
        case "14D":
        case "1W":
            $dateFormat = "Y-m-d";
            break;
        case "30D":
        case "1M":
        case "3M":
        case "6M":
            $dateFormat = "M Y";
            break;
        case "1Y":
            $dateFormat = "Y";
            break;
        default:
            $dateFormat = "Y-m-d H:i e";
        }


        // Start date
        $date = $endDate->sub($interval);

        // Query each time interval
        for ($i = 0; $i < $steps; $i++) {
            $dateIndex = $date->format($dateFormat); // Format date for array index
            $dateStart = toMySQLDateString($date);   // MySQL-formatted date string

            // Move to end date for the current interval
            $date->add($stepSize);

            // Fill with zeros to begin with
            foreach ($output as $sourceId => $arr) {
                array_push($output[$sourceId]->data, array($dateIndex => 0));
            }
            $dateEnd = toMySQLDateString($date);

            $sql = "SELECT sourceId, SUM(count) as count FROM data_coverage_30_min " .
                   "WHERE date BETWEEN '$dateStart' AND '$dateEnd' GROUP BY sourceId;";
            //echo "\n<br />";

            $result = $this->_dbConnection->query($sql);

            // And append counts for each sourceId during that interval to the relevant array
            while ($count = $result->fetch_array(MYSQLI_ASSOC)) {
                $num = (int) $count['count'];
                $output['sourceId'.$count['sourceId']]->data[$i][$dateIndex] = $num;
            }
        }

        return json_encode($output);
    }

    /**
     * Gets latest datasource coverage and return as JSON
     */
    public function getDataCoverage($resolution, $endDate, $interval,
        $stepSize, $steps) {

        require_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $sql = 'SELECT id, name, description FROM datasources ORDER BY description';
        $result = $this->_dbConnection->query($sql);

        $output = array();

        while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
            $sourceId = $row['id'];

            $output['sourceId'.$sourceId] = new stdClass;
            $output['sourceId'.$sourceId]->sourceId = $sourceId;
            $output['sourceId'.$sourceId]->label = $row['description'];
            $output['sourceId'.$sourceId]->data = array();
        }

        // Format to use for displaying dates
        switch($resolution) {
        case "5m":
        case "15m":
        case "30m":
            $dateFormat = "Y-m-d H:i";
            break;
        case "1h":
            $dateFormat = "Y-m-d H:i";
            break;
        case "1D":
            $dateFormat = "Y-m-d";
            break;
        case "14D":
        case "1W":
            $dateFormat = "Y-m-d";
            break;
        case "30D":
        case "1M":
        case "3M":
        case "6M":
            $dateFormat = "M Y";
            break;
        case "1Y":
            $dateFormat = "Y";
            break;
        default:
            $dateFormat = "Y-m-d H:i e";
        }


        // Start date
        $date = $endDate->sub($interval);

        // Query each time interval
        for ($i = 0; $i < $steps; $i++) {
            $dateIndex = $date->format($dateFormat); // Format date for array index
            $dateStart = toMySQLDateString($date);   // MySQL-formatted date string

            // Move to end date for the current interval
            $date->add($stepSize);

            // Fill with zeros to begin with
            foreach ($output as $sourceId => $arr) {
                array_push($output[$sourceId]->data, array($dateIndex => 0));
            }
            $dateEnd = toMySQLDateString($date);

            $sql = "SELECT sourceId, SUM(count) as count FROM data_coverage_30_min " .
                   "WHERE date BETWEEN '$dateStart' AND '$dateEnd' GROUP BY sourceId;";
            //echo "\n<br />";

            $result = $this->_dbConnection->query($sql);

            // And append counts for each sourceId during that interval to the relevant array
            while ($count = $result->fetch_array(MYSQLI_ASSOC)) {
                $num = (int) $count['count'];
                $output['sourceId'.$count['sourceId']]->data[$i][$dateIndex] = $num;
            }
        }

        return json_encode($output);
    }

    /**
     * Update data source coverage data for the last 7 Days
     * (or specified time period).
     */
    public function updateDataCoverage($period=null) {

        if ( gettype($period) == 'string' &&
             preg_match('/^([0-9]+)([mhDMY])$/', $period, $matches) === 1 ) {

            $magnitude   = $matches[1];
            $period_abbr = $matches[2];
        }
        else {
            $magnitude   =  7;
            $period_abbr = 'D';
        }

        switch ($period_abbr) {
        case 'm':
            $interval = 'INTERVAL '.$magnitude.' MINUTE';
            break;
        case 'h':
            $interval = 'INTERVAL '.$magnitude.' HOUR';
            break;
        case 'D':
            $interval = 'INTERVAL '.$magnitude.' DAY';
            break;
        case 'M':
            $interval = 'INTERVAL '.$magnitude.' MONTH';
            break;
        case 'Y':
            $interval = 'INTERVAL '.$magnitude.' YEAR';
            break;
        default:
            $interval = 'INTERVAL 7 DAY';
        }

        $sql = 'REPLACE INTO ' .
                    'data_coverage_30_min ' .
                '(date, sourceId, count) ' .
                'SELECT ' .
                    'SQL_BIG_RESULT SQL_BUFFER_RESULT SQL_NO_CACHE ' .
                    'CONCAT( ' .
                        'DATE_FORMAT(date, "%Y-%m-%d %H:"), '    .
                        'LPAD((MINUTE(date) DIV 30)*30, 2, "0"), ' .
                        '":00") AS "bin", ' .
                    'sourceId, ' .
                    'COUNT(id) ' .
                'FROM ' .
                    'data ' .
                'WHERE ' .
                    'date >= DATE_SUB(NOW(),'.$interval.') ' .
                'GROUP BY ' .
                    'bin, ' .
                    'sourceId;';
        $result = $this->_dbConnection->query($sql);


        $output = array(
            'result'     => $result,
            'interval'     => $interval
        );

        return json_encode($output);
    }

    /**
     * Determines date format to use for the x-axis of the requested resolution
     */
    private function _getDateFormat($resolution) {
        switch ($resolution) {
            case "hourly":
                return "ga";  // 4pm
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
                return "Y";   // 2009
                break;
        }
    }

    /**
     * Determine time inveral specification for statistics query
     *
     * @param  string  $resolution  Time resolution string
     *
     * @return array   Array specifying a time interval
     */
    private function _getQueryIntervals($resolution) {

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
            $numSteps = 28;

            $date->add($timestep);

            // Subtract 4 weeks
            $date->sub(new DateInterval("P4W"));
        }

        // Weekly
        else if ($resolution == "weekly") {
            $timestep = new DateInterval("P1W");
            $numSteps = 26;

            $date->add(new DateInterval("P1D"));

            // Subtract 25 weeks
            $date->sub(new DateInterval("P25W"));
        }

        // Monthly
        else if ($resolution == "monthly") {
            $timestep = new DateInterval("P1M");
            $numSteps = 24;

            $date->modify('first day of next month');
            $date->sub(new DateInterval("P24M"));
        }

        // Yearly
        else if ($resolution == "yearly") {
            $timestep = new DateInterval("P1Y");
            $numSteps = 8;

            $year = (int) $date->format("Y");
            $date->setDate($year - $numSteps + 1, 1, 1);
        }

        // Array to store time intervals
        $intervals = array(
            "startDate" => $date,
            "timestep"  => $timestep,
            "numSteps"  => $numSteps
        );

        return $intervals;
    }
}
?>
