PO.L.RealPlayer = {
	
	options: {
		upgrade_url	: 'http://www.real.com/',
		class_id	: 'clsid:CFCDAA03-8BE4-11cf-B84B-0020AFBBCCFA',
		mime_type	: 'audio/x-pn-realaudio-plugin',
		bgcolor		: null,
		bgcolour	: null
	},
	
// 	best info available 
// 	http://www.w3schools.com/media/media_realvideo.asp
	params: {
// 		backgroundcolor : null,
// 		center 			: 'true',
// 		controls		: 'All', //  see below
// 		console			: null,
// 		autostart 		: false,
// 		nolabels 		: false,
// 		reset 			: false,
// 		autogotoURL		: null	
	},
	attributes: {},
/*	
	All					- Displays a full player with all controls.
	InfoVolumePanel		- Title, author, and copyright and volume slider.
	InfoPanel			- Title, author, and copyright.
	ControlPanel		- Position slider, play, pause, and stop buttons.
	StatusPanel			- Messages, current time position, and clip length.
	PlayButton			- Play and pause buttons.
	StopButton			- Stop button.
	VolumeSlider		- Volume slider.
	PositionField		- Position and clip length.
	StatusField			- Messages.
	ImageWindow			- The video image
	StatusBar			- Status, position and channels.	
*/	
	create: function(src, o, p)
	{
		o = PO.U.merge(o, PO.L.RealPlayer.options);
		
		o.params = PO.U.merge(o.params || {}, PO.L.RealPlayer.params);
		o.attributes = PO.U.merge(o.attributes || {}, PO.L.RealPlayer.attributes);
		
		var bg = o.params.backgroundcolor ? o.params.backgroundcolor : (o.bgcolour ? o.bgcolour : (o.bgcolor ? o.bgcolor : '#FFFFFF'));
		if(bg.charAt(0) != '#' && bg.length == 6) bg = '#' + bg;
		o.params.backgroundcolor = bg;
		
		if(!o.params.console) o.params.console = PO.U.hash(8);
		
		if(o.placeholder && o.placeholder_autoplay) o.params.autostart = true;
		
		return new PO.ObjectEmbed(src, o, PO.L.RealPlayer, p);
	},
	
	_installed_version: false,
	detectVersion: function(o, rv)
	{
		if(PO.L.RealPlayer._installed_version) return PO.L.RealPlayer._installed_version;
		var pv = false;
		if(navigator.plugins && navigator.mimeTypes.length)
		{
			for (var i=0; i < navigator.plugins.length; i++) 
			{
				var x = navigator.plugins[i];
				if (x.name.indexOf('RealPlayer') > -1) 
				{
					pv = true;
				}
			}
		}
		else
		{
			execScript('on error resume next: rp1 = IsObject(CreateObject("rmocx.RealPlayer G2 Control"))', 'VBScript');
			execScript('on error resume next: rp2 = IsObject(CreateObject("RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)"))', 'VBScript');
			execScript('on error resume next: rp3 = IsObject(CreateObject("RealVideo.RealVideo(tm) ActiveX Control (32-bit)"))', 'VBScript');
			pv = (rp1 || rp2 || rp3);
		}
		pv = new PO.U.PlayerVersion([(pv === true) ? 1 : 0, 0, 0]);
		PO.L.RealPlayer._installed_version = pv;
		return pv;
	}
	
};
PO.Plugins.RealPlayer.loaded = 1;
