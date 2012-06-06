<?php
/**
 * Handles errors encountered during request processing.
 * 
 * @param string $msg       The error message to display
 * @param int    $errorCode Error code number
 * 
 * Error Codes:
 *    1 DATABASE    Unable to connect
 *    2 DATABASE    Query error
 *   10 DATA        No images found for specified datasource
 *   11 DATA        No images found before/after specified start/end date
 *   12 DATA        No images found in requested time range
 *   13 DATA        Unable to process JPEG 2000 XML header box
 *   14 DATA        Failed to decode JPEG 2000 image data
 *   15 DATA        Error encountered while parsing image header tags
 *   16 DATA        Insufficient data found in requested time range
 *   20 REQUEST     No valid layers specified for request
 *   21 REQUEST     No overlap between ROI and data in one or more dimensions
 *   22 REQUEST     Invalid layers or quantity of layers specified
 *   23 REQUEST     Region of interest not properly specified
 *   24 REQUEST     Unable to locate the specified item
 *   25 REQUEST     Invalid value specified for request parameter
 *   26 REQUEST     Unsupported feature
 *   27 REQUEST     Unrecognize request parameter
 *   28 REQUEST     Required parameter missing
 *   30 IMAGE       Unable to create one or more composite image layers
 *   31 IMAGE       Image composition failed
 *   32 IMAGE       Unable to apply color table
 *   33 IMAGE       Unable to read image from cache
 *   40 MOVIE       Queue full
 *   41 MOVIE       Attempt to upload invalid or unfinished movie
 *   42 MOVIE       Error encountered during authentication with YouTube
 *   43 MOVIE       Error encountered during video encoding
 *   44 MOVIE       Attempt to rebuild processed movie
 *   45 MOVIE       Attempt to upload without authorizing
 *   46 MOVIE       Attempt to upload movie more than once
 *   50 SYSTEM      Permissions error
 *   60 JHV         Failed to create JPX
 *   61 JHV         JPX creation taking too long
 *   62 JHV         JPX summary file not found
 *  255 GENERAL     Unexpected error
 * 
 * 
 * Note: If multiple levels of verbosity are needed, one option would be to 
 *       split up the complete error message into it's separate parts, add 
 *       a "details" field with the full message, and display only the 
 *       top-level error message in "error" 
 * 
 * @see http://www.firephp.org/
 */
function handleError($msg, $errorCode=255)
{
    header('Content-type: application/json;charset=UTF-8');
    
    // JSON
    echo json_encode(array(
        "error" =>$msg,
        "errno" =>$errorCode
    ));

    // Fire PHP
    include_once HV_API_ROOT_DIR ."/lib/FirePHPCore/fb.php";
    FB::error($msg);
    
    // Don't log non-harmful errors
    $dontLog = array(12, 16, 23, 25, 26, 40, 44, 46);

    if (!in_array($errorCode, $dontLog)) {
        logErrorMsg($msg);
    }
}

/**
 * Logs an error message to the log whose location is specified in Config.ini
 * 
 * @param string $error The body of the error message to be logged.
 * 
 * @return void 
 */
function logErrorMsg($error, $prefix="")
{
    // API request errors
    if (isset($_SERVER['HTTP_HOST']) && isset($_SERVER['REQUEST_URI'])) {
        $source = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    } else {
        // Resque worker errors
        $source = "Resque: " . $_SERVER['QUEUE'];
    }
    
    $log = HV_LOG_DIR . "/$prefix" . date("Ymd_His") . ".log";
    
    $template = "====[DATE]====================\n\n%s\n\n====[SOURCE]===================\n\n%s\n\n"
              . "====[MESSAGE]=================\n\n%s";
    
    $msg = sprintf($template, date("Y/m/d H:i:s"), $source, $error);
    
    if (!empty($_REQUEST)) {
        $msg .= "\n\n====[POST]=================\n\n";
        foreach ($_REQUEST as $key => $value) {
           $msg .= "'$key' => $value\n";
        }
        $msg .= "\n$source";
    }

    file_put_contents($log, $msg);
}
?>