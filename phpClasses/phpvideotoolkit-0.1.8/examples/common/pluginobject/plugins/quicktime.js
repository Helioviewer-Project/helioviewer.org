PO.L.Quicktime = {
	
	options: {
		upgrade_url			: 'http://www.apple.com/quicktime/download/',
		class_id			: 'clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B',
		codebase			: 'http://www.apple.com/qtactivex/qtplugin.cab',
		mime_type			: 'video/quicktime',
		auto_adjust_height 	: true,
		bgcolor				: null,
		bgcolour			: null
	},
	
// 	best info
// http://developer.apple.com/documentation/QuickTime/Conceptual/QTScripting_HTML/QTScripting_HTML_Document/chapter_1000_section_5.html#//apple_ref/doc/uid/TP40001525-2-QuickTimeltEMBEDgtandltOBJECTgtParameters
	params: {
// 		allowembedtagoverrides 	: true,
// 		autohref 				: false,
// 		autoplay 				: false,
// 		bgcolor 				: '#ffffff',
// 		controller 				: true,
// 		correction 				: 'none',
// 		dontflattenwhensaving 	: true,
// 		enablehref 				: false,
// 		enablejavascript 		: false,
// 		endtime 				: null,
// 		fov 					: 0,
// 		goto 					: null,
// 		// hotspotn 			: null,
// 		href 					: null,
// 		kioskmode 				: true,
// 		loop 					: false,
// 		movieid 				: null,
// 		moviename 				: null,
// 		movieqtlist 			: null,
// 		node 					: null,
// 		pan 					: 0,
// 		playeveryframe 			: false,
// 		qtnext 					: null,
// 		qtsrc					: null,
// 		// url 					: null,
// 		qtsrcchokespeed 		: null,
// 		qtsrcdontusebrowser 	: false,
// 		saveembedtags 			: true,
// 		scale 					: 'tofit', 
// 		showlogo 				: true,
// 		starttime 				: null,
// 		target 					: 'myself',
// 		targetcache 			: true,
// 		tilt 					: 0,
// 		urlsubstitute			: '',
// 		volume					: 60
	},
	attributes: {},
	
	create: function(src, o, p)
	{
		o = PO.U.merge(o, PO.L.Quicktime.options);
		
		o.params = PO.U.merge(o.params || {}, PO.L.Quicktime.params);
		o.attributes = PO.U.merge(o.attributes || {}, PO.L.Quicktime.attributes);
		
		var e = src.split('.').pop().toLowerCase();
		if(e != 'mp3' && o.auto_adjust_height && (typeof o.params.controller == 'undefined' || o.params.controller))
		{
			o.height += 16;
		}
		
		var bg = o.bgcolour ? o.bgcolour : (o.bgcolor ? o.bgcolor : false);
		if(bg) o.params.bgcolor = bg;
		
		if(o.placeholder && o.placeholder_autoplay) o.params.autoplay = true;
		
		return new PO.ObjectEmbed(src, o, PO.L.Quicktime, p);
	},
	
	_installed_version: false,
	detectVersion: function(o, rv)
	{
		if(PO.L.Quicktime._installed_version) return PO.L.Quicktime._installed_version;
		var pv = new PO.U.PlayerVersion([0, 0, 0]);
		if(navigator.plugins && navigator.mimeTypes.length)
		{
			for (var i=0; i < navigator.plugins.length; i++) 
			{
				var x = navigator.plugins[i];
				if (x.name.indexOf("QuickTime") > -1) 
				{
					pv = new PO.U.PlayerVersion(x.name.replace(/([a-z]|[A-Z]|-|\s)+/, '').split('.'));
					break;
				}
			}
		}
		else
		{
			pv = new PO.U.PlayerVersion([1,0,0]);
			try
			{
				var axo = new ActiveXObject("QuickTimeCheckObject.QuickTimeCheck.1");
				if (axo.QuickTimeVersion) 
				{
// 					get the leading 3 hex digits
					var v = axo.QuickTimeVersion >> 16;
					pv = new PO.U.PlayerVersion([(v & 0xf00) >> 8, (v & 0x0f0) >> 4, v & 0x00f]);
				}
			}
			catch(e) {}
		}
		PO.L.Quicktime._installed_version = pv;
		return pv;
	}
};
PO.Plugins.Quicktime.loaded = 1;
