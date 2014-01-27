<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Configuration Helper Class Definition
 *
 * This file defines a class which helps to parse Helioviewer's configuration
 * file, create global constants which can be used to access those
 * configuration parameters, and fix data types for known parameters.
 *
 * PHP version 5
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Helioviewer Configuration Helper
 *
 * A helper class created to assist in parsing Helioviewer's configuration
 * file. It creates global constants which can be used to access those
 * configuration parameters, and fix data types for known parameters.
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Config {

    private $_bools  = array('disable_cache', 'enable_statistics_collection');
    private $_ints   = array('build_num', 'default_timestep', 'prefetch_size',
                             'ffmpeg_max_threads', 'max_jpx_frames',
                             'max_movie_frames');
    private $_floats = array('default_image_scale', 'min_image_scale',
                             'max_image_scale');

    /**
     * Creates an instance of the Config helper class
     *
     * @param string $file Path to configuration file
     *
     * @return void
     */
    public function __construct($file) {

        $this->config = parse_ini_file($file);

        $this->_fixTypes();

        foreach ($this->config as $key => $value) {
            define('HV_'.strtoupper($key), $value);
        }

        $this->_setAdditionalParams();

        $keys = substr($file, 0, strripos($file, '/')).'/Private.php';
        include_once $keys;
    }

    /**
     * Casts known configuration variables to correct types.
     *
     * @return void
     */
    private function _fixTypes() {

        // booleans
        foreach ($this->_bools as $boolean) {
            $this->config[$boolean] = ($this->config[$boolean] == 'true' ||
                $this->config[$boolean] == '1');
        }

        // integers
        foreach ($this->_ints as $int) {
            $this->config[$int] = (int)$this->config[$int];
        }

        // floats
        foreach ($this->_floats as $float) {
            $this->config[$float] = (float)$this->config[$float];
        }
    }

    /**
     * Some useful values can be determined automatically...
     *
     * @return void
     */
    private function _setAdditionalParams() {

        define('HV_LOG_DIR',      HV_ROOT_DIR     . '/log');
        define('HV_API_ROOT_DIR', HV_ROOT_DIR     . '/api');
        define('HV_API_ROOT_URL', HV_WEB_ROOT_URL . '/api/index.php');
        define('HV_CACHE_URL',    HV_WEB_ROOT_URL . '/cache');

        // 1 au in meters (http://maia.usno.navy.mil/NSFA/IAU2009_consts.html)
        define('HV_CONSTANT_AU',     149597870700);
        // Solar radius in arc-seconds at 1 au
        define('HV_CONSTANT_RSUN',   959.644);
        // Solar radius in meters (sunpy.sun.constants.radius)
        define('HV_CONSTANT_RSUN_M', 695508000.0);

        // Image compression settings
        // See:
        //   http://www.imagemagick.org/script/command-line-options.php#quality

        // Faster, large files
        define('PNG_LOW_COMPRESSION',   10);
        // Slower, small files
        define('PNG_HIGH_COMPRESSION',  50);

        // Good quality, small files, faster
        define('JPG_HIGH_COMPRESSION',  80);
        // Best quality, large files, slower
        define('JPG_LOW_COMPRESSION',  100);

        // ImageMagick 6.6.2-6 API Version Number
        define('IMAGE_MAGICK_662_VERSION_NUM', 1634);

        // Movie queue throttles for speeding up processing during high-demand
        define('MOVIE_QUEUE_THROTTLE_ONE',  20);
        define('MOVIE_QUEUE_THROTTLE_TWO',  50);
        define('MOVIE_QUEUE_MAX_SIZE',     100);
        define('MOVIE_EST_TIME_PER_FRAME', 0.5);
    }
}
?>