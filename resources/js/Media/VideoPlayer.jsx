import React, { useEffect } from "react"
/**
 * @typedef {Object} VideoPlayerProps
 * @property {Movie} movie Movie URL
 * @property {number} width Movie width
 * @property {number} height Movie Height
 * @property {() => void} onClickYoutubeBtn Callback to execute when youtube button is clicked
 */

/**
 * @typedef {Object} Movie
 * @property {string} id alphanumeric movie ID
 * @property {number} imageScale Image scale in arcseconds/pixel
 * @property {Array} layers Layer descriptions which make up the movie
 * @property {string} url URL to movie mp4
 */

/**
 * Returns a video player for the given movie
 * @param {VideoPlayerProps}
 * @returns {React.JSX.Element}
 */
function VideoPlayer({
    movie,
    width,
    height,
    onClickYoutubeBtn
}) {
    useEffect(() => {
        const playPauseFn = function (player, media) {
            if (player.paused) {
                player.play();
            } else {
                player.pause();
            }
        }
        $("video").mediaelementplayer({
            enableAutosize: true,
            features: ["playpause","progress","current","duration", "fullscreen"],
            alwaysShowControls: false,
            iconSprite: "/resources/lib/mediaelement/build/mejs-controls.svg",
            enableKeyboard: true,
            keyActions: [{keys: [32], action: playPauseFn}]
        });
    }, []);
    return (
        <div>
            <MediaPlayer id={movie.id} url={movie.url} width={width} height={height}/>
            <div style={{width: '100%', paddingTop: '25px'}}>
                <div style={{float: 'left'}} className="video-links">
                    <YoutubeButton id={movie.id} onClick={onClickYoutubeBtn} />
                    <LinkButton id={movie.id} />
                    <DownloadButton id={movie.id} />
                </div>
                <div style={{float: 'right'}}>
                    <XShareLink id={movie.id} />
                </div>
            </div>
        </div>
    )
}

/**
 * Renders the video player for the given movie url
 * @typedef {Object} MediaPlayerProps
 * @property {string} id Movie ID
 * @property {string} url Movie URL
 * @property {number} width Video width
 * @property {number} height Video height
 * @param {MediaPlayerProps}
 * @returns {React.JSX.Element}
 */
function MediaPlayer({id, url, width, height}) {
    url = url.substring(url.search("cache"));
    let fileNameIndex = url.lastIndexOf("/") + 1;
    let filename = url.substring(fileNameIndex);
    let filenameHQ = filename.replace('.mp4', '-hq.mp4');
    let filenameWebM = filename.replace('.mp4', '-.webm');
    let filePath = url.substring(0, url.lastIndexOf("/"));
    let autoplay = Helioviewer.userSettings.get("options.movieautoplay");
    return (
        <div>
            <video id={`movie-player-${id}`} width={width - 15} height={height - 20} poster={`${helioviewer.serverSettings.rootURL}/${filePath}/preview-full.png`} controls="controls" preload="none" autoPlay={autoplay}>
                <source type="video/mp4" src={`${helioviewer.serverSettings.rootURL}/${filePath}/${filenameHQ}`} />
                <source type="video/webm" src={`${helioviewer.serverSettings.rootURL}/${filePath}/${filenameWebM}`} />
                <object width={width} height={height - 20} type="application/x-shockwave-flash" data="/resources/lib/mediaelement-2.22.0/build/flashmediaelement.swf">
                    <param name="movie" value="/resources/lib/mediaelement-2.22.0/build/flashmediaelement.swf" />
                    <param name="flashvars" value={`controls=true&amp;poster=${helioviewer.serverSettings.rootURL}/${filePath}/preview-full.png&amp;file=${helioviewer.serverSettings.rootURL}/${filePath}/${filename}`} />
                    <img src={`${helioviewer.serverSettings.rootURL}/${filePath}/preview-full.png`} width={width} height={height} title="No video playback capabilities" />
                </object>
            </video>
        </div>
    );
}

/**
 * Creates a download button for the given movie
 * @typedef {Object} DownloadButtonProps
 * @property {string} id Movie ID
 * @param {DownloadButtonProps}
 * @returns {React.JSX.Element}
 */
function DownloadButton({id}) {
    let downloadURL = `${Helioviewer.api}?action=downloadMovie&id=${id}&format=mp4&hq=true`;
    let onClick = () => {
        if (typeof(_gaq) != "undefined") {
            _gaq.push(['_trackEvent', 'Movies', 'Download']);
        }
    }
    return (
        <div style={{float: 'left'}}>
            <a target="_parent" href={downloadURL} title="Download high-quality video">
                <img style={{width: '93px', height: '32px'}} className="video-download-icon" src="resources/images/download_93x32.png" onClick={onClick}/>
            </a>
        </div>
    );
}

/**
 * Creates an upload to youtube button for the given movie ID
 * @typedef {Object} YoutubeButtonProps
 * @property {string} id Movie ID
 * @property {() => void} onClick Executed when this button is clicked
 * @param {YoutubeButtonProps}
 * @returns {React.JSX.Element}
 */
function YoutubeButton({id, onClick}) {
    return (
        <div style={{float: 'left'}}>
            <button className="btn-link" id={`youtube-upload-${id}`} onClick={onClick}>
                <img className="youtube-icon" title="Upload video to YouTube" style={{width: '124px', height: '32px'}} src="resources/images/yt_upload_logo_rgb_light.png" />
            </button>
        </div>
    )
}

/**
 * Creates a button which links back to this movie
 * @typedef {Object} LinkButtonProps
 * @property {string} id Movie ID
 * @param {LinkButtonProps}
 * @returns {React.JSX.Element}
 */
function LinkButton({id}) {
    let linkURL = helioviewer.serverSettings.rootURL + "/?movieId=" + id;
    let onClick = () => {
        // Hide flash movies to prevent blocking
        if (!($.support.h264 || $.support.vp8)) {
            $(".movie-player-dialog").dialog("close");
        }
        helioviewer.displayMovieURL(id);
        return false;
    }
    return (
        <div style={{float: 'left'}}>
            <button className="btn-link" id={`video-link-${id}`} title="Get a link to this movie" target="_blank" onClick={onClick}>
                <img className="video-link-icon" style={{width: '79px', height: '32px'}} src='resources/images/link_79x32.png' />
            </button>
        </div>
    )
}

/**
 * Creates a button shares this video to X
 * @typedef {Object} XShareLinkProps
 * @property {string} id Movie ID
 * @param {XShareLinkProps}
 * @returns {React.JSX.Element}
 */
function XShareLink({id}) {
    let postText = "Movie of the Sun created on Helioviewer.org:\n";
    let postUrl = `${location.origin}?movieId=${id}`;
    let hashtags = "helioviewer";
    let shareUrl = `https://twitter.com/intent/tweet?text=${postText}&url=${postUrl}&hashtags=${hashtags}`
	return (
        <div style={{float: "right"}}>
            <a href={shareUrl} className="twitter-share-button" data-related="helioviewer" data-lang="en" data-size="medium" data-count="horizontal">
                <i></i>
                <span>Share on X</span>
            </a>
        </div>
    );
}

export { VideoPlayer }