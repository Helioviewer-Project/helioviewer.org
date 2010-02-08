<?php
class Net_Proxy {
    private $url;
    
    /**
     * @param string url Base URL to query
     */
    public function __construct($baseURL, $queryString) {
        $this->url = $baseURL . $queryString;
    }
	
	public function query($curl = false) {
        
		if ($curl) {
		    // Fetch Results
		    $curl_handle=curl_init();
		    curl_setopt($curl_handle, CURLOPT_URL, $this->url);
		    curl_setopt($curl_handle, CURLOPT_CONNECTTIMEOUT, 30);
		    curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, 1); 
		
		    $results = curl_exec($curl_handle);
		    curl_close($curl_handle);
            return $results;
		}
		else {
			return file_get_contents($this->url);
		}
	}
}
?>