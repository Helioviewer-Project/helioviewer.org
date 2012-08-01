<?php
/**
 * Helioviewer.org - Latest Movie player
 * 
 * July 2012
 * 
 * This page was put together as a quick hack to provide a simple way to show
 * what users have been uploading on Helioviewer.org at conferences, etc.
 * 
 * It has not been advertised outside of the meeting, or made available on
 * the main site.
 * 
 * One possibility would be to provide a button on the main site which opens
 * a jQuery dialog with the video player portion of the contents below. 
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Helioviewer.org - Latest Movies</title>
    <meta charset="utf-8" />
    <script src="../lib/swfobject/swfobject.js"></script>
    <style type='text/css'>
    	body {
			background-image: url('../resources/images/backgrounds/gradient_v5-optimized.png');
			background-color: #20242F;
			background-repeat: repeat-x;
    		text-align: center;
    	}
    	#header {height: 50px;}
    	#moviePlayer {}
    </style>
</head>
<body>
	<div id="header">
		<h1 id="title">Helioviewer.org - Latest Movies</h1>
	</div>
    <div id="player"></div>

<!-- Main -->
<script src="http://code.jquery.com/jquery-1.7.2.min.js" type="text/javascript"></script>
<script>
	// Global playlist
	var playlist = {
        videos: [],
        current_video: 0,
        player: null
    };

	$(function () {
		// Query params
		var params = {
			action: 'getUserVideos',
			num: 30
		};
	    $.post("../api/index.php", params, parseUserVideos, "json");
	});
	
	function parseUserVideos(response) {
        var params, attrs, startURL, width, height;
        
        playlist.videos = parseYoutubeVideoIds(response);
        
        // Load SWFObject
        params = {
        	allowScriptAccess: "always",
        	allowfullscreen: "true"
       	};
        attrs = {id: "moviePlayer"};
        
        playlist.current_video = 0;
        
        startURL = "http://www.youtube.com/v/" + playlist.videos[0] + "?" + $.param({
        	enablejsapi: 1,
        	playerapiid: "ytplayer",
        	rel: 0
        });
        
        width  = $(window).width() * 0.8;
        height = $(window).height() * 0.8;
        
        swfobject.embedSWF(startURL, "player", width, height, "8", "../lib/swfobject/expressinstall.swf", null, params, attrs);
    }
    
    //suggestedQuality

	// YouTube JavaScript Player Callbacks
	// https://developers.google.com/youtube/js_api_reference
    function onYouTubePlayerReady(playerId) {
        playlist.player = document.getElementById("moviePlayer");
        playlist.player.addEventListener("onStateChange", "onStateChange");
        playlist.player.playVideo();
    }

    function onStateChange(newstate) {
    	if (newstate !== 0) {
			return;		
    	}

		// Re-query latest videos once we get to the end of the loop
    	if ((playlist.current_video + 1) === playlist.videos.length) {
			// Query params
			var params = {
				action: 'getUserVideos',
				num: 30
			};

	    	$.post("../api/index.php", params, function(response) {
	    		playlist.videos = parseYoutubeVideoIds(response);
	    		
	    		loadVideo(0);
	    	}, "json");
    	} else {
    		// Otherwise play the next video in the queue
    		loadVideo((playlist.current_video + 1) % playlist.videos.length);
    	}
    }
    
    function loadVideo(i) {
    	// Load next video
        playlist.current_video = i;
        playlist.player.loadVideoById(playlist.videos[playlist.current_video], null, "highres");
    }
    
    function parseYoutubeVideoIds(response) {
        var ids = [];
        
        $.each(response, function (i, video) {
        	var id = video.url.split("=").pop();        	
        	ids.push(id);
        });
        
        return ids;
    };

</script>
</body>
</html>