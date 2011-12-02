<?php
/**
* Database Information
*/
define("HV_DB_HOST", "localhost");
define("HV_DB_NAME", "helioviewer");
define("HV_DB_USER", "helioviewer");
define("HV_DB_PASS", "helioviewer");

/**
 * In order to enable users to submit videos to YouTube, you must register for
 * a developer key which is included with each request. For more information
 * and to request a key, see:
 * http://code.google.com/apis/youtube/overview.html
 */
define("HV_YOUTUBE_DEVELOPER_KEY", "");

/**
 * Password to use when generating unique movie IDs. This can be any random
 * string, e.g. "8sHNa4ju". It is used during hashing to create public
 * video id's that can be used for sharing.
 */
define("HV_MOVIE_ID_PASS", "");

/**
 * bit.ly API user and key
 * 
 * This is used to shorten Helioviewer.org URLs for easier sharing on
 * Twitter etc. For more information and to register for a free API key, see:
 * http://code.google.com/p/bitly-api/wiki/ApiDocumentation
 */
define("HV_BITLY_USER", "");
define("HV_BITLY_API_KEY", "");

?>
