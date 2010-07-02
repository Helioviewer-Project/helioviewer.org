<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer SolarEvents Module class definition.
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once "interface.Module.php";

/**
 * Defines methods used by Helioviewer.org to interact with a JPEG 2000 archive.
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_SolarEvents implements Module
{
    private $_params;

    /**
     * Constructor
     *
     * @param mixed &$params API Request parameters, including the action name.
     *
     * @return void
     */
    public function __construct(&$params)
    {
        $this->_params = $params;
    }

    /**
     * execute
     *
     * @return void
     */
    public function execute()
    {
        if ($this->validate()) {
            try {
                $this->{$this->_params['action']}();
            } catch (Exception $e) {
                // Output plain-text for browser requests to make Firebug debugging easier
                include_once "lib/FirePHPCore/fb.php";
                FB::error($e->getMessage());
                throw new Exception($e->getMessage());
            }
        }
    }

    /**
     * Gets a JSON-formatted list of the Feature Recognition Methods which have 
     * associated events for the requested time window, sorted by event type
     * 
     * @return void
     */
    public function  getEventFRMs()
    {
        include_once "src/Event/HEKAdapter.php";
        
        $hek = new Event_HEKAdapter();
        
        header("Content-type: application/json");
        echo $hek->getFRMs($this->_params['startDate'], $this->_params['endDate']);
    }
    
    /**
     * Gets a JSON-formatted list of Features/Events for the requested time range and FRMs 
     *
     * @return void
     */
    public function getEvents()
    {
        include_once "src/Event/HEKAdapter.php";

    }
    
    /**
     * validate
     *
     * @return bool Returns true if input parameters are valid
     */
    public function validate()
    {
        switch($this->_params['action'])
        {
        case "getEvents":
            $expected = array(
                "required" => array('startDate', 'endDate'),
                "dates"    => array('startDate', 'endDate')
            );
            break;
        case "getEventFRMs":
            $expected = array(
               "required" => array('startDate', 'endDate'),
               "dates"    => array('startDate', 'endDate')
            );
            break;
        default:
            break;
        }

        // Check input
        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params);
        }

        return true;
    }
    
    /**
     * Prints the module's documentation header
     * 
     * @return void
     */
    public static function printDocHeader()
    {
        ?>
            <li>
                <a href="index.php#FeatureEventAPI">Features/Events</a>
                <ul>
                    <li><a href="index.php#getEventFRMs">Feature Recognition Methods (FRMs)</a></li>
                    <li><a href="index.php#getEvents">Finding Events</a></li>
                </ul>
            </li>
        <?php
    }
    
    /**
     * printDoc
     *
     * @return void
     */
    public static function printDoc()
    {
        $baseURL = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
        ?>
        <!-- Feature/Event API -->
        <div id="FeatureEventAPI">
            <h1>Feature/Event API:</h1>
            <p>There are two ways to use Helioviewer's Feature/Event API. The first is to query the available Feature 
            Recognition Methods (FRM), and then query for specific features/events within each FRM. The second method is to go
            straight to querying for features/events, skipping the FRM step. <!-- This requires that you already know the 
            identifiers for each specific catalog you wish you query.-->Both steps are described below.</p>
            <ol style="list-style-type: upper-latin;">
            
                <!-- Catalog API -->
                <li>
                <div id="getEventFRMs">Event Feature Recognition Methods (FRM):
                <p>To query the list of available FRMs, simply call the "getEventFRMs" and specify a startDate and endDate. 
                This will return a list of the FRMs for which event data exists in the requested time range, as well as some 
                meta-information describing each of the catalogs. <!--The most important parameters returned are the "id", 
                the identifier used to query the specific catalog for features/events, and "eventType" which specified 
                the type of feature/event the catalog described, e.g. "CME" or "Active Region." --></p>
        
                <br />
        
                <div class="summary-box">
                <span style="text-decoration: underline;">Usage:</span>
        
                <br />
                <br />
                <a href="<?php echo $baseURL;?>?action=getEventCatalogs">
                    <?php echo $baseURL;?>?action=getEventFRMs
                </a>
        
                <br /><br />
                Result:
                <br /><br />
        
                An array of catalog objects is returned formatted as JSON. Each catalog object includes the following
                six parameters:
        
                <!-- Feature/Event Catalog Parameter Description -->
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="25%"><b>adjustRotation</b></td>
                            <td width="15%"><i>Boolean</i></td>
                            <td>Specifies whether the position of the events has been adjusted to account for solar
                            rotation.</td>
                        </tr>
                        <tr>
                            <td><b>coordinateSystem</b></td>
                            <td><i>String</i></td>
                            <td>The type of coordinate system used by the catalog provider. Recognized coordinate systems
                            include "HELIOGRAPHIC," "PRINCIPAL_ANGLE," and "ANGULAR."</td>
                        </tr>
                        <tr>
                            <td><b>description</b></td>
                            <td><i>String</i></td>
                            <td>A brief human-readable description of the catalog.</td>
                        </tr>
                        <tr>
                            <td><b>eventType</b></td>
                            <td><i>String</i></td>
                            <td>The type of event described. See <a href="index.html#Identifiers">Appendix A</a> for a list of
                            the supported event types.</td>
                        </tr>
                        <tr>
                            <td><b>id</b></td>
                            <td><i>String</i></td>
                            <td>The identifier for a specific catalog. The identifier consists of two parts separate by
                            double-colons. The left-side of the double-colons identifies the catalog provider, which may be
                            the same for several catalogs. The right-side identifies the specific catalog.</td>
                        </tr>
                        <tr>
                            <td><b>name</b></td>
                            <td><i>String</i></td>
                            <td>A human-readable name for the catalog.</td>
                        </tr>
                    </tbody>
                </table>
        
                </div>
        
                <br />
            
            <!-- Catalog API Notes -->
            <div class="summary-box" style="background-color: #E3EFFF;">
            <span style="text-decoration: underline;">Notes:</span>
            <br />
            <br />
            <ul>
                <li>
                <p>Refer to the table in the following section, <a href="index.html#CatalogEntries">Catalog Entries</a>
                for the specific IDs used.</p>
                </li>
                <li>
                <p>Results are returned as <abbr name="JSON" title="JavaScript Object Notation">JSON</abbr>. Future versions
                will provide the ability to request results in either JSON or VOEvent format.</p>
                </li>
            </ul>
            </div>
        
            </div>
            </li>
        
            <br />
        </div>
        <?php
    }
}
?>