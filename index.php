<?php
    // Accepted URL parameters
    // (except "imageLayers" and "eventLayers", handled separately)
    $params = array(
        'strings' => array('date', 'movieId', 'output'),
        'floats'  => array('centerX', 'centerY', 'imageScale'),
        'bools'   => array('debug', 'hideWatermark', 'eventLabels')
    );

    $urlSettings = array();

    // Check for URL params and cast to appropriate types
    foreach($params['strings'] as $str) {
        if (isset($_GET[$str]))
            $urlSettings[$str] = $_GET[$str];
    }
    foreach($params['floats'] as $float) {
        if (isset($_GET[$float]))
            $urlSettings[$float] = (float) $_GET[$float];
    }
    foreach($params['bools'] as $bool) {
        if ( isset($_GET[$bool]) &&
            (strtolower($_GET[$bool]) == 'true' || $_GET[$bool] == 1) ) {

            $urlSettings[$bool] = true;
        }
        else if ( isset($_GET[$bool]) &&
                 (strtolower($_GET[$bool]) == 'false' || $_GET[$bool] == 0) ) {

            $urlSettings[$bool] = false;
        }
        else {
            unset($urlSettings[$bool]);
        }
    }

    // Process imageLayers separately if set
    if (isset($_GET['imageLayers']) && $_GET['imageLayers'] != '') {
        if ($_GET['imageLayers'][0] == '[') {
            $imageLayersString = substr($_GET['imageLayers'],1,-1);
        } else {
            $imageLayersString = $_GET['imageLayers'];
        }
        $urlSettings['imageLayers'] = preg_split("/\],\[/", $imageLayersString);
    }
    else {
        $urlSettings['imageLayers'] = '';
    }

    // Process eventLayers separately if set
    if (isset($_GET['eventLayers']) && $_GET['eventLayers'] != '') {
        if ($_GET['eventLayers'][0] == '[') {
            $eventLayersString = substr($_GET['eventLayers'],1,-1);
        } else {
            $eventLayersString = $_GET['eventLayers'];
        }
        $urlSettings['eventLayers'] = preg_split("/\],\[/", $eventLayersString);
    }
    else {
        $urlSettings['eventLayers'] = '';
    }

    // Default to HTML5 client
    if ( isset($urlSettings['output']) && $urlSettings['output'] == 'embed' ) {
        // Embedded version of Helioviewer.org
        require_once 'src/php/HelioviewerEmbeddedClient.php';
        $helioviewer = new HelioviewerEmbeddedClient($urlSettings);
    }
    else {
        require_once 'src/php/HelioviewerWebClient.php';
        $helioviewer = new HelioviewerWebClient($urlSettings);
    }
?>
