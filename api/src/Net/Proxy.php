<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Net_Proxy Class Definition
 * 
 * PHP version 5
 * 
 * @category Net
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Provides proxy functionality to enable remote AJAX requests and to assist in distributed server-mode.
 * 
 * There are two ways for the request to be redirected: Using file_get_contents to mirror the contents
 * of the remote page, or with cURL. cURL should be used for requests which may take longer since it provides
 * more flexibility with regard to the request timeout length.
 * 
 * @category Net
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Net_Proxy
{
    private $_baseURL;
    
    /**
     * Net_Proxy constructor
     * 
     * @param string $baseURL     Base URL to query
     * @param string $queryString GET query parameters
     */
    public function __construct($baseURL)
    {
        $this->_baseURL = $baseURL;
    }

    /**
     * Queries remote site and displays results
     * 
     * @param bool $curl If true then cURL will be used to send request
     * 
     * @return mixed Contents of mirrored page
     */
    public function query($queryString, $curl = false)
    {
        $queryString = $this->fixQueryString($queryString);
        
        $url = $this->_baseURL . $queryString;

        die($url);
        
        if ($curl) {
            // Fetch Results
            $curl_handle=curl_init();
            curl_setopt($curl_handle, CURLOPT_URL, $url);
            curl_setopt($curl_handle, CURLOPT_CONNECTTIMEOUT, 30);
            curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, 1); 
            
            $results = curl_exec($curl_handle);
            curl_close($curl_handle);
            return $results;
        } else {
            return file_get_contents($url);
        }
    }
    
    /**
     * Escapes special characters 
     * 
     * NOTE: This may not work in all situations.  An ideal solution would split the query
     *       string, only reformatting the values of each parameter.
     *       -Jonathan
     */
    private function fixQueryString($queryString) {
        $queryString = str_replace(":", "%3A", $queryString);
        $queryString = str_replace("+", "%2B", $queryString);
        $queryString = str_replace(" ", "+", $queryString);
        
        return $queryString;
    }
}
?>
