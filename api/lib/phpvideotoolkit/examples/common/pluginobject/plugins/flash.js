PO.M.Debug.OnExpressInstall = 'PluginObject: Flash Player version "%ver%" is outdated. Version "%verreq%" is required. Running express install.';
PO.L.Flash = {
	
	options: {
		upgrade_url			: 'http://www.adobe.com/shockwave/download/download.cgi?P1_Prod_Version=ShockwaveFlash',
		class_id			: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000',
		codebase			: 'http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,115,0',
		mime_type			: 'application/x-shockwave-flash',
		quality				: 'high',
		bgcolor				: null,
		bgcolour			: null,
		use_express_install	: false,
		do_express_install	: false,
		express_install_swf	: 'plugins/flash/expressinstall.swf'
	},
	
	variables: {}, // these are flashvars
	
// 	best docs
// 	http://kb.adobe.com/selfservice/viewContent.do?externalId=tn_12701
	params: {
// 		swliveconnect 	: false,
// 		play 			: true,
// 		loop 			: false,
// 		menu 			: true,
// 		quality 		: 'high',
// 		scale 			: 'showall',
// 		align 			: null,
// 		salign 			: 'tl',
// 		wmode 			: 'window',
// 		bgcolor 		: null,
// 		base 			: ''		
	},
	attributes: {},
	
	create: function(src, o, p)
	{
		o = PO.U.merge(o, PO.L.Flash.options);
		
		o.params = PO.U.merge(o.params || {}, PO.L.Flash.params);
		o.variables = PO.U.merge(o.variables || {}, PO.L.Flash.variables);
		o.attributes = PO.U.merge(o.attributes || {}, PO.L.Flash.attributes);
		
		if(o.do_express_install)
		{
			o.params.MMplayerType = PO.U.Browser.IE ? 'Active-X' : 'Plugin';
			if(PO.U.Browser.IE)
			{
				o.params.wmode = 'transparent';
// 				to complete <------------------------------------------------------------------------------
			}
		}
		
		var v = [];
		for(var a in o.variables)
		{
			v.push(a+'='+escape(o.variables[a]));
		}
		if(v.length) o.params.flashvars = v.join('&');
		
		if(!o.params.bgcolor)
		{
			var bg = o.bgcolour ? o.bgcolour : (o.bgcolor ? o.bgcolor : false);
			if(bg) o.params.bgcolor = bg;
		}
		o.params.quality = o.quality;
		
		return new PO.ObjectEmbed(src, o, PO.L.Flash, p);
	},
	
	_express_install_active: false,
	_installed_version: false,
	detectVersion: function(o, rv)
	{
// 		most of this is lifted/adapted directly from swfobject methods
// 		SWFObject v2.0 rc1 <http://code.google.com/p/swfobject/>
// 		Copyright (c) 2007 Geoff Stearns, Michael Williams, and Bobby van der Sluis
		if(PO.L.Flash._installed_version) return PO.L.Flash._installed_version;
		var pv = new PO.U.PlayerVersion([0, 0, 0]), ma, mi, rev, d, pva;
		if (typeof navigator.plugins != 'undefined' && typeof navigator.plugins['Shockwave Flash'] == 'object')
		{
			d = navigator.plugins['Shockwave Flash'].description;
			if (d)
			{
				d = d.replace(/^.*\s+(\S+\s+\S+$)/, '$1');
				ma = parseInt(d.replace(/^(.*)\..*$/, '$1'), 10);
			 	min = parseInt(d.replace(/^.*\.(.*)\s.*$/, '$1'), 10);
				rev = /r/.test(d) ? parseInt(d.replace(/^.*r(.*)$/, '$1'), 10) : 0;
				pv = new PO.U.PlayerVersion([ma, mi, rev]);
			}
		}
		else if (typeof window.ActiveXObject != 'undefined')
		{
			var a = null, fp6_crash = false;
			try 
			{
				a = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.7');
			}
			catch(e) 
			{
				try 
				{ 
					a = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
					pva = [6,0,21];
					a.AllowScriptAccess = 'always';  // Introduced in fp6.0.47
				}
				catch(e) 
				{
					if (pva[0] == 6)
					{
						fp6_crash = true;
					}
				}
				if (!fp6_crash) 
				{
					try 
					{
						a = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
					}
					catch(e) {}
				}
			}
			if (!fp6_crash && typeof a == 'object')
			{ 
				try 
				{
					d = a.GetVariable('$version');  
					if (d) 
					{
						d = d.split(' ')[1].split(',');
						pva = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
					}
				}
				catch(e) {}
			}
			pv = new PO.U.PlayerVersion(pva);
		}
		PO.L.Flash._installed_version = pv;
		
		if(pv.ma == 8 && PO.U.Platform.Win)
		{
// 			again copied/adapted from swfobject, see credits above
			window.attachEvent('onunload', function ()
			{
				var o = document.getElementsByTagName('object');
				if (o)
				{
					var ol = o.length;
					for (var i = 0; i < ol; i++) 
					{
						o[i].style.display = 'none';
						for (var x in o[i]) 
						{
							if (typeof o[i][x] == 'function') o[i][x] = function() {};
						}
					}
				}
			});
		}
		if(!pv.validate(rv) && o.use_express_install && pv.validate(new PO.U.PlayerVersion([6,0,65])) && (PO.U.Platform.Win || PO.U.Platform.Apple))
		{
// 			again copied/adapted from swfobject, see credits above
			PO.L.Flash._express_install_active = true;
			PO.M.call(PO.M.Debug.OnExpressInstall, {ver:pv.toString(), verreq:rv.toString()}, 'd');
// 			if(!o.force_into_id) 
// 			{
// 				h = '<div id="PO_Wrapper_'+this._id+'">'+h+'</div>';
// 			}
			return -1;
		}
		return pv;
	},
	
	expressInstallCallback: function()
	{
// 		again copied/adapted from swfobject, see credits above
		if (PO.L.Flash._express_install_active && storedAltContent)
		{
			var obj = document.getElementById('SWFObjectExprInst');
			if (obj) 
			{
				obj.parentNode.replaceChild(storedAltContent, obj);
				storedAltContent = null;
				PO.L.Flash._express_install_active = false;
			}
		} 
	}
};
// for use with the swfobject express install so simple swaps can be made.
swfobject = { expressInstallCallback: PO.Plugins.Flash.expressInstallCallback };
PO.Plugins.Flash.loaded = 1;
