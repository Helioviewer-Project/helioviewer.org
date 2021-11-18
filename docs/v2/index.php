<?php
    require_once dirname(realpath(__FILE__)).'/../../../src/Config.php';
    $config = new Config(
        dirname(realpath(__FILE__)).'/../../../settings/Config.ini');

    require_once HV_ROOT_DIR.'/docs/index.php';

    output_html($api_version);
?>