<?php

error_reporting(E_ALL | E_STRICT | E_NOTICE);
require_once("interface.Module.php");

class Helper
{
    /**
     * @description Checks to make sure all required parameters were passed in.
     * @param {Array} $fields is an array containing any required fields, such as 'layers', 'zoomLevel', etc.
     * @return 1 on success
     */
    public static function checkForMissingParams($fields, $params) {
        try {
            foreach($fields as $field) {
                if(!isset($params[$field])) {
                    throw new Exception("Invalid value for $field.");
                }
            }
        }
        catch (Exception $e) {
            echo 'Error: ' . $e->getMessage();
            exit();
        }
        return 1;
    }

    /**
     * Typecast boolean strings or unset optional params to booleans
     *
     */
    public static function fixBools($fields, $params) {
        foreach($fields as $field) {
            if (!isset($params[$field]))
            $params[$field] = false;
            else {
                if (strtolower($params[$field]) === "true")
                $params[$field] = true;
                else
                $params[$field] = false;
            }
        }
        
        return $params;
    }

}

/**
 * @return int Number of seconds since Jan 1, 1970 UTC
 * @param string $datestr ISO 8601 Date string, e.g. "2003-10-05T00:00:00Z"
 */
function toUnixTimestamp($dateStr) {
    date_default_timezone_set('UTC');
    return strtotime($dateStr);
}

/**
 * @return DateTime A PHP DateTime object
 * @param int $timestamp The number of seconds since Jan 1, 1970 UTC
 */
function parseUnixTimestamp($timestamp) {
    date_default_timezone_set('UTC');
    return new DateTime("@$timestamp");
}

/**
 * @return string Returns a date formatted for MySQL queries (2003-10-05 00:00:00)
 * @param DateTime $date
 */
function toMySQLDateString($date) {
    return $date->format("Y-m-d H:i:s");
}

/**
 * Parses an ISO 8601 date string with one formatted for MySQL
 * @return string
 * @param object $dateStr
 */
function isoDateToMySQL($dateStr) {
    return str_replace("Z", "", str_replace("T", " ", $dateStr));
}

/**
 * @return ISO 8601 Date string (2003-10-05T00:00:00Z)
 * @param DateTime $date
 */
function toISOString($date) {
    return $date->format("Y-m-d\TH:i:s\Z");
}

/**
 * e.g. "2003-10-06T00:00:00.000Z"
 * @param unknown_type $date
 * @return unknown_type
 */
function validateUTCDate($date) {
	if (preg_match("/^\d{4}[\/-]\d{2}[\/-]\d{2}T\d{2}:\d{2}:\d{2}.\d{0,3}Z?$/i", $date))
	   return true;
	return false;	   
}
?>