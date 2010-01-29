<?php

require_once("interface.Module.php");

class Events implements Module
{
    private $params;

    public function __construct(&$params)
    {
        require_once("Helper.php");
        $this->params = $params;


        $this->execute();

    }

    public function execute()
    {
        if($this->validate())
        {
            $this->{$this->params['action']}();
        }
    }

    public function validate()
    {
        switch($this->params['action'])
        {
            case "getEvents":
                Helper::checkForMissingParams(array('date','windowSize','catalogs'), $this->params);
                break;
            case "getEventCatalogs":
                break;
            default:
                throw new Exception("Invalid action specified. See the <a href='http://www.helioviewer.org/api/'>API Documentation</a> for a list of valid actions.");
        }
        return true;
    }

    public static function printDoc()
    {

    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function getEvents () {
        header("Content-type: application/json");
        $url = HV_EVENT_SERVER_URL . "action=getEvents&date=" . $this->params["date"] . "&windowSize=" . $this->params["windowSize"] . "&catalogs=" . $this->params["catalogs"];
        echo file_get_contents($url);
        return 1;
    }

    /**
     * @return int Returns "1" if the action was completed successfully.
     */
    private function getEventCatalogs () {
        header("Content-type: application/json");
        $url = HV_EVENT_SERVER_URL . "action=getEventCatalogs";
        echo file_get_contents($url);
        return 1;
    }
}

?>