<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie_YouTubeUploader Class Definition
 * 
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Uploads user-created movies to YouTube
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_YouTubeUploader
{
    private $_appId;
    private $_clientId;
    private $_testURL;
    private $_uploadURL;
    private $_httpClient;
    private $_youTube;
    
    /**
     * Creates a new YouTubeUploader instance
     *
     * @return void
     */
    public function __construct()
    {
        require_once 'Zend/Loader.php';
        Zend_Loader::loadClass('Zend_Gdata_AuthSub');
        
        $this->_appId     = "Helioviewer.org User Video Uploader";
        $this->_clientId  = "Helioviewer.org (2.1.0)";

        $this->_testURL   = "http://gdata.youtube.com/feeds/api/users/default/uploads?max-results=1";
        $this->_uploadURL = "http://uploads.gdata.youtube.com/feeds/api/users/default/uploads";
        
        session_start();
    }
    
    /**
     * Authenticates user and uploads video to YouTube
     * 
     * @param string $fileId    Relative path (uuid/filename.ext) to the file to be uploaded
     * @param array  $videoInfo Video information including the video title, description, tags and sharing.
     * 
     * Currently the video upload process occurs in 2-3 steps, depending on whether the site has already
     * been authorized or not:
     * 
     *  1) If the user has not been authorized, redirect to YouTube authorization page
     *  2) Display video description form
     *  3) Process submitted video form items and upload movie
     */
    public function uploadVideo($fileId, $options)
    {
        $filepath  = HV_CACHE_DIR . "/movies/$fileId";
        
        // Authenticate user
        $this->_authenticate($fileId);
        
        // Once we have a session token get an AuthSubHttpClient
        $this->_httpClient = Zend_Gdata_AuthSub::getHttpClient($_SESSION['sessionToken']);
        
        // Creates an instance of the Youtube GData object
        $this->_youTube = $this->_getYoutubeInstance();
        
        // Make sure authentication is not expired
        if (!$this->_authenticationIsValid()) {
            $this->_authenticate($fileId);
        }

        // Has the form data been submitted?
        if (!isset($options['ready'])) {
            $this->_printForm("index.php", $fileId);
            return;
        }

        $videoEntry = $this->_createGDataVideoEntry($filepath, $options);

        $this->_uploadVideoToYouTube($videoEntry);
    }
    
    /**
     * Checks to see if a user is Helioveiwer.org is currently authorized to interact with a user's YouTube account.
     */
    public function checkYouTubeAuth() {
        if (!isset($_SESSION['sessionToken'])) {
            return false;
        }
        
        $this->_httpClient = Zend_Gdata_AuthSub::getHttpClient($_SESSION['sessionToken']);

        $this->_youTube    = $this->_getYoutubeInstance();
        return $this->_authenticationIsValid();
    }
    
    /**
     * Checks to see if the user is currently authenticated, and that any previous authentication is not expired
     * 
     * @return bool Returns true if the user is authenticated and that authentication is still good, and false otherwise
     */
    private function _authenticationIsValid()
    {
        // Attempt a simple query to make sure session token has not expired
        try {
            $this->_youTube->getVideoFeed($this->_testURL);
        } catch (Exception $e) { //Zend_Gdata_App_HttpException
            unset($_SESSION['sessionToken']); // Discard expired authentication
            return false;
        }
        return true;
    }
    
    /**
     * Authenticates Helioviewer to upload videos to the users account
     */
    private function _authenticate($file)
    {
        if (!isset($_SESSION['sessionToken'])) {
            // If no session token exists, check for single-use URL token
            if (isset($_GET['token'])) {
                // If a single use token exists, trade it in for a session token 
                $_SESSION['sessionToken'] = Zend_Gdata_AuthSub::getAuthSubSessionToken($_GET['token']);   
            } else {
                // Otherwise, send user to authorization page
                header("Location: " . $this->_getAuthSubRequestUrl($file));
                exit();
            }
        }
    }

    /**
     * Creates an instance of a Zend_Gdata_YouTube_VideoEntry using the user-submitted values
     */
    private function _createGDataVideoEntry($filepath, $videoInfo)
    {
        // Create a new VideoEntry object
        $videoEntry = new Zend_Gdata_YouTube_VideoEntry();
        
        // Create a new FileSource object
        $fileSource = $this->_createMediaFileSource($filepath);
        
        // add the filesource to the video entry
        $videoEntry->setMediaSource($fileSource);
    
        $videoEntry->setVideoTitle($videoInfo['title']);
        $videoEntry->setVideoDescription($videoInfo['description']);
        $videoEntry->setVideoCategory('Tech');
    
        // Set keywords. Please note that this must be a comma-separated string
        // and that individual keywords cannot contain whitespace
        $videoEntry->SetVideoTags('Helioviewer.org, ' . $videoInfo['tags']); // ADD Observatory, detectors, etc
    
        // set some developer tags -- this is optional
        // (see Searching by Developer Tags for more details)
        if ($videoInfo['share']) {
            $videoEntry->setVideoDeveloperTags(array('helioviewer.org'));    
        }

        return $videoEntry;
    }
    
    /**
     * Creates an instance of a Zend_Gdata_App_MediaFileSource
     */
    private function _createMediaFileSource($filepath) {
        // Create a new Zend_Gdata_App_MediaFileSource object
        $filesource = $this->_youTube->newMediaFileSource($filepath);
        $filesource->setContentType('video/mp4');
    
        // Set slug header
        // http://code.google.com/apis/youtube/2.0/developers_guide_protocol_captions.html#Create_Caption_Track
        $filesource->setSlug($filepath);
        
        return $filesource;
    }

    /** 
     * Gets a Authorization link
     */
    private function _getAuthSubRequestUrl($file)
    {
        $url = HV_API_ROOT_URL . "?action=uploadMovieToYouTube&file=$file";
        return Zend_Gdata_AuthSub::getAuthSubTokenUri($url, "http://gdata.youtube.com", false, true);
    }
    
    /**
     * Initializes a YouTube GData object instance
     */
    private function _getYoutubeInstance()
    {
        // Load YouTube class
        Zend_Loader::loadClass('Zend_Gdata_YouTube');
        
        // Instantiate Youtube object
        $yt = new Zend_Gdata_YouTube($this->_httpClient, $this->_appId, $this->_clientId, HV_YOUTUBE_DEVELOPER_KEY);
        $yt->setMajorProtocolVersion(2); // Use API version 2
        
        return $yt;
    }
    
    /**
     * Uploads a single video to YouTube
     * 
     * @param Zend_Gdata_YouTube_VideoEntry $videoEntry A video entry object describing the video to be uploaded
     * 
     * @return void
     */
    private function _uploadVideoToYouTube ($videoEntry)
    {
        try {
            $newEntry = $this->_youTube->insertEntry($videoEntry, $this->_uploadURL, 'Zend_Gdata_YouTube_VideoEntry');
        } catch (Zend_Gdata_App_HttpException $httpException) {
            echo $httpException->getRawResponseBody();
        } catch (Zend_Gdata_App_Exception $e) {
            echo $e->getMessage();
        }
        
        $state = $newEntry->getVideoState();

        echo "Finished!";
    }
    
    /**
     * Displays the YouTube video submission form
     * 
     * TODO 2010/01/04: Offer user pre-filled title, description, and tags?
     *                  E.g.: "Helioveiwer.org: SDO AIA 171 (January 04th, 01:29:04 UTC)"
     *                  Could even offer multiple formats for title, subsets of keywords, etc
     */
    private function _printForm($url, $fileId) {
    ?>
<!DOCTYPE html> 
<html> 
<head> 
    <title>Helioviewer.org - YouTube Video Submission</title>
    <style type='text/css'>
        body { background-color: transparent; color: white; text-align: left;}
        #youtube-video-info label {
            width: 18%;
            display: inline-block;
            text-align: right;
            vertical-align: top;
            margin: 5px 5px 0 0;
        }
        
        #youtube-video-info input, #youtube-video-info textarea {
            margin-top: 5px;
            width: 75%;
        }
        
        #youtube-video-info #youtube-submit-btn {
            position: absolute;
            right: 30px;
            width: 70px;
        }
    </style>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js" type="text/javascript"></script>
    <script type='text/javascript'>
            $(function () {
                $("#youtube-video-info").submit(function () {
                    $("body").empty().html("<h1>Finished!</h1>Your video should appear on youtube in 1-2 minutes.");
                    $.post("index.php", $(this).serialize());
                    return false;    
                });
            });
        </script>
</head>
<body>
    <img src='../resources/images/Social.me/60 by 60 pixels/youtube.png' alt='YouTube logo' style="float: left; margin-right: 8px" />
    <h1>Upload Video</h1>
    <br />
    <form id="youtube-video-info" action="<?php echo $url; ?>" method="post">
        <!-- Title -->
        <label for="youtube-title">Title:</label>
        <input id="youtube-title" type="text" name="title" placeholder="Your video title" />
        <br />
        
        <!-- Description -->
        <label for="youtube-desc">Description:</label>
        <textarea id="youtube-desc" type="text" rows="5" cols="45" name="description" placeholder="Description of the video you are uploading"></textarea>
        <br />
        
        <!-- Tags -->
        <label for="youtube-tags">Tags:</label>
        <input id="youtube-tags" type="text" name="tags" placeholder="Tags (example: Sun, SDO, AIA, Flare).. Choose for user???" />
        <br /><br />
        
        <!-- Sharing -->
        <div style='position: absolute; right: 30px;'>
        Share my video with other Helioviewer.org users:
        <input type="checkbox" name="share" value="true" checked="checked" />
        </div>
        <br />
        
        <!-- Hidden fields -->
        <input type="hidden" name="action" value="uploadMovieToYouTube" />
        <input type="hidden" name="ready" value="true" />
        <input type="hidden" name="file" value="<?php echo $fileId; ?>" />
    <input id='youtube-submit-btn' type="submit" value="Submit" />
    </form>
</body>
</html>
    <?php
    }
}
?>
