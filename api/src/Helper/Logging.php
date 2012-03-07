<?php
/**
 * Logs an error message to the log whose location is specified in Config.ini
 * 
 * @param string $error The body of the error message to be logged.
 * 
 * @return void 
 */
function logErrorMsg($error, $prefix="")
{
    $url = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    $log = HV_LOG_DIR . "/$prefix" . date("Ymd_His") . ".log";
    
    $template = "====[DATE]====================\n\n%s\n\n====[URL]=====================\n\n%s\n\n"
              . "====[MESSAGE]=================\n\n%s";
    
    $msg = sprintf($template, date("Y/m/d H:i:s"), $url, $error);
    
    if (!empty($_REQUEST)) {
        $msg .= "\n\n====[POST]=================\n\n";
        foreach ($_REQUEST as $key => $value) {
           $msg .= "'$key' => $value\n";
        }
        $msg .= "\n$url?" . http_build_query($_REQUEST);
    }

    file_put_contents($log, $msg);
}
?>