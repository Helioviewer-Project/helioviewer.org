<?php
/**
 * Handles errors encountered during request processing.
 * 
 * @param string $msg     The error message to display
 * @param bool   $skipLog If true no log file will be created
 * 
 * Note: If multiple levels of verbosity are needed, one option would be to split up the complete error message
 *       into it's separate parts, add a "details" field with the full message, and display only the top-level
 *       error message in "error" 
 * 
 * @see http://www.firephp.org/
 */
function handleError($msg, $skipLog=false)
{
    header('Content-type: application/json;charset=UTF-8');
    
    // JSON
    echo json_encode(array("error"=>$msg));

    // Fire PHP
    include_once "lib/FirePHPCore/fb.php";
    FB::error($msg);
    
    // For errors which are expected (e.g. a movie request for which sufficient data is not available) a non-zero
    // exception code can be set to a non-zero value indicating that the error is known and no log should be created.
    if (!$skipLog) {
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
        $msg .= "\n$source?" . http_build_query($_REQUEST);
    }

    file_put_contents($log, $msg);
}
?>