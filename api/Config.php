<?php
class Config {        
    private $bools  = array("distributed_tiling_enabled", "backup_enabled", "enable_cache");
    private $ints   = array("build_num", "default_zoom_level", "default_timestep", "min_zoom_level", "max_zoom_level", "prefetch_size",
                            "png_compression_quality", "jpeg_compression_quality", "bit_depth", "num_colors", "tile_pad_width", 
                            "max_movie_frames", "base_zoom_level");
    private $floats = array("base_image_scale");
    
    public function __construct($file) {
        $this->config = parse_ini_file($file);
        $this->fixTypes();
        
        foreach($this->config as $key => $value)
            define("HV_" . strtoupper($key), $value);
            
        $dbconfig = substr($file, 0, strripos($file, "/")) . "/Database.php";
        require_once($dbconfig);
        
        $this->setAdditionalParams();
    }
    
    /**
     * Casts known configuration variables to correct types.
     * @return 
     */
    private function fixTypes() {
        // booleans
        foreach($this->bools as $boolean)
            $this->config[$boolean] = (bool) $this->config[$boolean];
            
        // integers
        foreach($this->ints as $int)
            $this->config[$int] = (int) $this->config[$int];
        
        // floats
        foreach($this->floats as $float)
            $this->config[$float] = (float) $this->config[$float];
    }
    
    /**
     * Some useful values can be determined automatically...
     * @return 
     */
    private function setAdditionalParams() {
        //define("HV_ROOT_DIR", substr(getcwd(), 0, -4));
        define("HV_TMP_ROOT_DIR", HV_ROOT_DIR . "/tmp");
        define("HV_CACHE_DIR",    HV_ROOT_DIR . "/cache");
        define("HV_ERROR_LOG",    HV_ROOT_DIR . "/log/error");
        define("HV_EMPTY_TILE",   HV_ROOT_DIR . "/images/transparent_512.png");
        //define("HV_WEB_ROOT_URL", "http://" . $_SERVER["SERVER_NAME"] . substr($_SERVER["SCRIPT_NAME"], 0, -14));
        define("HV_TMP_ROOT_URL", HV_WEB_ROOT_URL . "/tmp");
    }
}
?>