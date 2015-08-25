<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Serialize Class definition
 * Provides reading, writing, and invalidating Serilized cache files.
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     https://github.com/Helioviewer-Project
 */

class Helper_Serialize {

    private $_path;
    private $_filename;
    private $_maxAgeSec;

    /**
     * Constructor method
     *
     * @return void
     */
    public function __construct($subPath, $filename, $maxAgeSec=86000) {
        $this->_path      = HV_CACHE_DIR.'/'.$subPath;
        $this->_filename  = $filename;
        $this->_maxAgeSec = $maxAgeSec;

        // Verify that cache directory exists
        if ( !@file_exists($this->_path) ) {
            if ( !@mkdir($this->_path, 0777, true) ) {
               return false;
            }
        }

    }

    /**
     * Read cache file from disk and return un-serialized data structure.
     * Optionally invalidate cache file if older than _maxAgeSec.
     *
     * @return array on success, boolean false on error
     */
    public function readCache($verifyAge=true) {

        // Optionally invalidate cache if _maxAgeSec has been exceeded
        if ( $verifyAge === true ) {

            clearstatcache(true, $this->_path.'/'.$this->_filename);
            $timestamp = @filemtime($this->_path.'/'.$this->_filename);

            if ( $timestamp === false ||
                 (microtime(true)-(float)$timestamp) > (float)$this->_maxAgeSec ) {

                @unlink($this->_path.'/'.$this->_filename);
                return false;
            }
        }

        // Read serialized data from cache file
        $serialized = @file_get_contents($this->_path.'/'.$this->_filename);

        if ( $serialized === false ) {
            @unlink($this->_path.'/'.$this->_filename);
            return false;
        }

        // Un-serialize data
        $data = unserialize($serialized);
        if ( $data === null ) {
            @unlink($this->_path.'/'.$this->_filename);
            return false;
        }

        return $data;
    }

    /**
     * Write serialized data to cache file.
     * Optionally that caching succeeded by immediately reading in cached data
     * and attempting to un-serialize it.
     *
     * @return boolean
     */
    public function writeCache($data, $verify=false) {

        $serialized = serialize($data);
        if ( $serialized === false ) {

            return false;
        }

        // Write data to a temporary file first
        $temp_filename = md5($serialized).'_'.microtime(true);

        $fh = @fopen($this->_path.'/'.$temp_filename, 'w');
        if ( $fh === false ) {
            return false;
        }
        if ( !@fwrite($fh, $serialized) ) {
            @fclose($fh);
            @unlink($this->_path.'/'.$temp_filename);
            return false;
        }
        @fclose($fh);

        // Move temporary file into permanent location
        if ( !@rename($this->_path.'/'.$temp_filename, $this->_path.'/'.$this->_filename) ) {

            @unlink($this->_path.'/'.$temp_filename);
            return false;
        }
        clearstatcache(true, $this->_path.'/'.$this->_filename);

        // Optionally verify that cache file was written and installed
        // successfully by explicitly reading it back from disk and checking
        // that it the data it contains can be un-serialized.
        if ( $verify === true ) {
            if ( $this->readCache($verifyAge=false) === false ) {
                return false;
            }
        }

        return true;
    }

}
?>