<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie_YouTube Class Definition
 * 
 * TODO 2011/01/09 Check for other restricted characters (e.g. '<' and '>')
 * word limits (e.g. keywords), etc. See reference below. 
 *       
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
class Movie_YouTube
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
    private $_keywordMinLength     = 2;
    private $_keywordMaxLength     = 30;
    private $_keywordsMaxLength    = 500;
    
    /**
     * Creates a new YouTube instance
     *
     * @return void
     */
    public function __construct()
    {
        include_once 'Zend/Loader.php';
        Zend_Loader::loadClass('Zend_Gdata_AuthSub');
        
        $this->_appId     = "Helioviewer.org User Video Uploader";
        $this->_clientId  = "Helioviewer.org (2.2.0)";

        $this->_testURL   = "http://gdata.youtube.com/feeds/api/users/default/uploads?max-results=1";
        $this->_uploadURL = "http://uploads.gdata.youtube.com/feeds/api/users/default/uploads";
        
        session_start();
    }
    
    /**
     * Authenticates user and uploads video to YouTube
     * 
     * @param string $id      Public id of the video to be uploaded
     * @param array  $options Video information including the video title, description, tags and sharing.
     * 
     * Currently the video upload process occurs in 2-3 steps, depending on whether the site has already
     * been authorized or not:
     * 
     *  1) If the user has not been authorized, redirect to YouTube authorization page
     *  2) Display video description form
     *  3) Process submitted video form items and upload movie
     * 
     * @return void
     */
    public function uploadVideo($id, $filepath, $options)
    {
        // Optional parameters
        $defaults = array(
            "ready"       => false,
            "dialogMode"  => false,
            "share"       => false,
            "title"       => "",
            "tags"        => "",
            "description" => "This movie was produced by Helioviewer.org. " .
                             "A high quality version of this movie can be " .
                             "downloaded from " . HV_API_ROOT_URL . 
                             "?action=downloadMovie&id=$id&format=mp4&hq=true"
        );
        
        $options = array_replace($defaults, $options);
        
        // Redirect URL
        $url = $this->_getPostAuthRedirectURL($id, $options);
        
        // Authenticate user
        $this->_authenticate($url);
        
        // Has the form data been submitted?
        if (!$options['ready']) {
            $this->_printForm(
                $id, $options['title'], $options['description'], $options['tags'], $options['dialogMode']
            );
            return;
        }
        
        // Once we have a session token get an AuthSubHttpClient
        $this->_httpClient = Zend_Gdata_AuthSub::getHttpClient($_SESSION['sessionToken']);
        
        // Increase timeout time to prevent client from timing out during uploads
        $this->_httpClient->setConfig(array( 'timeout' => 300 ));
        
        // Creates an instance of the Youtube GData object
        $this->_youTube = $this->_getYoutubeInstance();
        
        // If authentication is expired, reauthenticate
        if (!$this->_authenticationIsValid()) {
            $this->_authenticate($url);
        }

        $videoEntry = $this->_createGDataVideoEntry($filepath, $options);

        $this->_uploadVideoToYouTube($id, $options, $videoEntry);
    }
    
    /**
     * Checks to see if a user is Helioveiwer.org is currently authorized to interact with a user's YouTube account.
     * 
     * @return bool Returns true if the user has been authenticated by YouTube
     */
    public function checkYouTubeAuth()
    {
        if (!isset($_SESSION['sessionToken'])) {
            return false;
        }
        
        $this->_httpClient = Zend_Gdata_AuthSub::getHttpClient($_SESSION['sessionToken']);
        $this->_youTube    = $this->_getYoutubeInstance();

        return $this->_authenticationIsValid();
    }
    
    /**
     * Returns a list of videos uploaded to YouTube by Helioviewer.org users
     * 
     * @param int $pageSize The number of results to be included in a single page.
     * @param int $pageNum  The current page of results to display
     * 
     * @return array An array of associative arrays containing properties of movies uploaded to YouTube
     * by Helioviewer.org users.
     */
    public function getUserVideos($pageSize, $pageNum)
    {
        Zend_Loader::loadClass('Zend_Gdata_YouTube');
        
        $yt = new Zend_Gdata_YouTube(null, null, null, HV_YOUTUBE_DEVELOPER_KEY);
        $yt->setMajorProtocolVersion(2);
        
        // Current page
        $startIndex = 1 + ($pageSize * ($pageNum - 1));
        
        // URL to query
        $url = 'http://gdata.youtube.com/feeds/api/videos/-/%7Bhttp%3A%2F%2Fgdata.youtube.com' .
               '%2Fschemas%2F2007%2Fdevelopertags.cat%7D' . "Helioviewer.org?orderby=published&start-index=$startIndex&max-results=$pageSize&safeSearch=strict";
        
        // Collect videos from the feed
        $videos = array();
        
        // Process video entries
        foreach ($yt->getVideoFeed($url) as $videoEntry) {
            $id = $videoEntry->getVideoId();

            // Check to make sure video was not removed by the user
            // 2011/06/08: Disabling for now since this delays time before videos
            // show up on site
            // $handle = curl_init("http://gdata.youtube.com/feeds/api/videos/$id?v=2");
            // curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
//             
            // $response = curl_exec($handle);
            // $httpCode = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            //curl_close($handle);

            // Only add videos with response code 200
            //if ($httpCode == 200) {
            array_push(
                $videos, array(
                    "id"      => $id,
                    "watch"   => $videoEntry->getVideoWatchPageUrl(),
                    "flash"   => $videoEntry->getFlashPlayerUrl(),
                    "thumbnails" => $videoEntry->getVideoThumbnails(),
                    "published"  => $videoEntry->getPublished()->getText()
                )
            );
            //}
        }
        
        return $videos;
    }
    
    /**
     * Authenticates Helioviewer to upload videos to the users account.
     * 
     * Function first checks to see if a session token already exists. If none
     * is found, the user is either redirected to an authentication URL, or
     * if stores sessions token if it was just retrieved.     * 
     * 
     * @param string $url Upload query URL
     * 
     * @return void
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
     * @return bool Returns true if the user is authenticated and that 
     * authentication is still good, and false otherwise
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
     * 
     * @param string $filepath  Path to the video
     * @param array  $videoInfo Array containing user choices for title, description, etc.
     * 
     * @return Zend_Gdata_YouTube_VideoEntry Video entry
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
     * 
     * @param string $filepath Path of the video file
     * 
     * @return Zend_Gdata_App_MediaFileSource media source associated with the video to be uploaded
     */
    private function _createMediaFileSource($filepath)
    {
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
     * 
     * TODO: 2011/06/01 Is $file still being passed around?
     * 
     * @param string $file Filepath for video to be uploaded
     * 
     * @return string YouTube Authentication URL
     */
    private function _getAuthSubRequestUrl($file)
    {
        $url = HV_API_ROOT_URL . "?action=uploadMovieToYouTube&file=$file";
        return Zend_Gdata_AuthSub::getAuthSubTokenUri($url, "http://gdata.youtube.com", false, true);
    }
    
    /**
     * Constructs the URL that should be used once authentication has been completed to display the upload form
     * 
     * @param string $id      Video ID
     * @param array  $options Video options
     * 
     * @return string Redirect URL
     */
    private function _getPostAuthRedirectURL($id, $options)
    {
        return HV_API_ROOT_URL . "?" . http_build_query(
            array(
                "action"      => "uploadMovieToYouTube",
                "id"          => $id,
                "title"       => $options["title"],
                "description" => $options["description"],
                "tags"        => $options["tags"]
            )
        );
    }
    
    /**
     * Initializes a YouTube GData object instance
     * 
     * @return Zend_Gdata_YouTube A YouTube object instance
     */
    private function _getYoutubeInstance()
    {
        // Load YouTube class
        Zend_Loader::loadClass('Zend_Gdata_YouTube');
        
        // Instantiate Youtube object
        $yt = new Zend_Gdata_YouTube(
            $this->_httpClient, $this->_appId, $this->_clientId, 
            HV_YOUTUBE_DEVELOPER_KEY
        );
        $yt->setMajorProtocolVersion(2); // Use API version 2
        
        return $yt;
    }
    
    /**
     * Uploads a single video to YouTube
     * 
     * @param int                           $id         Movie id
     * @param array                         $options    Movie options
     * @param Zend_Gdata_YouTube_VideoEntry $videoEntry A video entry object 
     * describing the video to be uploaded
     * 
     * @return void
     */
    private function _uploadVideoToYouTube ($id, $options, $videoEntry)
    {
        try {
            $newEntry = $this->_youTube->insertEntry(
                $videoEntry, $this->_uploadURL, 'Zend_Gdata_YouTube_VideoEntry'
            );
        } catch (Zend_Gdata_App_HttpException $httpException) {
            throw($httpException);
        } catch (Zend_Gdata_App_Exception $e) {
            throw($e);
        }

        // http://www.youtube.com/watch?v=DoBgczEScvE&feature=youtube_gdata_player        
        $newEntry->setMajorProtocolVersion(2);
        $youtubeId = $newEntry->getVideoId();
        
        // Add entry to YouTube table
        include_once 'src/Database/MovieDatabase.php';
        include_once 'lib/alphaID/alphaID.php';
        
        $movieId = alphaID($id, true, 5, HV_MOVIE_ID_PASS);
        
        $movies = new Database_MovieDatabase();
        $movies->insertYouTubeMovie(
            $movieId, $youtubeId, $options['title'], 
            $options['description'], $options['tags'], $options['share']
        );

        echo "Finished!";
    }
    
    /**
     * Displays the YouTube video submission form
     * 
     * @param string $id          Video ID
     * @param string $title       Text to display in the title field
     * @param string $description Text to display in the description field
     * @param string $tags        Text to display in the keywords field
     * @param bool   $dialogMode  Whether or not to style the form for use inside a dialog on Helioviewer.org
     * 
     * @return void
     */
    private function _printForm($id, $title, $description, $tags, $dialogMode)
    {
        ?>
        <!DOCTYPE html> 
        <html> 
        <head> 
            <title>Helioviewer.org - YouTube Video Submission</title>
            <link rel='stylesheet' href='resources/css/youtube.css' /> 
            <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js" 
                type="text/javascript"></script>
            <script type='text/javascript'>
                    $(function () {
                        var successMsg, errorConsole;
        
                        // Validate and submit form
                        $("#youtube-video-info").submit(function () {
                            try {
                                validateForm();
                            } catch (ex) {
                            	errorConsole = $("#upload-error-console");
                            	errorConsole.html("<b>Error:</b> " + ex).fadeIn(function () {
        							window.setTimeout(function () {
        								errorConsole.fadeOut();
        				            }, 15000);
        						});
        						return false;
                            }
        
                            // If input looks good, submit request to YouTube and let user know
                            successMsg = "<div id='success-message'><h1>Finished!</h1>Your video should appear on youtube in 1-2 minutes.</div>";
                            $("#container").empty().html(successMsg);
                            $.post("index.php", $(this).serialize());
        
                            return false;   
                        });
        
        				// Form validation
        				var validateForm = function() {
        					var keywords         = $("#youtube-tags").attr('value'),
        						keywordMinLength = <?php echo $this->_keywordMinLength;?>,
        						keywordMaxLength = <?php echo $this->_keywordMaxLength;?>;
        
        					// User must specify at least one keyword
        					if (keywords.length === 0) {
        						throw "You must specifiy at least one tag for your video.";
        						return;
        					}
        					
        					// Make sure each keywords are between 2 and 30 characters each
        					$.each(keywords.split(","), function(i, keyword) {
        						var len = $.trim(keyword).length;
        
        						if (len > keywordMaxLength) {
        							throw "YouTube tags must not be longer than " + keywordMaxLength + " characters each.";
        						} else if (len < keywordMinLength) {
        							throw "YouTube tags must be at least " + keywordMinLength + " characters each.";
        						}
        						return;						
        					});
        
        					// < and > are not allowed in title, description or keywords
        					$.each($("input[type='text'], textarea"), function (i, input) {
        						if ($(input).attr('value').match(/[<>]/)) {
        							throw "< and > characters are not allowed";
        						}
        						return;
        					});
        				};
                    });
                </script>
        </head>
        <body
        <?php
        if ($dialogMode) {
            echo " class='dialog-mode'";
        }
        ?>>
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
                <input type="hidden" name="id" value="<?php echo $id; ?>" />
            </form>
            <div id='upload-error-console-container'><div id='upload-error-console'>...</div></div>
            </div>
        </body>
        </html>
    <?php
    }
}
?>
