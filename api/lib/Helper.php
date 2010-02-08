<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Helper Class
 */
/**
 * Helioviewer Helper Class
 * 
 * This file defines a class which includes various helper methods
 * for dealing with things like time conversions, type-casting, and
 * validation.
 * 
 * PHP version 5
 * 
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Helper
{
    /**
     * Validates and type-casts API Request parameters
     *
     * @param array &$expected Types of checks required for request
     * @param array &$input    Actual request parameters
     * 
     * @return void
     */
    public static function checkInput(&$expected, &$input)
    {
        // Validation checks
        $checks = array(
            "required" => "checkForMissingParams",
            "ints"     => "checkInts",
            "floats"   => "checkFloats",
            "bools"    => "checkBools",  
            "dates"    => "checkDates", 
            "urls"     => "checkURLs"
        );
        
        // Run validation checks
        foreach ($checks as $name => $method) {
            if (isset($expected[$name])) {
                Helper::$method($expected[$name], $input);
            }
        }
    }
    
    /**
     * Checks to make sure all required parameters were passed in.
     * 
     * @param array $required A list of the required parameters for a given action
     * @param array &$params  The parameters that were passed in
     * 
     * @return void
     */
    public static function checkForMissingParams($required, &$params)
    {
        foreach ($required as $req) {
            if (!isset($params[$req])) {
                throw new Exception("No value set for required parameter \"$req\".");
            }
        }
    }

    /**
     * Typecasts boolean strings or unset optional params to booleans
     * 
     * @param array $bools   A list of boolean parameters which are used by an action.
     * @param array &$params The parameters that were passed in
     * 
     * @return void
     */
    public static function checkBools($bools, &$params)
    {
        foreach ($bools as $bool) {
            if (isset($params[$bool]) && (strtolower($params[$bool]) === "true")) {
                $params[$bool] = true;
            } else {
                $params[$bool] = false;
            }
        }
    }
    
    /**
     * Typecasts validates and fixes types for integer parameters
     * 
     * @param array $ints    A list of integer parameters which are used by an action.
     * @param array &$params The parameters that were passed in
     * 
     * @return void
     */    
    public static function checkInts($ints, &$params)
    {
        foreach ($ints as $int) {
            if (isset($params[$int])) {
                if (filter_var($params[$int], FILTER_VALIDATE_INT) === false) {
                    throw new Exception("Invalid value for $int. Please specify an integer value.");                    
                } else {
                    $params[$int] = (int) $params[$int];
                }
            }
        }
    }
    
    /**
     * Typecasts validates and fixes types for float parameters
     * 
     * @param array $floats  A list of float parameters which are used by an action.
     * @param array &$params The parameters that were passed in
     * 
     * @return void
     */    
    public static function checkFloats($floats, &$params)
    {
        foreach ($floats as $float) {
            if (isset($params[$float])) {
                if (filter_var($params[$float], FILTER_VALIDATE_FLOAT) === false) {
                    throw new Exception("Invalid value for $float. Please specify an float value.");                    
                } else {
                    $params[$float] = (float) $params[$float];
                }
            }
        }
    }
    
    /**
     * Typecasts validates URL parameters
     * 
     * @param array $urls    A list of URLs which are used by an action.
     * @param array &$params The parameters that were passed in
     * 
     * @return void
     */    
    public static function checkURLs($urls, &$params)
    {
        foreach ($urls as $url) {
            if (isset($params[$url])) {
                if (!filter_var($params[$url], FILTER_VALIDATE_URL)) {
                    throw new Exception("Invalid value for $url. Please specify an URL.");                    
                }
            }
        }
    }
    
    /**
     * Checks an array of UTC dates
     * 
     * @param array $dates   dates to check
     * @param array &$params The parameters that were passed in
     * 
     * @return void
     */
    public static function checkDates($dates, &$params)
    {
        foreach ($dates as $date) {
            Helper::checkUTCDate($params[$date]);
        }
    }
    
    /**
     * Checks to see if a string is a valid ISO 8601 UTC date string of the form
     * "2003-10-05T00:00:00.000Z" (milliseconds and ending "Z" are optional).
     *
     * @param string $date A datestring
     * 
     * @return void 
     */
    public static function checkUTCDate($date)
    {
        if (!preg_match("/^\d{4}[\/-]\d{2}[\/-]\d{2}T\d{2}:\d{2}:\d{2}.\d{0,3}Z?$/i", $date)) {
            throw new Exception("Invalid date string. Please enter a date of the form 2003-10-06T00:00:00.000Z");
        }     
    }
        
    /**
     * Display an error message to the API user
     * 
     * @param string $msg Error message to display to the user
     * 
     * @return void
     */
    public static function printErrorMsg($msg)
    {
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Helioviewer.org API - Error</title>
</head>
<body>
    <div style='width: 50%; margin-left: auto; margin-right: auto; margin-top: 250px;
                text-align: center; font-size: 14px;'>
    <img src='images/about.png' alt='Helioviewer logo'></img><br>
    <b>Error:</b> <?php echo $msg;?><br>
    </div>
</body>
</html>
    <?php
    exit();
    }
}

/**
 * Converts an ISO 8601 UTC date string into a unix timestep
 * 
 * @param string $dateStr ISO 8601 Date string, e.g. "2003-10-05T00:00:00Z"
 * 
 * @return int Number of seconds since Jan 1, 1970 UTC
 */
function toUnixTimestamp($dateStr)
{
    date_default_timezone_set('UTC');
    return strtotime($dateStr);
}

/**
 * Converts a unix timestamp to a PHP DateTime instance
 * 
 * @param int $timestamp The number of seconds since Jan 1, 1970 UTC
 * 
 * @see http://us2.php.net/manual/en/function.date-create.php
 * 
 * @return DateTime A PHP DateTime object
 */
function parseUnixTimestamp($timestamp)
{
    date_default_timezone_set('UTC');
    return new DateTime("@$timestamp");
}

/**
 * Outputs a date string formatted for use in MySQL queries
 * 
 * @param DateTime $date A PHP DateTime object
 * 
 * @return string Returns a date formatted for MySQL queries (2003-10-05 00:00:00)
 */
function toMySQLDateString($date)
{
    return $date->format("Y-m-d H:i:s");
}

/**
 * Parses an ISO 8601 date string with one formatted for MySQL 
 *
 * @param string $dateStr A ISO 8601 date string
 * 
 * @return string Returns a date formatted for MySQL queries (2003-10-05 00:00:00)
 */
function isoDateToMySQL($dateStr)
{
    return str_replace("Z", "", str_replace("T", " ", $dateStr));
}

/**
 * Takes a PHP DateTime object and returns an UTC date string
 * 
 * Similar to:
 *     echo $date->format(DATE_ISO8601);
 * 
 * @param DateTime $date A PHP DateTime object
 * 
 * @return string An ISO 8601 Date string (2003-10-05T00:00:00Z)
 */
function toISOString($date)
{
    return $date->format("Y-m-d\TH:i:s\Z");
}
?>