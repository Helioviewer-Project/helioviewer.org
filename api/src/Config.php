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
    private $_bools  = array("distributed_mode_enabled", "disable_cache", "helioqueuer_enabled",
                             "enable_statistics_collection");
                             
    private $_ints   = array("build_num", "bit_depth", "default_timestep", "prefetch_size", "num_colors",
                             "ffmpeg_max_threads", "max_jpx_frames", "max_movie_frames");
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
            if ($key !== "server") {
                define("HV_" . strtoupper($key), $value);
            }
        }
        
        if ($this->config['distributed_mode_enabled']) {
            array_unshift($this->config["server"], "api/index.php");
        } else {
            $this->config["server"] = array("api/index.php");
        }

        foreach ($this->config["server"] as $id => $url) {
            define("HV_SERVER_" . ($id), $url);
        }

        $this->_setAdditionalParams();
        
        $keys = substr($file, 0, strripos($file, "/")) . "/Private.php";
        include_once $keys;
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
     * Some useful values can be determined automatically...
     *
     * @return void
     */
    private function _setAdditionalParams()
    {
        define("HV_LOG_DIR", HV_ROOT_DIR . "/log");
        define("HV_API_ROOT_DIR", HV_ROOT_DIR . "/api");
        define("HV_API_ROOT_URL", HV_WEB_ROOT_URL . "/api/index.php");
        define("HV_CACHE_DIR", HV_ROOT_DIR . "/cache");
        define("HV_CACHE_URL", HV_WEB_ROOT_URL . "/cache");
        
        define("HV_CONSTANT_AU", 149597870700); // 1 au in meters (http://maia.usno.navy.mil/NSFA/IAU2009_consts.html)
        define("HV_CONSTANT_RSUN", 959.644); // Solar radius in arc-seconds at 1 au
        
        // Image compression settings (See http://www.imagemagick.org/script/command-line-options.php#quality)
        define("PNG_LOW_COMPRESSION",  10);  // Faster, large files
        define("PNG_HIGH_COMPRESSION", 50);  // Slower, smalle files
        define("JPG_HIGH_COMPRESSION", 80);  // Good quality, small files, faster
        define("JPG_LOW_COMPRESSION",  100); // Best quality, large files, slower
    }
}