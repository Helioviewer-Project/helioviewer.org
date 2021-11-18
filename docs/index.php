<?php

    // Determine which API version to render
    preg_match('/^.*\/docs\/(v[0-9]+)\/.*$/',
        $_SERVER['REQUEST_URI'], $matches);
    if ( count($matches) >= 2 ) {
        // API version found in URL
        $api_version = $matches[1];
    }
    else {
        // No API version found in URL.  Set to default value and use later
        // to redirect to a version-specific URL before rendering.
        $api_version = 'v2';
    }

    // Script was called directly.  Redirect to an API-version specific URL.
    if (realpath(__FILE__) == $_SERVER['SCRIPT_FILENAME']) {
        require_once dirname(realpath(__FILE__)).'/../src/Config.php';
        $config = new Config(dirname(realpath(__FILE__))
                . '/../../settings/Config.ini');
        header('Location: '.HV_WEB_ROOT_URL.'/docs/'.$api_version);
    }


    function import_xml($api_version, &$api_xml_path, &$xml) {
        $api_xml_path = dirname(realpath(__FILE__)) . '/' . $api_version
                           . '/api_definitions.xml';
        $xml = simplexml_load_file($api_xml_path);
    }

    function output_html($api_version) {

        require_once HV_ROOT_DIR.'/../src/Database/DbConnection.php';
        require_once HV_ROOT_DIR.'/../src/Database/ImgIndex.php';
        require_once HV_ROOT_DIR.'/../src/Helper/ErrorHandler.php';

        import_xml($api_version, $api_xml_path, $xml);
?>
<!DOCTYPE html>
<html class="no-js">
        <head>
                <meta charset="utf-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
                <title>Helioviewer API Documentation</title>
                <meta name="description" content="">
                <meta name="viewport" content="width=device-width">

                <link rel="stylesheet" href="<?php echo HV_WEB_ROOT_URL; ?>/docs/css/bootstrap.min.css">
                <style>
                        body {
                                padding-top: 50px;
                                padding-bottom: 20px;
                        }
                </style>
                <link rel="stylesheet" href="<?php echo HV_WEB_ROOT_URL; ?>/docs/css/bootstrap-theme.min.css">
                <link rel="stylesheet" href="<?php echo HV_WEB_ROOT_URL; ?>/docs/css/helioviewer_api.css">
                <link rel="stylesheet" href="<?php echo HV_WEB_ROOT_URL.'/docs/'.$api_version.'/version_specific.css'; ?>">

                <script src="<?php echo HV_WEB_ROOT_URL; ?>/docs/js/vendor/modernizr-2.6.2-respond-1.1.0.min.js"></script>
        </head>
        <body>

        <div class="navbar navbar-inverse navbar-fixed-top">
            <div class="container">
                <div class="navbar-header">
                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </button>
                    <a class="navbar-brand" href="#">Heliviewer API <?php echo $api_version; ?></a>
                </div>
                <div class="navbar-collapse collapse">
                    <ul class="nav navbar-nav">
                        <li class=""><a href="#about">About</a></li>
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown">Browse API <b class="caret"></b></a>
                            <ul class="dropdown-menu">
                                <li class="dropdown-header">By Category:</li>
                                <li><a href="#JPEG2000">JPEG2000</a></li>
                                <li><a href="#Movies">Movies</a></li>
                                <li><a href="#Screenshots">Screenshots</a></li>
                                <li><a href="#SolarFeaturesandEvents">Solar Features and Events</a></li>
                                <li><a href="#YouTube" onclick="javascript:navigate(this);">YouTube</a></li>
                                <li><a href="#OfficialClients">Official Clients</a></li>
                                <li><a href="#WebSite">Web Site</a></li>
                            </ul>
                        </li>
                        <li class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown">Appendix <b class="caret"></b></a>
                            <ul class="dropdown-menu">
                                <li class="dropdown-header">More about:</li>
                                <li><a href="#appendix_datasources">Data Sources</a></li>
                                <li><a href="#appendix_coordinates">Coordinates</a></li>
                            </ul>
                        </li>
                    </ul>
                </div><!--/.navbar-collapse -->
            </div>
        </div>

        <!-- Main jumbotron for a primary marketing message or call to action -->
        <a name="about" class="anchor"></a>
        <div class="jumbotron">
            <div class="container">
                <h1>API Documentation</h1>
                <p class="description"><a href="<?php echo HV_CLIENT_URL; ?>">The Helioviewer Project</a> maintains a set of
                Public APIs with the goal of improving access to solar and
                heliospheric datasets to scientists, educators, developers, and the
                general public.  Read below for descriptions of each API endpoint and
                examples of usage.</p>

                <p class="description">Browse APIs by category using the menu above,
                or consult the <a href="#appendix">Appendix</a> for more about the
                available datasources and working with coordinates.</p>

                <p class="description">For easy access to API responses within your code, check out the open-source libraries available at <a href="http://unirest.io/" target="_blank" rel="nofollow">Unirest.io</a>. Libraries are provided for integration with <a href="http://unirest.io/python.html" target="_blank" rel="nofollow">Python</a>, <a href="http://unirest.io/php.html" target="_blank" rel="nofollow">PHP</a>, <a href="http://unirest.io/java.html" target="_blank" rel="nofollow">Java</a>, <a href="http://unirest.io/ruby.html" target="_blank" rel="nofollow">Ruby</a>, <a href="http://unirest.io/objective-c.html" target="_blank" rel="nofollow">Objective-C</a>, <a href="http://unirest.io/nodejs.html" target="_blank" rel="nofollow">Node.js</a>, <a href="http://unirest.io/net.html" target="_blank" rel="nofollow">.NET</a>, and <a href="http://unirest.io/windows-eight.html" target="_blank" rel="nofollow">Windows 8</a> code bases.</p>

                <p style="margin-top: 1.5em;"><a class="btn btn-primary btn-lg" href="http://unirest.io/" rel="nofollow" target="_blank">Unirest.io API Libraries &#10138;</a></p>
            </div>
        </div>

<?php
    renderGroup('JPEG2000', $xml);
    renderGroup('Movies', $xml);
    renderGroup('Screenshots', $xml);
    renderGroup('Solar Features and Events', $xml);
    renderGroup('YouTube', $xml);
    renderGroup('Official Clients', $xml);
    renderGroup('Web Site', $xml);
?>



        <a name="appendix" class="anchor"></a>
        <div class="container">
            <h1>Appendix</h1>
            <p class="description">The appendices below provide further context for Helioviewer API usage.</p>
        </div>


        <div class="container">

            <a name="appendix_datasources" class="anchor"></a>
            <h2 class="appendix">Data Sources</h2>
            <p class="description">Listed below are all valid image data sources hosted by the Helioviewer Project.  Reference a particular datasource in your API requests by its '<span class="param">sourceId</span>' parameter shown in the following tables.</p>


<?php

    function recursiveGroup($obj, &$out_arr=array()) {
        foreach ( $obj as $key => $val ) {
            if ( !array_key_exists('sourceId', $val) ) {
                recursiveGroup($val, $out_arr);
            }
            else {
                $groupBy  = $val['uiLabels'][0]['name'];
                $sourceId = $val['sourceId'];

                $current_arr = array();

                $current_arr['sourceId']=$val['sourceId'];
                $current_arr['nickname']=$val['nickname'];
                $current_arr['uiLabels']=$val['uiLabels'];

                $out_arr[$groupBy][] = $current_arr;
                continue;
            }
        }
    }

    $imgIndex = new Database_ImgIndex();
    recursiveGroup($imgIndex->getDataSources(false), $groupedSources);

    foreach ( $groupedSources as $group => $obj) {
?>
            <a name="datasource_<?php echo strtolower($group); ?>" class="anchor"></a>
            <h3><?php echo $group; ?></h3>
            <table style="width: 100%;">
                <tr style="border: 1px solid #999; background-color: #eee;">
                    <th style="padding: 2px 6px; text-align:center;">Source ID</th>
                    <th style="padding: 2px 6px;">Description</th>
<?php


        // Grab datasource hierarchy information from first element
        foreach ($obj[0]['uiLabels'] as $hierarchy) {
            echo '                    <th>'.$hierarchy['label'].'</th>';
        }
?>
                </tr>
<?php
        foreach ( $obj as $sourceId => $source ) {

?>
                <tr>
                    <td class="sourceId param"><?php echo $source['sourceId']; ?></td>
                    <td ><?php echo $source['nickname']; ?></td>
<?php
            foreach ($source['uiLabels'] as $hierarchy) {
                echo '                    <td>'.$hierarchy['name'].'</td>';
            }
?>
                </tr>
<?php
        }
?>
            </table>
            <br />
<?php
    }
?>
        </div>


        <div class="container">

            <a name="appendix_coordinates" class="anchor"></a>
            <h2 class="appendix">Coordinates</h2>
            <p class="description">The APIs for creating custom movies ('<a class="endpoint" href="#queueMovie">queueMovie</a>') and screenshot images ('<a class="endpoint" href="#takeScreenshot">takeScreenshot</a>') require that you specify a rectangular region-of-interest (ROI). The ROI defines the field-of-view of the video or image in terms of a zoom level and the location and size of the region.</p>

            <p class="description">The region-of-interest may be defined in either of two ways.  Both methods require an '<span class="param">imageScale</span>' expressed in arc-seconds per pixel, and atleast one pair of X- and Y-coordinates (expressed as arc-seconds from the center of the solar disk).</p>

            <p class="description">The first method defines the ROI based on a pair parameters specifying the X- and Y-coordinates for the top-left ('<span class="param">x1</span>','<span class="param">y1</span>') and bottom-right ('<span class="param">x2</span>','<span class="param">y2</span>') corners of rectangle.</p>

            <p class="description" style="text-align:center;">
                <img src="<?php echo HV_WEB_ROOT_URL; ?>/resources/images/Helioviewer_ROI_Arcseconds_Overview.png" />
            </p>

            <p class="description">An alternative method defines the ROI in terms of the X- and Y-coordinates of the center of the region ('<span class="param">x0</span>','<span class="param">y0</span>'), coupled with the total width and height of the rectangle in pixels.  Use this method if the pixel dimensions of the output are important to you.  The APIs handle the translation between arc-seconds and pixels based on the value of '<span class="param">imageScale</span>' that you have specified.  </p>

            <p class="description" style="text-align:center;">
                <img src="<?php echo HV_WEB_ROOT_URL; ?>/resources/images/Helioviewer_ROI_Pixels_Overview.png" />
            </p>

            <p class="description">Smaller values of '<span class="param">imageScale</span>' will produce results that appear "zoomed-in" to show more detail.</p>

            <p class="description">Below is a listing of the native image scales by datasource:</p>

            <div class="description">
                <table style="margin: 0 auto; margin-bottom:2em; width:80%;">
                <tr style="border: 1px solid #999; background-color: #eee;">
                    <th style="padding: 2px 6px;">Datasource</th>
                    <th style="padding: 2px 6px; text-align:center;">Dimensions (pixels)</th>
                    <th style="padding: 2px 6px;">Image Scale (arc-seconds/pixel)</th>
                </tr>
                <tr>
                    <td>PROBA2 SWAP</td>
                    <td class="param" style="text-align:center;">1024 x 1024</td>
                    <td class="param">&nbsp;3.162</td>
                </tr>
                <tr>
                    <td>SDO AIA</td>
                    <td class="param" style="text-align:center;">4096 x 4096</td>
                    <td class="param">&nbsp;0.6</td>
                </tr>
                <tr>
                    <td>SDO HMI</td>
                    <td class="param" style="text-align:center;">4096 x 4096</td>
                    <td class="param">&nbsp;0.6</td>
                </tr>
                <tr>
                    <td>SOHO EIT</td>
                    <td class="param" style="text-align:center;">1024 x 1024</td>
                    <td class="param">&nbsp;2.63</td>
                </tr>
                <tr>
                    <td>SOHO LASCO C2</td>
                    <td class="param" style="text-align:center;">1024 x 1024</td>
                    <td class="param">11.9</td>
                </tr>
                <tr>
                    <td>SOHO LASCO C3</td>
                    <td class="param" style="text-align:center;">1024 x 1024</td>
                    <td class="param">56.0</td>
                </tr>
                <tr>
                    <td>SOHO MDI</td>
                    <td class="param" style="text-align:center;">1024 x 1024</td>
                    <td class="param">&nbsp;1.986</td>
                </tr>
                <tr>
                    <td>STEREO SECCHI EUVI</td>
                    <td class="param" style="text-align:center;">2048 x 2048</td>
                    <td class="param">&nbsp;1.588</td>
                </tr>
                <tr>
                    <td>STEREO SECCHI COR1</td>
                    <td class="param" style="text-align:center;">512 x 512</td>
                    <td class="param">15.0</td>
                </tr>
                <tr>
                    <td>STEREO SECCHI COR2</td>
                    <td class="param" style="text-align:center;">2048 x 2048</td>
                    <td class="param">14.7</td>
                </tr>
                <tr>
                    <td>Yohkoh SXT</td>
                    <td class="param" style="text-align:center;">1024 x 1024</td>
                    <td class="param">&nbsp;2.46</td>
                </tr>
                </table>
            </div>

            <p class="description">You are not limited to creating screenshots and movies at a datasource's native resolution.  Each image layer will be scaled to match the imageScale you have requested.</p>
        </div>
<?php
        footer($api_version, $api_xml_path);
?>
    </body>
</html>
<?php
    }  // end of outputHTML();




    function footer($api_version, $api_xml_path) {
?>
        <div class="container">

            <hr>

            <footer>
                <p><b>Last Updated:</b> <?php echo date('j F Y', filemtime($api_xml_path)); ?></p>
            </footer>
        </div>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="<?php echo HV_WEB_ROOT_URL; ?>/docs/js/vendor/jquery-1.10.1.min.js"><\/script>')</script>

        <script src="<?php echo HV_WEB_ROOT_URL; ?>/docs/js/vendor/bootstrap.min.js"></script>

        <script src="<?php echo HV_WEB_ROOT_URL.'/docs/'.$api_version.'/version_specific.js'; ?>"></script>

        <script>
            var _gaq=[['_setAccount','<?php echo HV_GOOGLE_ANALYTICS_ID; ?>'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src='//www.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script>
<?php
    }
?>



<?php
    function renderModel($models, $route, $xml) {
        $ascii = 65; // ASCII 'A'
        foreach ( $models as $model) {
?>
        <div class="container model">
            <div class="row">
                <div class="col-lg-12 request">
                    <h4>Example (<?php echo chr($ascii); ?>):</h4>
                    <h5 class="response_type">
                        <span class="response"><?php echo $model['type']; ?>
<?php
    if ( $model['subtype'] != '' ) {
        echo ' ('.$model['subtype'].')';
    }
?>
                         </span></h5>
                </div>
            </div>

<?php
    if ( $model->description != '' ) {
?>
        <p class="description"><?php echo nl2br($model->description); ?></p>
<?php
    }

    if ( $model->example != '' || $model->example['query_string'] != '' ) {
?>
        <h5 class="model">Example Request:</h5>
<?php
        if ( $model->example['query_string'] != '' ) {
            $request = HV_WEB_ROOT_URL.$route.$model->example['query_string'];
            $href = HV_WEB_ROOT_URL.$route.htmlentities($model->example['query_string']);
?>
        <a class="example request" href="<?php echo $href; ?>" target="_blank" rel="nofollow"><?php echo $request; ?></a>
<?php
        }

        if ( $model->example != '' ) {
?>
        <h5 class="model">Example Response:</h5>
        <pre class="response example"><?php echo $model->example; ?></pre>
<?php
        }
    }

    foreach ( $xml->model as $i => $response ) {
        if ( (string)$response['name'] == $model['type'] ) {
            if ( $response->description != '' ) {
?>
            <p class="description"><?php echo nl2br($response->description); ?></p>
<?php
            }

            if ( count($response->fields->simple) > 0 ) {
?>
            <table class="model" style="width: 100%;">
                <thead>
                    <th style="width: 10%; padding: 2px 6px;">Parameter</th>
                    <th style="width: 10%; padding: 2px 6px; text-align: center;">Required</th>
                    <th style="width: 10%; padding: 2px 6px; text-align: center;">Type</th>
                    <th>Description</th>
                </thead>
<?php
                foreach ( $response->fields->simple as $j => $field ) {
?>
                <tr>
                    <td class="param emphasis"><?php echo $field['name']; ?></td>
                    <td class="required">
<?php
                    if ( $field['optional'] == 'true' ) {
                        echo 'Optional';
                    }
                    else {
                        echo 'Required';
                    }
?></td>
                    <td class="datatype" style="text-align: center;"><?php echo $field['type']; ?></td>
                    <td class="description"><?php echo nl2br($field->description); ?></td>
                </tr>
<?php
                }
?>
            </table>
<?php
            }
            break;
        }
    }
?>
            <br/>
        </div>
<?php
            $ascii++;
        }
        return;
    }
?>

<?php

    function renderEndpoint($endpoint, $xml=null) {
        $api_name  = $endpoint['name'];
        $api_route = $endpoint->route;
        $api_description = $endpoint->description;
        $api_action = $endpoint['http'];
?>
        <!-- <?php echo $api_name; ?> -->
        <a name="<?php echo $api_name; ?>" class="anchor"></a>
        <div class="container endpoint">
            <div class="row">
                <div class="col-lg-12 request">
                    <h3><?php echo $api_name; ?></h3>
                    <h5><span class="<?php echo strtolower($api_action); ?>"><?php echo $api_action; ?></span> <span class="route"><?php echo $api_route; ?></span></h5>
                    <p class="description"><?php echo nl2br($api_description); ?></p>
                    <h5 class="endpoint">Request Parameters:</h5>
                </div>
            </div>
<?php
        if ( count($endpoint->parameters->parameter > 0) ) {
?>
            <table class="request" style="width: 100%;" summary="
            required and optional request parameters.">
                <thead>
                    <tr>
                        <td style="width: 10%; padding: 2px 6px;">Parameter</td>
                        <td style="width: 10%; padding: 2px 6px; text-align: center;">Required</td>
                        <td style="width: 10%; padding: 2px 6px; text-align: center;">Type</td>
                        <td>Example</td>
                        <td>Description</td>
                    </tr>
                </thead>
<?php
        }
        foreach ($endpoint->parameters->parameter as $param) {
?>
                <tr>
                    <td class="param emphasis"><?php echo $param['name']; ?></td>
                    <td class="required"><?php echo $param['optional']=='true' ? 'Optional' : 'Required'; ?></td>
                    <td class="datatype" style="text-align: center;"><?php echo $param['type']; ?></td>
                    <td class="example" style="padding: 2px 6px; ">
<?php
            if ( $param['type'] != 'boolean' ) {
                echo $param->example;
            }
            else if ( $param->example == 'checked' || $param->example == 'true' ) {
                echo 'true';
            }
            else {
                echo 'false';
            }
?>
                    </td>
                    <td class="description"><?php echo nl2br($param->description); ?></td>
                </tr>
<?php
        }
        if ( count($endpoint->parameters->parameter > 0) ) {
?>
            </table>
            <br/>
<?php
        }
?>
        </div>
<?php
        renderModel($endpoint->response, $api_route, $xml);

        return;
    }



    function renderGroup($groupName, $xml) {
?>
        <a name="<?php echo str_replace(' ', '', $groupName); ?>" class="anchor"></a>
        <div class="container">
            <h2 class="group"><?php echo $groupName; ?></h2>
<?php
        foreach ( $xml->group as $group ) {

            if ( $group['name'] == $groupName ) {
?>
            <p class="description"><?php echo $group->description; ?></p>
<?php
            }
        }
?>
        </div>
<?php
        foreach ( $xml->endpoint as $endpoint ) {
            if ( $endpoint['group'] == $groupName ) {
                renderEndpoint($endpoint, $xml);
            }
        }
    }
?>