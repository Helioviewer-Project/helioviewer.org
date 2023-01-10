// detect the browser
function hvBrowserDetect(){
                 
let userAgent = navigator.userAgent;
let hvBrowserName;

if(userAgent.match(/chrome|chromium|crios/i)){
	hvBrowserName = "chrome";
}else if(userAgent.match(/firefox|fxios/i)){
	hvBrowserName = "firefox";
}  else if(userAgent.match(/safari/i)){
	hvBrowserName = "safari";
}else if(userAgent.match(/opr\//i)){
	hvBrowserName = "opera";
} else if(userAgent.match(/edg/i)){
	hvBrowserName = "edge";
}else{
	hvBrowserName="No browser detection";
}


// if browser is edge or chrome, display the video pop-up window by triggering an <a> tag with an href that references an active movieID - 1/2022 by BAT 
if(hvBrowserName== "edge" || hvBrowserName== "firefox" || hvBrowserName== "chrome") {

	// get current url
	const hvQueryString = window.location.search;
	
	// set the collection of url parameters to hvUrlParams
	hvUrlParams = new URLSearchParams(hvQueryString);
	
	// get the movieId parameter value
	const backupmovieID = hvUrlParams.get('movieId');
	
	if(window.location.href.indexOf("movieId") > -1) {
		// implant <a> tag and trigger it's onclick event
		$('#movie-history').append('<div id="movie-'+backupmovieID+'" class="history-entry" data-hasqtip="89" aria-describedby="qtip-89"><div class="label" data-id="'+backupmovieID+'"><a id="bf_genvideoload" class="text-btn" style="float: left" href="?movieId='+backupmovieID+'">From URL</a></div><div class="status">just now</div></div>');
		
		// trigger a click on the newly inserted <a> tag
		setTimeout(function(){$('#bf_genvideoload').click();}, 2000);	

	}

}

}


hvBrowserDetect();
