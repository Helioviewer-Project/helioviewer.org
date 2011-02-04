<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie_YouTubeUploader Class Definition
 * 
 * TODO 2011/01/09 Check for other restricted characters ( e.g. < > in description...see reference link below),
 *      word limits (e.g. keywords), etc. 
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
    
    //YouTube Limits (http://code.google.com/apis/youtube/2.0/reference.html#Media_RSS_elements_reference)
    private $_titleMaxLength       = 100;
    private $_descriptionMaxLength = 5000;
    private $_keywordMaxLength     = 30;
    private $_keywordsMaxLength    = 500;
    
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
        $filepath = HV_CACHE_DIR . "/movies/$fileId";
        
        // Optional parameters
        $defaults = array(
            "ready"       => false,
            "dialogMode"  => false,
            "share"       => true,
            "title"       => "",
            "tags"        => "",
            "description" => "This movie was produced by http://www.helioviewer.org. A high quality version of this " .
                             "movie can be downloaded from " . HV_CACHE_URL . "/movies/$fileId ."
        );
        
        $options = array_replace($defaults, $options);
        
        // Redirect URL
        $url = $this->_getPostAuthRedirectURL($fileId, $options);
        
        // Authenticate user
        $this->_authenticate($url);
        
        // Once we have a session token get an AuthSubHttpClient
        $this->_httpClient = Zend_Gdata_AuthSub::getHttpClient($_SESSION['sessionToken']);
        
        // Increase timeout time to prevent client from timing out during uploads
        $this->_httpClient->setConfig(array( 'timeout' => 180 ));
        
        // Creates an instance of the Youtube GData object
        $this->_youTube = $this->_getYoutubeInstance();
        
        // If authentication is expired, reauthenticate
        if (!$this->_authenticationIsValid()) {
            $this->_authenticate($url);
        }

        // Has the form data been submitted?
        if (!$options['ready']) {
            $this->_printForm(
                $fileId, $options['title'], $options['description'], $options['tags'], $options['dialogMode']
            );
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
     * Authenticates Helioviewer to upload videos to the users account
     */
    private function _authenticate($url)
    {
        if (!isset($_SESSION['sessionToken'])) {
            // If no session token exists, check for single-use URL token
            if (isset($_GET['token'])) {
                $_SESSION['sessionToken'] = Zend_Gdata_AuthSub::getAuthSubSessionToken($_GET['token']);
            } else {
                // Otherwise, send user to authorization page
                header("Location: " . $this->_getAuthSubRequestUrl($url));
                exit();
            }
        }
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
        $videoEntry->SetVideoTags($videoInfo['tags']);
    
        // set some developer tags -- this is optional
        // (see Searching by Developer Tags for more details)
        if ($videoInfo['share']) {
            $videoEntry->setVideoDeveloperTags(array('Helioviewer.org'));    
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
     * Constructs the URL that should be used once authentication has been completed to display the upload form
     * 
     * @param string $fileId  Relative path of the file being uploaded
     * @param array  $options Video options
     * 
     * @return string Redirect URL
     */
    private function _getPostAuthRedirectURL($fileId, $options)
    {
        return HV_API_ROOT_URL . "?" . http_build_query(array(
            "action"      => "uploadMovieToYouTube",
            "file"        => $fileId,
            "title"       => $options["title"],
            "description" => $options["description"],
            "tags"        => $options["tags"]
        ));
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
        // TODO check title, desc, keyword length on before making request.
        try {
            $newEntry = $this->_youTube->insertEntry($videoEntry, $this->_uploadURL, 'Zend_Gdata_YouTube_VideoEntry');
        } catch (Zend_Gdata_App_HttpException $httpException) {
            throw($httpException);
        } catch (Zend_Gdata_App_Exception $e) {
            throw($e);
        }
        
        // Update usage stats
        if (HV_ENABLE_STATISTICS_COLLECTION) {
            include_once 'src/Database/Statistics.php';
            $statistics = new Database_Statistics();
            $statistics->log("uploadMovieToYouTube");
        }
        
        //$state = $newEntry->getVideoState();

        echo "Finished!";
    }
    
    /**
     * Displays the YouTube video submission form
     */
    private function _printForm($fileId, $title, $description, $tags, $dialogMode) {
    ?>
<!DOCTYPE html> 
<html> 
<head> 
    <title>Helioviewer.org - YouTube Video Submission</title>
    <link rel='stylesheet' href='resources/css/youtube.css' /> 
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js" type="text/javascript"></script>
    <script type='text/javascript'>
            $(function () {
                var errorMsg, successMsg, errorConsole;

                $("#youtube-video-info").submit(function () {
                    if (formIsValid()) {
                        successMsg = "<div id='success-message'><h1>Finished!</h1>Your video should appear on youtube in 1-2 minutes.</div>";
                        $("#container").empty().html(successMsg);
                        $.post("index.php", $(this).serialize());
                    } else {
                    	errorMsg = "<b>Error:</b> YouTube tags must not be longer than " + <?php echo $this->_keywordMaxLength;?> + " characters each.";
                    	errorConsole = $("#upload-error-console");
                    	errorConsole.html(errorMsg).fadeIn(function () {
							window.setTimeout(function () {
								errorConsole.fadeOut();
				            }, 15000);
						});
                    }
                    return false;   
                });

				// Form validation
				var formIsValid = function() {
					var valid = true, keywordMaxLength = <?php echo $this->_keywordMaxLength;?>;
					
					// Make sure each keyword is 30 characters or less
					$.each($("#youtube-tags").attr('value').split(","), function(i, keyword) {
						if ($.trim(keyword).length > keywordMaxLength) {
							valid = false;
						}
					});

					return valid;
				};
            });
        </script>
</head>
<body<?php if ($dialogMode) {echo " class='dialog-mode'";}?>>
    <div id='container'>
    <img id='youtube-logo' src='../resources/images/Social.me/60 by 60 pixels/youtube.png' alt='YouTube logo' />
    <h1>Upload Video</h1>
    <br />
    <form id="youtube-video-info" action="index.php" method="post">
        <!-- Title -->
        <label for="youtube-title">Title:</label>
        <input id="youtube-title" type="text" name="title" maxlength="<?php echo $this->_titleMaxLength;?>>" value="<?php echo $title;?>" />
        <br />
        
        <!-- Description -->
        <label for="youtube-desc">Description:</label>
        <textarea id="youtube-desc" type="text" rows="5" cols="45" name="description" maxlength="<?php echo $this->_descriptionMaxLength;?>"><?php echo $description;?></textarea>
        <br />
        
        <!-- Tags -->
        <label for="youtube-tags">Tags:</label>
        <input id="youtube-tags" type="text" name="tags" maxlength="<?php echo $this->_keywordsMaxLength;?>" value="Helioviewer.org, <?php echo $tags;?>" />
        <br /><br />
        
        <!-- Sharing -->
        <div style='float: right; margin-right: 30px;'>
        <label style='width: 100%; margin: 0px;'>
        	<input type="checkbox" name="share" value="true" checked="checked" style='width: 15px; float: right; margin: 2px 2px 0 4px;'/>Share my video with other Helioviewer.org users:
        </label>
        <br />
        <input id='youtube-submit-btn' type="submit" value="Submit" />
        </div>
        
        <!-- Hidden fields -->
        <input type="hidden" name="action" value="uploadMovieToYouTube" />
        <input type="hidden" name="ready" value="true" />
        <input type="hidden" name="file" value="<?php echo $fileId; ?>" />
    </form>
    <div id='upload-error-console-container'><div id='upload-error-console'>TEST MESSAGE</div></div>
    </div>
</body>
</html>
    <?php
    }
}
?>
