<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Configuration Helper Class Definition
 *
 * This file defines a class which helps to parse Helioviewer's configuration
 * file, create global constants which can be used to access those configuration
 * parameters, and fix data types for known parameters.
 *
 * PHP version 5
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Helioviewer Configuration Helper
 *
 * A helper class created to assist in parsing Helioviewer's configuration
 * file. It creates global constants which can be used to access those configuration
 * parameters, and fix data types for known parameters.
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Config
{
    private $_bools  = array("local_tiling_enabled", "distributed_tiling_enabled", "disable_cache");
    private $_ints   = array("build_num", "bit_depth", "default_timestep", "prefetch_size", "num_colors",
                             "png_compression_quality", "jpeg_compression_quality", "max_jpx_frames",
                             "max_movie_frames");
    private $_floats = array("default_image_scale", "min_image_scale", "max_image_scale");

    public  $servers;

    /**
     * Creates an instance of the Config helper class
     *
     * @param string $file Path to configuration file
     *
     * @return void
     */
    public function __construct($file)
    {
        $this->config = parse_ini_file($file);

        $this->_fixTypes();

        foreach ($this->config as $key => $value) {
            if ($key !== "tile_server") {
                define("HV_" . strtoupper($key), $value);
            }
        }

        if ($this->config['local_tiling_enabled']) {
            array_unshift($this->config["tile_server"], "api/index.php");
        }
        
        foreach ($this->config["tile_server"] as $id => $url) {
            define("HV_TILE_SERVER_" . ($id), $url);
        }
        
//        define("HV_TILE_SERVER_0", "api/index.php");
//        foreach ($this->config["tile_server"] as $id => $url) {
//            define("HV_TILE_SERVER_" . ($id + 1), $url);
//        }

        $this->_setAdditionalParams();

        $this->_setupLogging(true);

        $dbconfig = substr($file, 0, strripos($file, "/")) . "/Database.php";

        include_once $dbconfig;
    }

    /**
     * Casts known configuration variables to correct types.
     *
     * @return void
     */
    private function _fixTypes()
    {
        // booleans
        foreach ($this->_bools as $boolean) {
            $this->config[$boolean] = (bool) $this->config[$boolean];
        }

        // integers
        foreach ($this->_ints as $int) {
            $this->config[$int] = (int) $this->config[$int];
        }

        // floats
        foreach ($this->_floats as $float) {
            $this->config[$float] = (float) $this->config[$float];
        }
    }

    /**
     * Makes sure that error log exists and selects desired logging verbosity
     *
     * @param bool $verbose Whether or not to force verbose logging.
     *
     * @return void
     */
    private function _setupLogging($verbose)
    {
        if ($verbose) {
            error_reporting(E_ALL | E_STRICT);
        }
        $errorLog = HV_ERROR_LOG;
        if (!file_exists($errorLog)) {
            touch($errorLog);
        }
    }

    /**
     * Some useful values can be determined automatically...
     *
     * @return void
     */
    private function _setAdditionalParams()
    {
        //define("HV_ROOT_DIR", substr(getcwd(), 0, -4));
        //define("HV_WEB_ROOT_URL", "http://" . $_SERVER["SERVER_NAME"]
        //    . substr($_SERVER["SCRIPT_NAME"], 0, -14));
        define("HV_CACHE_DIR", HV_ROOT_DIR . "/cache");
        define("HV_TMP_DIR", HV_ROOT_DIR . "/cache/tmp");
        define("HV_ERROR_LOG", HV_ROOT_DIR . "/log/error");
        define("HV_EMPTY_TILE", HV_ROOT_DIR . "/resources/images/transparent_512.png");
        define("HV_TMP_ROOT_URL", HV_WEB_ROOT_URL . "/cache/tmp");
    }
}