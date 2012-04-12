<?php
    // Accepted URL parameters
    $params = array(
        "strings" => array("date", "movieId", "output"),
        "floats"  => array("centerX", "centerY", "imageScale"),
        "bools"   => array("debug", "hideWatermark")
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
        if(isset($_GET[$bool]) && ($_GET[$bool] == "true" || $_GET[$bool] == "1")) {
            $urlSettings[$bool] = true;
        } else {
            $urlSettings[$bool] = false;
        }
    }
    
    // Process imageLayers separately if set
    if (isset($_GET['imageLayers'])) {
        if ($_GET['imageLayers'][0] == "[") {
            $imageLayersString = substr($_GET['imageLayers'],1,-1);
        } else {
            $imageLayersString = $_GET['imageLayers'];
        }
        $urlSettings['imageLayers'] = preg_split("/\],\[/", $imageLayersString);
    }
        
    // Default to HTML5 client
    if (!isset($urlSettings["output"])) {
        require_once "src/php/HelioviewerWebClient.php";
        $helioviewer = new HelioviewerWebClient($urlSettings);        
    } else if ($urlSettings["output"] == "embed") {
        // Embedded version of Helioviewer.org
        require_once "src/php/HelioviewerEmbeddedClient.php";
        $helioviewer = new HelioviewerEmbeddedClient($urlSettings);
    }
?>