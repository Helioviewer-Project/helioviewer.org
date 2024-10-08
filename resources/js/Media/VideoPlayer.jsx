import React, { useEffect, useId, useState } from "react";
import { JhvRequest, JhvRequestBuilder, IsJhvRunning } from "jhvrequest";
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
 * @property {string} layers Layer string which make up the movie
 * @property {string} url URL to movie mp4
 * @property {string} startDate Movie start date string
 * @property {string} endDate Movie end date string
 */

/**
 * Returns a video player for the given movie
 * @param {VideoPlayerProps}
 * @returns {React.JSX.Element}
 */
function VideoPlayer({ movie, width, height, onClickYoutubeBtn, outputType }) {
  useEffect(() => {
    const playPauseFn = function (player, media) {
      if (player.paused) {
        player.play();
      } else {
        player.pause();
      }
    };
    $("video").mediaelementplayer({
      enableAutosize: true,
      features: ["playpause", "progress", "current", "duration", "fullscreen"],
      alwaysShowControls: false,
      iconSprite: "/resources/lib/mediaelement/build/mejs-controls.svg",
      enableKeyboard: true,
      keyActions: [{ keys: [32], action: playPauseFn }]
    });
  }, []);
  return (
    <div>
      <MediaPlayer id={movie.id} url={movie.url} width={width} height={height} />
      <div style={{ width: "100%", paddingTop: "25px" }}>
        <div style={{ float: "left" }} className="video-links">
          {outputType != "minimal" ? <YoutubeButton id={movie.id} onClick={onClickYoutubeBtn} /> : <></>}
          {outputType != "minimal" ? <LinkButton id={movie.id} /> : <></>}
          <DownloadButton id={movie.id} />
        </div>
        <div className="video-share-buttons" style={{ float: "right" }}>
          <JHelioviewerButton movie={movie} />
          <XShareLink id={movie.id} />
        </div>
      </div>
    </div>
  );
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
function MediaPlayer({ id, url, width, height }) {
  url = url.substring(url.search("cache"));
  let fileNameIndex = url.lastIndexOf("/") + 1;
  let filename = url.substring(fileNameIndex);
  let filenameHQ = filename.replace(".mp4", "-hq.mp4");
  let filenameWebM = filename.replace(".mp4", "-.webm");
  let filePath = url.substring(0, url.lastIndexOf("/"));
  let autoplay = Helioviewer.userSettings.get("options.movieautoplay");
  return (
    <div>
      <video
        id={`movie-player-${id}`}
        width={width - 15}
        height={height - 20}
        poster={`${Helioviewer.serverSettings.rootURL}/${filePath}/preview-full.png`}
        controls="controls"
        preload="none"
        autoPlay={autoplay}
      >
        <source type="video/mp4" src={`${Helioviewer.serverSettings.rootURL}/${filePath}/${filenameHQ}`} />
        <source type="video/webm" src={`${Helioviewer.serverSettings.rootURL}/${filePath}/${filenameWebM}`} />
        <object
          width={width}
          height={height - 20}
          type="application/x-shockwave-flash"
          data="/resources/lib/mediaelement-2.22.0/build/flashmediaelement.swf"
        >
          <param name="movie" value="/resources/lib/mediaelement-2.22.0/build/flashmediaelement.swf" />
          <param
            name="flashvars"
            value={`controls=true&amp;poster=${Helioviewer.serverSettings.rootURL}/${filePath}/preview-full.png&amp;file=${Helioviewer.serverSettings.rootURL}/${filePath}/${filename}`}
          />
          <img
            src={`${Helioviewer.serverSettings.rootURL}/${filePath}/preview-full.png`}
            width={width}
            height={height}
            title="No video playback capabilities"
          />
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
function DownloadButton({ id }) {
  let downloadURL = `${Helioviewer.api}?action=downloadMovie&id=${id}&format=mp4&hq=true`;
  let onClick = () => {
    if (typeof _gaq != "undefined") {
      _gaq.push(["_trackEvent", "Movies", "Download"]);
    }
  };
  return (
    <div style={{ float: "left" }}>
      <a target="_parent" href={downloadURL} title="Download high-quality video">
        <img
          style={{ width: "93px", height: "32px" }}
          className="video-download-icon"
          src="resources/images/download_93x32.png"
          onClick={onClick}
        />
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
function YoutubeButton({ id, onClick }) {
  return (
    <div style={{ float: "left" }}>
      <button className="btn-link" id={`youtube-upload-${id}`} onClick={onClick}>
        <img
          className="youtube-icon"
          title="Upload video to YouTube"
          style={{ width: "124px", height: "32px" }}
          src="resources/images/yt_upload_logo_rgb_light.png"
        />
      </button>
    </div>
  );
}

/**
 * Creates a button which links back to this movie
 * @typedef {Object} LinkButtonProps
 * @property {string} id Movie ID
 * @param {LinkButtonProps}
 * @returns {React.JSX.Element}
 */
function LinkButton({ id }) {
  let onClick = () => {
    // Hide flash movies to prevent blocking
    if (!($.support.h264 || $.support.vp8)) {
      $(".movie-player-dialog").dialog("close");
    }
    helioviewerWebClient.displayMovieURL(id);
    return false;
  };
  return (
    <div style={{ float: "left" }}>
      <button
        className="btn-link"
        id={`video-link-${id}`}
        title="Get a link to this movie"
        target="_blank"
        onClick={onClick}
      >
        <img
          className="video-link-icon"
          style={{ width: "79px", height: "32px" }}
          src="resources/images/link_79x32.png"
        />
      </button>
    </div>
  );
}

/**
 * Creates a button shares this video to X
 * @typedef {Object} XShareLinkProps
 * @property {string} id Movie ID
 * @param {XShareLinkProps}
 * @returns {React.JSX.Element}
 */
function XShareLink({ id }) {
  let postText = "Movie of the Sun created on Helioviewer.org:\n";
  let postUrl = `${location.origin}?movieId=${id}`;
  let hashtags = "helioviewer";
  let shareUrl = `https://twitter.com/intent/tweet?text=${postText}&url=${postUrl}&hashtags=${hashtags}`;
  return (
    <div>
      <a
        href={shareUrl}
        className="twitter-share-button"
        data-related="helioviewer"
        data-lang="en"
        data-size="medium"
        data-count="horizontal"
      >
        <i></i>
        <span>Share on X</span>
      </a>
    </div>
  );
}

/**
 * Creates a button which opens the movie in JHelioviewer
 * @typedef {Object} JHelioviewerButtonProps
 * @property {Movie} movie Movie details
 * @param {JHelioviewerButtonProps}
 * @returns {React.JSX.Element}
 */
function JHelioviewerButton({ movie }) {
  // XRT is not supported. In this case, return a disabled button and exit.
  let unsupported = movie.layers.indexOf("XRT") != -1;
  if (unsupported) {
    return (
      <button className="jhelioviewer-btn" disabled={true}>
        <img src="/resources/images/jhelioviewer.png" />
        <span>Movie not Supported</span>
      </button>
    );
  }

  let noJhvText = "JHelioviewer not open";
  let openText = "Open In JHelioviewer";
  let sentText = "Sent!";
  let [ready, setReadyState] = useState(false);
  let [sent, setSent] = useState(false);
  // Check if JHV is running. If it is, update the text to openText,
  // otherwise set text to noJhvText
  let pingJhv = async () => {
    setReadyState(await IsJhvRunning());
  };
  // Use effect to run JHelioviewer scan while the button is rendered.
  useEffect(() => {
    pingJhv();
    // Setup a periodic function to show this button if JHV is running.
    let interval = setInterval(pingJhv, 1000);
    // When component is removed, clear the above periodic function.
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Create the JhvRequest that can send info to JHelioviewer if it's running.
  let request = GetJhvRequestForMovie(movie);
  let onClick = () => {
    // When the button is clicked, send the request to JHV
    request.Send();
    setSent(true);
    // After 3 seconds, revert the text.
    setTimeout(() => {
      setSent(false);
    }, 3000);
  };
  // If ready & sent, show sentText.
  // If ready & !sent, show openText.
  // If !ready, show noJhvText.
  let text = ready ? (sent ? sentText : openText) : noJhvText;
  return (
    <button className="jhelioviewer-btn" onClick={onClick} disabled={!ready}>
      <img src="/resources/images/jhelioviewer.png" />
      <span className="idle">{text}</span>
    </button>
  );
}

/**
 * Compute the cadence of a movie given its metadata
 * @param {Movie} movie
 * @returns {number} The average time (in seconds) between each movie frame.
 */
function ComputeCadence(movie) {
  let start = new Date(movie.startDate);
  let end = new Date(movie.endDate);
  // Get the length of the movie in seconds
  let dt = (end.getTime() - start.getTime()) / 1000;
  // Divide movie length by number of frames to compute the time between each frame.
  return dt / movie.numFrames;
}

/**
 * Creates a JhvRequest for the given movie.
 * @param {Movie} movie
 * @returns {JhvRequest}
 */
function GetJhvRequestForMovie(movie) {
  let layerStrings = movie.layers.split("],[");
  let requestBuilder = new JhvRequestBuilder();
  requestBuilder.SetName("Helioviewer.org");
  requestBuilder.SetTimeRange(movie.startDate, movie.endDate);
  requestBuilder.SetCadence(ComputeCadence(movie));
  for (let layerString of layerStrings) {
    // Remove the brackets
    if (layerString.startsWith("[")) {
      layerString = layerString.substring(1);
    }
    if (layerString.endsWith("]")) {
      layerString = layerString.substring(0, layerString.length - 1);
    }
    let layer = layerString.split(",");
    // This is almost definitely not enough for some movies
    // More advanced parsing may be necessary. Needs testing.
    let observatory = PatchObservatory(layer[0]);
    // Cut away the opacity/layer order info from the layer string
    let dataset = layer.slice(1, layer.length - 6).join(" ");
    dataset = PatchDataset(dataset);
    requestBuilder.AddSource(
      observatory,
      dataset,
      // Workaround to load GONG data. I couldn't figure out how to get GONG to load from GSFC.
      observatory == "NSO-GONG" ? "ROB" : Helioviewer.serverSettings.jhelioviewerHost
    );
  }
  return requestBuilder.Build();
}

/**
 * Patches the name of the observatory to a version supported by JHelioviewer.
 * @param {string} observatory Helioviewer's observatory name
 * @returns {string} JHelioviewer's observatory name
 */
function PatchObservatory(observatory) {
  return observatory.replace("_", "-").replace("GONG", "NSO-GONG");
}

/**
 * Certain information doesn't need to be sent to JHelioviewer.
 * Actually certain info will make the JHV request fail, clean that up here.
 * @param {string} dataset Initial dataset string
 * @returns {string} The patched string which can be sent to JHV
 */
function PatchDataset(dataset) {
  // LASCO C2/C3 must not have "white-light" in the request.
  return (
    dataset
      .replace("C2 white-light", "C2")
      .replace("C3 white-light", "C3")
      // For yohkoh "White Light" must be in the request.
      .replace("white-light", "White Light")
      // For yohkoh thin-Al
      .replace("thin-Al", "Thin Al")
  );
}

export { VideoPlayer, GetJhvRequestForMovie };
