<?php

error_reporting(E_ALL | E_STRICT | E_NOTICE);
require_once("interface.Module.php");

class Helper
{
/*
    private $params;
    private $format;
    private $module;
    
     *
     * @param array An array of parameters relevant to the API call
     * @param string ["plain-text"|"json"] The format to return results in
     *
    
    public function __construct ($params, $format)
    {
        $this->params  = $params;
        $this->format  = $format;

        require_once('Config.php');
        new Config("../settings/Config.ini");

    }

    public function execute() 
    {
        require_once($this->module . ".php");
        
        switch($this->module) {
            case "WebClient":
                $mod = new WebClient($this->params);
                break;
        }
    }

    public function validate() 
    {
        foreach($this->actions as $action=>$module) {
            if($this->params['action'] == $action) {
                $this->module = $module;
                return true;
            }
        }
        return false;
    }
    
    public function printDoc() 
    {
        
    }
*/
    /**
     * @description Checks to make sure all required parameters were passed in.
     * @param {Array} $fields is an array containing any required fields, such as 'layers', 'zoomLevel', etc.
     * @return 1 on success
     */
    public static function checkForMissingParams($fields, $params) {
        try {
            foreach($fields as $field) {
                if(empty($params[$field])) {
                    throw new Exception("Invalid value for $field.");
                }
            }
        }
        catch (Exception $e) {
            echo 'Error: ' . $e->getMessage();
            exit();
        }
        return 1;
    }

    /**
     * Typecast boolean strings or unset optional params to booleans
     *
     */
    private static function fixBools($fields) {
        foreach($fields as $field) {
            if (!isset($this->params[$field]))
            $this->params[$field] = false;
            else {
                if (strtolower($this->params[$field]) === "true")
                $this->params[$field] = true;
                else
                $this->params[$field] = false;
            }
        }

        return 1;
    }

}

?>