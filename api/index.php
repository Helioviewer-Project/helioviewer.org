<?php
/**
 * Helioviewer Web Server
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 * TODO 06/28/2011
 *  = Reuse database connection for statistics and other methods that need it? *
 *
 * TODO 01/28/2010
 *  = Document getDataSources, getJP2Header, and getClosestImage methods.
 *  = Explain use of sourceId for faster querying.
 *
 * TODO 01/27/2010
 *  = Add method to WebClient to print config file (e.g. for stand-alone
 *    web-client install to connect with)
 *  = Add getPlugins method to JHelioviewer module (empty function for now)
 */
require_once 'src/Config.php';
require_once 'src/Helper/ErrorHandler.php';

$config = new Config('../settings/Config.ini');
date_default_timezone_set('UTC');
register_shutdown_function('shutdownFunction');


if ( array_key_exists('docs', $_GET) ) {
    printAPIDocs();
    exit;
}


// For now, accept GET or POST requests for any API endpoint
if ( isset($_REQUEST['action']) ) {
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $params = $_GET;
    }
    else {
        $params = $_POST;
    }
}


// Redirect to API Documentation if no API request is being made.
if ( !isset($params) || !loadModule($params) ) {
    header('Location: '.HV_API_URL.'/docs/');
}

/**
 * Loads the required module based on the action specified and run the
 * action.
 *
 * @param array $params API Request parameters
 *
 * @return bool Returns true if the action specified is valid and was
 *              successfully run.
 */
function loadModule($params) {

    $valid_actions = array(
        'downloadScreenshot'     => 'WebClient',
        'getClosestImage'        => 'WebClient',
        'getDataSources'         => 'WebClient',
        'getDataSourceList'      => 'WebClient',
        'getJP2Header'           => 'WebClient',
        'getNewsFeed'            => 'WebClient',
        'getStatus'              => 'WebClient',
        'getTile'                => 'WebClient',
        'getUsageStatistics'     => 'WebClient',
        'getDataCoverage'        => 'WebClient',
        'updateDataCoverage'     => 'WebClient',
        'shortenURL'             => 'WebClient',
        'takeScreenshot'         => 'WebClient',
        'getJP2Image'            => 'JHelioviewer',
        'getJPX'                 => 'JHelioviewer',
        'launchJHelioviewer'     => 'JHelioviewer',
        'buildMovie'             => 'Movies',
        'downloadMovie'          => 'Movies',
        'getMovieStatus'         => 'Movies',
        'playMovie'              => 'Movies',
        'queueMovie'             => 'Movies',
        'uploadMovieToYouTube'   => 'Movies',
        'checkYouTubeAuth'       => 'Movies',
        'getYouTubeAuth'         => 'Movies',
        'getUserVideos'          => 'Movies',
        'getEventFRMs'           => 'SolarEvents',
        'getFRMs'                => 'SolarEvents',
        'getDefaultEventTypes'   => 'SolarEvents',
        'getEvents'              => 'SolarEvents',
        'getEventsByEventLayers' => 'SolarEvents',
        'getEventGlossary'       => 'SolarEvents'
    );

    include_once 'src/Validation/InputValidator.php';

    try {
        if ( !array_key_exists('action', $params) ||
             !array_key_exists($params['action'], $valid_actions) ) {

            $url = HV_API_URL.'/docs/';
            throw new Exception(
                'Invalid action specified.<br />Consult the <a href="'.$url.'">' .
                'API Documentation</a> for a list of valid actions.', 26
            );
        }
        else {
        	// Execute action
            $moduleName = $valid_actions[$params['action']];
            $className  = 'Module_'.$moduleName;

            include_once 'src/Module/'.$moduleName.'.php';

            $module = new $className($params);
            $module->execute();

            // Update usage stats
            $actions_to_keep_stats_for = array('getClosestImage',
                'takeScreenshot', 'getJPX', 'uploadMovieToYouTube');

			// Note that in addition to the above, buildMovie requests and
			// addition to getTile when the tile was already in the cache.
            if ( HV_ENABLE_STATISTICS_COLLECTION &&
                 in_array($params['action'], $actions_to_keep_stats_for) ) {

                include_once 'src/Database/Statistics.php';
                $statistics = new Database_Statistics();
                $statistics->log($params['action']);
            }
        }
    }
    catch (Exception $e) {
        printHTMLErrorMsg($e->getMessage());
    }

    return true;
}


/**
 * Displays a human-readable HTML error message to the user
 *
 * @param string $msg Error message to display to the user
 *
 * @return void
 */
function printHTMLErrorMsg($msg) {
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
        $meta = "<!-- DATE: %s URL: http://%s%s -->\n";
        printf($meta, strftime('%Y-%m-%d %H:%m:%S'), $_SERVER['HTTP_HOST'],
            $_SERVER['REQUEST_URI']);
    ?>
    <title>Helioviewer.org API - Error</title>
    <link rel="stylesheet" type="text/css" href="<?php echo HV_API_URL; ?>/docs/css/bootstrap-theme.min.css">
    <link rel="stylesheet" type="text/css" href="<?php echo HV_API_URL; ?>/docs/css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="<?php echo HV_API_URL; ?>/docs/css/main.css">
</head>
<body>
    <div style='width: 50%; margin-left: auto; margin-right: auto; margin-top: 1em; text-align: center;'>
        <img src='<?php echo HV_API_URL.'/'.HV_API_LOGO; ?>' alt='Helioviewer logo'>
        <div style="margin-top: 0.5em; padding: 0.5em; border: 1px solid red; background-color: pink; border-radius: 3px; font-size: 1.4em;">
            <b>Error:</b> <?php echo $msg; ?>
        </div>
    </div>
<?php

    include_once HV_API_DIR.'/docs/index.php';

    $api_version = 'v1';

    import_xml($api_version, $api_xml_path, $xml);
    foreach ( $xml->endpoint as $endpoint ) {
        if ( $endpoint['name'] == $_GET['action'] ) {
            renderEndpoint($endpoint, $xml);
            break;
        }
    }
    footer($api_version, $api_xml_path);
?>
</body>
</html>
<?php
}

/**
 * Shutdown function used to catch and log fatal PHP errors
 */
function shutDownFunction() {
    $error = error_get_last();

    if ($error['type'] == 1) {
        handleError(sprintf("%s:%d - %s", $error['file'], $error['line'],
            $error['message']), $error->getCode());
    }
}
?>