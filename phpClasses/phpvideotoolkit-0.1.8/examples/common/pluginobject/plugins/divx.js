PO.L.DivX = {
	
	options:  {
		upgrade_url			: 'http://go.divx.com/plugin/download/',
		class_id			: 'clsid:67DABFBF-D0AB-41fa-9C46-CC0F21721616',
		codebase			: 'http://go.divx.com/plugin/DivXBrowserPlugin.cab',
		mime_type			: 'video/divx'
	},
	
// 	scripting sdk avaiable here
// 	http://download.divx.com/player/DivXWebPlayer_WebmasterSDK.zip
	params: {
// 		mode 					: null, // null, zero, mini, large, full
// 		minVersion 				: '0.0.0',
// 		allowContextMenu 		: true,
// 		autoPlay				: false,
// 		loop					: false,
// 		bannerEnabled			: false,
// 		bufferingMode			: 'auto', // null, auto, full
// 		previewImage			: null,
// 		previewMessage			: '',
// 		previewMessageFontSize	: 12,
// 		movieTitle				: null
	}, 
	attributes: {},
	
	create: function(src, o, p)
	{
		o = PO.U.merge(o, PO.L.DivX.options);
		
		o.params = PO.U.merge(o.params || {}, PO.L.DivX.params);
		o.attributes = PO.U.merge(o.attributes || {}, PO.L.DivX.attributes);
		
		if(o.placeholder && o.placeholder_autoplay) o.params.autoPlay = true;
		
		return new ObjectEmbed(src, o, PO.L.DivX, p);
	},
	
	_installed_version: false,
	detectVersion: function(o, rv)
	{
// 		this code is lifted/adapted from http://includes.stage6.com/javascript/divx_plugin.js?v4
		if(PO.L.DivX._installed_version) return PO.L.DivX._installed_version;
		var pv = new PO.U.PlayerVersion([0,0,0]);
		if(navigator.plugins && navigator.mimeTypes["application/x-mplayer2"] && navigator.mimeTypes["application/x-mplayer2"].enabledPlugin)
		{
			navigator.plugins.refresh(false); // not entirley sure this is neccesary?
			var rc = new RegExp('divx.*?((web)|(browser))', 'i');
			for (var i=0; i < navigator.plugins.length; i++) 
			{
				var x = navigator.plugins[i];
				if (rc.text(x.name)) 
				{
					var a = x.description.indexOf('version '), v = '1.0.0';
					if (a != -1) v = x.description.substring(a + 8);
					pv = new PO.U.PlayerVersion(v.split('.'));
					break;
				}
			}
		}
		else
		{
			var dp = false, dpv = false;
			execScript('on error resume next: dp = IsObject(CreateObject("npdivx.DivXBrowserPlugin.1"))', 'VBScript');
			if(dp)
			{
				execScript('on error resume next: dpv = CreateObject("npdivx.DivXBrowserPlugin.1").GetVersion()', 'VBScript');
				pv = new PO.U.PlayerVersion(dpv.split('.'));
			}
		}
		PO.L.DivX._installed_version = pv;
		return pv;
	}
	
};
PO.Plugins.DivX.loaded = 1;