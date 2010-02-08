<?php
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