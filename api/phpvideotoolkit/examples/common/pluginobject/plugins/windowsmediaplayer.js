PO.L.WindowsMediaPlayer = {
	
	options: {
		upgrade_url			: PO.U.Browser.Linux ? 'http://www.videolan.org/vlc/' : (PO.U.Platform.Apple ? 'http://www.flip4mac.com/wmv_download.htm' : 'http://www.microsoft.com/windows/windowsmedia/download/AllDownloads.aspx'),
		class_id			: 'clsid:22D6f312-B0F6-11D0-94AB-0080C74C7E95',
		codebase			: 'http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab',
		mime_type			: {
			'audio/x-pn-realaudio-plugin' : []
		},
		bgcolor				: null,
		bgcolour			: null
	},
	
	params: {
// 		AudioStream				: true,	 
// 		AutoSize				: true,	 
// 		AutoStart				: true,	// Sets if the player should start automatically
// 		AnimationAtStart		: true,	// Sets if an animation should show while the file loads
// 		AllowScan				: true,	 
// 		AllowChangeDisplaySize	: true,	 
// 		AutoRewind				: false,
// 		Balance					: false,	 
// 		BaseURL	 				: null,	 
// 		BufferingTime			: 5,	 
// 		CaptioningID 			: null,	 	 
// 		ClickToPlay				: false,	// Sets if the player should start when the user clicks in the play area
// 		CursorType				: false,	 
// 		CurrentPosition			: true,	 
// 		CurrentMarker			: false,	 
// 		DefaultFrame	 		: null,	 
// 		DisplayBackColor		: false,	 
// 		DisplayForeColor		: 16777215,	 
// 		DisplayMode				: false,	 
// 		DisplaySize				: false,	 
// 		Enabled					: true,	 
// 		EnableContextMenu		: true,	 
// 		EnablePositionControls	: true,	 
// 		EnableFullScreenControls: false,	 
// 		EnableTracker			: true,	 
// // 		Filename				: null,	// The URL of the file to play
// 		InvokeURLs				: true,
// 		Language				: true,
// 		Mute					: false,
// 		PlayCount				: 1,
// 		PreviewMode				: false,
// 		Rate					: 1,
// 		SAMILang	 			: null,	 
// 		SAMIStyle	  			: null, 
// 		SAMIFileName	  		: null,	 
// 		SelectionStart			: true,	 
// 		SelectionEnd			: true,	 
// 		SendOpenStateChangeEvents	: true,	 
// 		SendWarningEvents		: true,	 
// 		SendErrorEvents			: true, 
// 		SendKeyboardEvents		: false,	 
// 		SendMouseClickEvents	: false,	 
// 		SendMouseMoveEvents		: false,
// 		SendPlayStateChangeEvents	: true,	 
// 		ShowCaptioning			: false,
// 		ShowControls			: true,	// Sets if the player controls should show
// 		ShowAudioControls		: true,	// Sets if the audio controls should show
// 		ShowDisplay				: false, // Sets if the display should show
// 		ShowGotoBar				: false, // Sets if the GotoBar should show
// 		ShowPositionControls	: true,	 
// 		ShowStatusBar			: false,	 
// 		ShowTracker				: true,	 
// 		TransparantAtStart		: false,	 
// 		VideoBorderWidth		: false,	 
// 		VideoBorderColor		: false,	 
// 		VideoBorder3D			: false,	 
// 		Volume					: -200,	 
// 		WindowlessVideo			: false	 		
	},
	attributes: {},
	
	create: function(src, o, p)
	{
		o = PO.U.merge(o, PO.L.WindowsMediaPlayer.options);
		
		o.params = PO.U.merge(o.params || {}, PO.L.WindowsMediaPlayer.params);
		o.attributes = PO.U.merge(o.attributes || {}, PO.L.WindowsMediaPlayer.attributes);
		
		var bg = o.bgcolour ? o.bgcolour : (o.bgcolor ? o.bgcolor : false);
		if(bg) o.params.bgcolor = bg;

		if(o.placeholder && o.placeholder_autoplay) o.params.AutoStart = true;
		
		return new PO.ObjectEmbed(src, o, PO.L.WindowsMediaPlayer, p);
	},
	
	_installed_version: false,
	detectVersion: function(o, rv)
	{
		if(PO.L.WindowsMediaPlayer._installed_version) return PO.L.WindowsMediaPlayer._installed_version;
		var pv = false,a;
		if(navigator.plugins && navigator.plugins.length > 0)
		{
			np = navigator.plugins;
			for (a=0; a < np.length; a++ ) 
			{
			    if(np[a].name.indexOf('Windows Media') > -1) 
				{
					pv = true;
					break;
			    }
			}
		}
		else
		{
			execScript('on error resume next: mp2 = IsObject(CreateObject("MediaPlayer.MediaPlayer.1"))', 'VBScript');
			pv = (mp2);
		}
		pv = new PO.U.PlayerVersion([(pv === true) ? 1 : 0, 0, 0]);
		PO.L.WindowsMediaPlayer._installed_version = pv;
		return pv;
	}
	
};
PO.Plugins.WindowsMediaPlayer.loaded = 1;
