// uses http://www.jeroenwijering.com/?item=JW_FLV_Media_Player
PO.L.FlashMedia = {
	
	options:{
		player						: 'plugins/flash/mediaplayer.swf',
		auto_fix_path 				: true, // fixes the src path so it is treated as relative to the html document. only applies if the src url doesn't contain http at the start of the url
		auto_adjust_height 			: true, // auto adjust the display height so the video fits correctly and if a playlist is used so does that.
		use_type_mapping			: true  // automagically maps file extensions to specifc types.
	},
// 	for more information on the variables you should use this page http://code.longtailvideo.com/trac/wiki/FlashVars#Fileproperties
// 	these variables are for v4 of the jw player and above
	variables	: {
// 		General
		config			: null, // (undefined): location of a XML file with flashvars. Useful for short embed codes or CDN stream redirecting. example. 
// 		File properties
    	author 			: null, // (undefined): author of the video, shown in the display or playlist.
    	captions 		: null, // (undefined): location of a TT captions XML file.
    	description 	: null, // (undefined): text description of the file.
    	duration 		: 0, 	// (0): duration of the file in seconds.
    	file 			: null, // (undefined): location of the mediafile or playlist to play.
    	image 			: null, // (undefined): location of a preview image; shown in display and playlist.
    	link 			: null, // (undefined): url to an external page the display, controlbar and playlist can link to.
    	start 			: 0, 	// (0): position in seconds where playback has to start.
    	title 			: null, // (undefined): title of the video, shown in the display or playlist.
    	type 			: null, // (undefined): type of file, can be sound, image, video, youtube, camera, http or rtmp. Use this to override auto-detection. 
// 		Colors
    	backcolor 		: 'FFFFFF', // 	(FFFFFF): background color of the controlbar and playlist.
    	frontcolor 		: '000000', //  (000000): color of all icons and texts in the controlbar and playlist.
    	lightcolor 		: '000000', //  (000000): color of an icon or text when you rollover it with the mouse.
    	screencolor 	: '000000', //  (000000): background color of the display. 
// 		Layout	
    	controlbar 		: 'bottom', //  (bottom): position of the controlbar. Can be set to bottom, over and none.
    	controlbarsize 	: 20, 		//  (20): height of the controlbar in pixels.
    	height 			: 400, 		//  (400): height of the display (not the entire player!) in pixels.
    	logo 			: null, 	//  (undefined): location of an external jpg,png or gif image to show in the display.
    	playlist 		: 'none', 	//  (none): position of the playlist. Can be set to bottom, over, right or none.
    	playlistsize 	: 180, 		//  (180): size of the playlist. When below or above, this refers to the height, when right, this refers to the width of the playlist.
    	skin 			: null, 	//  (undefined): location of a SWF file with the player graphics.
    	width 			: 280, 		//  (280): width of the display (not the entire player!) in pixels. 
// 		Playback
    	autostart 		: false, 	//  (false): automatically start the player on load.
    	bufferlength 	: 0.1, 		//  (0.1): number of seconds of the file that has to be loaded before starting.
    	displayclick 	: 'play', 	//  (play): what to do when one clicks the display. Can be play, link, fullscreen, none, mute, next.
    	item 			: 0, 		//  (0): playlistitem that should start to play. Use this to set a specific start-item.
    	mute 			: false, 	//  (false): mute all sounds on startup. Is saved as cookie.
    	quality 		: true, 	//  (true): enables high-quality playback. This sets the smoothing of videos on/off, the deblocking of videos on/off and the dimensions of the camera small/large. Is saved as cookie.
    	repeat 			: 'none', 	//  (none): set to list to play the entire playlist once and to always to continously play the song/video/playlist.
    	shuffle 		: false, 	//  (false): shuffle playback of playlistitems.
    	state 			: 'IDLE', 	//  (IDLE): current playback state of the player (IDLE, BUFFERING, PLAYING, PAUSED, COMPLETED).
    	stretching 		: 'uniform',//  (uniform): defines how to resize images in the display. Can be none (no stretching), exactfit (disproportionate), uniform (stretch with black borders) or fill (uniform, but completely fill the display).
    	volume 			: 90, 		//  (90): startup volume of the player. Is saved as cookie. 
// 		External
    	abouttext 		: null, 	//  (undefined): text to show in the rightclick menu. Please do not change this if you don't have a commercial license! When undefined it shows the player version.
    	aboutlink 		: 'http://www.jeroenwijering.com/?page=about', //  (http://www.jeroenwijering.com/?page=about): url to link to from the rightclick menu. Do not change this if you don't have a commercial license!
    	client 			: null, 	//  (Flash MAC X,0,XXX,0): Version and platform of the Flash client plugin. Useful to check for e.g. MP4 playback or fullscreen capabilities.
    	id 				: 'ply', 	//  (ply): ID of the player within the javascript DOM. Useful for javascript interaction.
    	linktarget 		: '_blank', //  (_blank): browserframe where the links from display are opened in. Some possibilities are '_self' (same frame) , '_blank' (new browserwindow) or 'none' (links are ignored in the player, so javascript can handle it).
    	streamer 		: null, 	//  (undefined): location of a server to use for streaming. Can be an RTMP application (here's an example) or external PHP/ASP file to use for HTTP streaming. If set to lighttpd, the player presumes a Lighttpd server is used to stream videos.
    	tracecall 		: null 		//  (undefined): name of a javascript function that can be used for tracing the player activity. All events from the view, model and controller are sent there.

	},
	params: {
		allowfullscreen:true
	},
	attributes: {},
	typemap:{
		ut 		: 'youtube', 
		youtube	: 'youtube', 
		tube	: 'youtube', 
		mp3	: 'sound', 
		m4a	: 'sound', 
		m4b	: 'sound', 
		m4p	: 'sound', 
		m4v	: 'sound', 
		m4r	: 'sound', 
		aac	: 'sound',
		'3gp' 	: 'video', 
		mp4	: 'video', 
		flv	: 'video', 
		swf : 'video', 
		jpg	: 'image',
		jpeg: 'image',
		gif	: 'image', 
		png	: 'image', 
		mpg	: 'video',
		mpeg: 'video'
	},
	
	create: function(src, o, p)
	{
		var fo = PO.U.merge(PO.L.Flash.options, PO.L.FlashMedia.options), h = document.location.href;
		o = PO.U.merge(o, fo);
		if(o.auto_fix_path && src.indexOf('http') === -1) 
		{
			src = h.substr(0, h.lastIndexOf('/')+1) + src;
		}
		
		var fa = PO.U.merge(PO.L.Flash.attributes, PO.L.FlashMedia.attributes);
		o.attributes = PO.U.merge(o.attributes || {}, fa);
		
		var fv = PO.U.merge(PO.L.Flash.variables, PO.L.FlashMedia.variables);
		o.variables = PO.U.merge(o.variables || {}, fv);
		o.variables.file = src;
		if(!o.variables.width) 				o.variables.width			= o.width;
		if(!o.variables.height) 			o.variables.height			= o.height;
		if(o.auto_adjust_height)
		{
			o.height  += o.variables.controlbarsize;
			if(o.variables.playlist !== 'none')
			{
				o.height  += o.variables.playlistsize;
			}
		}
		
		if(o.use_type_mapping && o.variables.type === null)
		{
			var e = src.split('.').pop().toLowerCase();
			if(PO.L.FlashMedia.typemap[e]) o.variables.type = PO.L.FlashMedia.typemap[e];
		}
		for(var a in o.variables)
		{
			if(o.variables[a] === null) delete o.variables[a];
		}
		
		var fp = PO.U.merge(PO.L.Flash.params, PO.L.FlashMedia.params);
		o.params = PO.U.merge(o.params || {}, PO.L.FlashMedia.params);
		o.bgcolour = o.variables.backcolor;
		
		if(!o.variables.id) o.variables.id = o.force_id ? o.force_id : 'PluginObject-'+PO.U.hash(8)+'-'+(new Date()).getTime();
		
		if(o.placeholder && o.placeholder_autoplay) o.variables.autostart = true;

		return PO.L.Flash.create(o.player, o, PO.Plugins.Flash, p);
	}
};
PO.Plugins.FlashMedia.loaded = 1;