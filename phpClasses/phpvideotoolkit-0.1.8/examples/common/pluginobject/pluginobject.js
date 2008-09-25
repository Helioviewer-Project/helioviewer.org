if(typeof [].inArray !== 'function')
{
	Array.prototype.inArray = function(s) 
	{
		var i = this.length;
		if (i > 0)
		{
			do {
				if (this[i] === s) return true;
			} while (i--);
		}
		return false;
	};
}
// create object
PO = {
tist : (new Date())
};
// create reference object for keeping track of placeholder callbacks
PO.R = {};
// create reference object for keeping track of callbacks.
PO.C = {
	_c: {},
	register: function()
	{
		
	},
	commit: function(n, a)
	{
		if(d._f[i].s) return d._f[i].s[d._f[i].f].apply(d._f[i].s, a);
		else return d._f[i].f.apply(d._f[i], a);
	}
};

// file extension maps used for automagically translating files
// It should be noted that the looping order will start with Flash and work it's way down
// through the list, so you should list the plugins in order of priority because
// most plugins can handle similar files. For example you could play mp3's in Quicktime,
// WindowsMediaPlayer or Realplayer but preference is given to FlashMedia if automagically
// guessing. 
PO.Plugins = {
	Flash 				: { src:'flash', 				dependencies:null, 			name:'Flash', 					ext:['swf', 'flash'] },
	FlashMedia 			: { src:'flashmedia', 			dependencies:['Flash'], 	name:'FlashMedia',				ext:['mp3', 'flv', /*'swf', 'mpg', 'mpeg'*/, 'jpg', 'jpeg', 'png', 'gif'] }, // uses Jeroen's Media Player http://www.jeroenwijering.com/?item=JW_FLV_Media_Player
	Quicktime 			: { src:'quicktime', 			dependencies:null, 			name:'Quicktime', 				ext:['mov', 'mpeg', 'mpg', 'avi', 'acc', 'qt', 'wav', 'au'] },
	RealPlayer 			: { src:'realplayer', 			dependencies:null, 			name:'RealPlayer', 				ext:['ra', 'ram', 'rv', 'rpm'] },
	WindowsMediaPlayer 	: { src:'windowsmediaplayer', 	dependencies:null, 			name:'WindowsMediaPlayer', 		ext:['wmv', 'wma', 'wvx', 'wax', 'asf', 'asx'] },
	Divx 				: { src:'divx', 				dependencies:null, 			name:'DivX', 					ext:['divx'] },
	Shockwave			: { src:'shockwave',			dependencies:null, 			name:'Shockwave', 				ext:['dcr'] }
};

// the library object that contains the loaded plugin libraries
PO.L = {};

// The message library
PO.M = {
	throw_errors: true,
	throw_debug: true,
	Debug : {
		OnForce				: 'PluginObject: The plugin you tried to force embed "%src%" could not be embedded using the plugin specified by options.force_plugin. Attempting to automagically guess the plugin type.',
		OnRequireLoad		: 'PluginObject: The plugin you tried to force embed "%src%" could not be embedded as you have disabled auto loading of plugin libraries in options.auto_load.'
	},
	Error : {
		OnFail				: 'The current version of the %library% plugin is too old. You currently have version %version% but you need at least version %required% to view this plugin. We suggest that you upgrade %library% to the latest version. To upgrade please <a href="%upgrade%" target="_blank">click here</a>. However, you may wish to try running the plugin in your current version <a href="%nodetect%">click here</a>.',
		OnAutoMagic			: 'PluginObject ERROR: The plugin you tried to force embed "%src%" could not be embedded automagically. Perhaps you need to specify which plugin to use by setting the Plugin in options.force_plugin.',
		OnLibrary			: 'PluginObject ERROR: The plugin library you tried to use was successfully loaded, however it has either loaded an incorrect file or you have malformed library code as the "%library%" library cannot be accessed.',
		OnWrite				: 'PluginObject ERROR: It was not possible embed "%src%" because the element "%elm%" was not found in the DOM.',
		OnWriteSealed		: 'PluginObject ERROR: It was not possible embed "%src%" because the DOM has already finished loading so document.write(); could not be used.',
		OnWriteSealedDyLoad	: 'PluginObject ERROR: It was not possible embed "%src%" because the DOM has already finished loading so document.write(); could not be used. HOWEVER, this has only occurred because the plugin library was required to dynamically load. You can get around this issue by including the required libraries after the pluginobject script link, or specifing an element id to load the media into using option.force_into_id.'
	},
	parse : function(m, r)
	{
		if(r)
		{
			for(var a in r)
			{
				m = m.split('%'+a+'%').join(r[a]);
			}
		}
		return m;
	},
	call: function(m, r, t)
	{
		m = PO.M.parse(m, r);
		if(t == 'e' && PO.M.throw_errors) 
		{
			if(PO.U.Browser.IE) alert(m);
			else throw new Error(m); 
		}
		else if(PO.U.HasConsole && PO.M.throw_debug) console.log(m);
	}
};

// The default options object
PO.Options = {
	/**
	 * Required Options
	 * - width
	 *		The width of the media.
	 * - height
	 *		The height of the media.
	 */
	width					: null,
	height					: null,
	
	/**
	 * Optional Options
	 * 	- require_min_version
	 *		If a minimum version of plugin is to be used you can then set an integer or string
	 *		version. For example, '6.0.4' or 6. If set to false no version checking is carried out
	 *		but checks are made to see if the plugin does exist.
	 * 	- auto_load
	 *	  	Determines if unloaded plugin sources should be dynamically loaded at runtime.
	 * 	- auto_embed
	 *	  	Determines if the plugin should be embeded automagically when the DOM is ready. If set
	 *		to false then you will have to call the write() function yourself.
	 * 	- force_plugin
	 *	  	If you wish to force a particular plugin type as opposed to the autodetected type. 
	 * 	  	The value would be one of the plugin Plugin values, ie  one of the values in 
	 * 	  	PluginObject.Plugins.Flash or similar. 
	 * 	- force_into_id
	 *	  	If you wish to embed the object into a particular element provide the element id to 
	 * 	  	this option. Note: if no id is supplied PO will automatically attempt
	 * 	  	to embed the media into the current element.
	 * 	- force_plugin_id
	 *	  	When PO creates the embed html it will automagically create it's own 
	 * 	  	unique id. If you want to force a plugin id set it here.
	 * 	- params
	 *		Any extra params you wish to provide the media with.
	 * 	- attributes
	 *		Any extra element attributes you wish to provide the media with.
	 * 	- no_cache
	 *		Append a random query string to the url so it doesn't cache.
	 */
	require_min_version		: 1, 
	auto_load				: true, 
	auto_load_prefix		: 'plugins/', 
	auto_load_suffix		: '.js', 
	auto_embed				: true, 
	force_plugin			: null, 
	force_into_id			: null,
	force_plugin_id			: null,
	params					: {},
	attributes				: {},
	no_cache				: false,
	
	/**
	 * Media Placeholder Options
	 * 	- placeholder
	 *		If you wish to use a click to display placeholder set this to the url of the 
	 *		image to use.
	 * 	- placeholder_alt
	 *		The placeholder image alt text to use.
	 * 	- placeholder_title
	 *		The title in the placeholder href.
	 * 	- placeholder_autoplay
	 *		Autoplays the media (if applicable) when the placeholder is clicked and the media is embeded.
	 */
	placeholder				: false,
	placeholder_alt			: 'PluginObject placeholder.',
	placeholder_title		: 'Click to view plugin.', 
	placeholder_autoplay	: true,
	
	/**
	 * On Fail Options
	 * 	- on_fail_message
	 *		The message that is displayed if the version is incorrect, note this is only 
	 * 		displayed if options.on_fail_redirect = false.
	 * 	- on_fail_redirect
	 *		If you wish for a redirection if the player fails then set this to the url 
	 * 		you wish to redirect to.
	 * 	- on_fail_callback
	 *		If you wish to use a custom on fail callback method. This will be called before 
	 * 		the on_fail_message and on_fail_redirect methods are checked. If you wish to fall 
	 *		back from your custom callback to these methods, this function must return a false 
	 *		(boolean) value.
	 */
	on_fail_message 		: PO.M.Error.OnFail,
	on_fail_redirect 		: false,
	on_fail_callback		: null,
	
	/**
	 * Skip Detection Options
	 * 	- skip_detect_allow
	 *		If you wish to use a click to display placeholder set this to the url of the 
	 *		image to use.
	 * 	- memorise_detect_status
	 *		The placeholder image alt text to use.
	 * 	- memorise_cookie_expiry
	 *		The title in the placeholder href.
	 * 	- memorise_cookie_path
	 *		The title in the placeholder href.
	 * 	- memorise_cookie_domain
	 *		The title in the placeholder href.
	 * 	- memorise_cookie_secure
	 *		The title in the placeholder href.
	 */
	skip_detect_allow		: true, 
	skip_detect_key			: 'skipdetect',
	memorise_detect_status	: true, 
	memorise_cookie_expiry	: new Date().getTime()+31449600000,
	memorise_cookie_path	: '/',
	memorise_cookie_domain	: null,
	memorise_cookie_secure	: false
};

// Utility methods
var _ua = navigator.userAgent.toLowerCase();
var _up = navigator.platform.toLowerCase();
PO.U = {
// 	borrowed from prototype and jquery
	Browser: {
		Version			: (_ua.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
		Safari			: /webkit/.test(_ua),
		Opera			: !!window.opera,
		IE				: !!(window.attachEvent && !window.opera),
		Mozilla			: /mozilla/.test(_ua) && !/(compatible|webkit)/.test(_ua),
		MobileSafari	: !!_ua.match(/apple.*mobile.*safari/),
		Gecko			: _ua.indexOf('gecko') > -1 && _ua.indexOf('khtml') == -1
	},
// 	borrowed from swfobject
	Platform: {
		Win 			: /win/.test(_up ? _up : ua),
		Apple			: /mac/.test(_up ? _up : ua),
		Linux			: /linux/.test(_up ? _up : ua)
	},
	HasConsole			: (window.console ? console.log : false),
	merge: function(u, d)
	{
		var c = {}, p;
		for (p in u) 
		{
			if(typeof u[p] != 'function')
			{
				c[p] = u[p];
			}
		}
		for (p in d) 
		{
			if(typeof d[p] != 'function')
			{
				if(typeof c[p] == 'undefined') c[p] = d[p];
			}
		}
		return c;
	},
	determinePluginType: function(s, t)
	{
// 		type is hard set, validate
		if(t)
		{
			if(!t || typeof t != 'object' || (!t.src || !t.name || !t.ext))
			{
				PO.M.call(PO.M.Debug.OnForce, {src:s}, 'd');
				t = false;
			}
			return t;
		}
// 		automagically guess plugin type from extension
		if(!t)
		{
			var ext = s.split('.').pop().toLowerCase();
			for(var a in PO.Plugins)
			{
				if(PO.Plugins[a].ext.inArray(ext))
				{
					return PO.Plugins[a];
				}
			}
		}
		PO.M.call(PO.M.Error.OnAutoMagic, {src:s}, 'd');
		return false;
	},
	loadPlugin: function(p, c,  o)
	{
		if(p.dependencies)
		{
			for(var i=0, a=p.dependencies.length; i<a; i++)
			{
				var pc, lp = p.dependencies[i];
				if(i == a-1) 
				{
					p.dependencies = null;
					pc = {f:PO.U.loadPlugin, a:[p, c,  o]};
				}
				else pc = null;
				PO.U.loadPlugin(PO.Plugins[lp], pc,  o);
			}
			return;
		}
		if(!PO.U._lpref[p.src]) PO.U._lpref[p.src] = [];
		var l = o.auto_load_prefix+p.src+o.auto_load_suffix, s, i = PO.U._lpref[p.src].push({p:p, c:c})-1;
		if(PO.DOM.Sealed || !PO.U.Browser.IE)
		{
			if (document.createElement && (s = document.createElement('script')))
			{
				s.src = l;
				s.type = 'text/javascript';
				s.onload = s.onreadystatechange = function(e)
				{
					PO.U._loadPlugin(p.src, i, e);
				};
				var h = document.getElementsByTagName('head')[0];
				if (h) h.appendChild(s);
			}
		}
		else
		{
			document.write('<scr'+'ipt type="text/javascript" src="'+l+'" onreadystatechange="PO.U._loadPlugin(\''+p.src+'\', '+i+', event);" onload="PO.U._loadPlugin(\''+p.src+'\', '+i+', event);"></'+'script>');
		}
	},
	_lpref: {},
	_loadPlugin: function(ref, i, e)
	{
		if(e.type == 'readystatechange' && e.srcElement.readyState != 'complete') return;
		var c = PO.U._lpref[ref][i];
		if(c.p.loaded == 2) return;
		c.p.loaded = 2;
		if(c.c) c.c.f.apply(c.c, c.c.a);
	},
	hash: function(l)
	{
		var c = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz", h ='', cl = c.length;
		for (var i=0; i<l; i++) 
		{
			var r = Math.floor(Math.random() * cl);
			h += c.substring(r,r+1);
		}
		return h;
	},
	getParam: function(p)
	{
		var q = document.location.search || document.location.hash;
		if(q)
		{
			var s = q.indexOf(p +'=');
			var e = (q.indexOf('&', s) > -1) ? q.indexOf('&', s) : q.length;
			if (q.length > 1 && s > -1)
			{
				return q.substring(q.indexOf('=', s)+1, e);
			}
		}
		return null;
	}
};

// DOM ready binding code lifted/inspired by jquery
PO.DOM = {
	Sealed: false,
	Ready : false,
	Bound : false,
	_f    : [],
	register: function(f, a, s)
	{
		var d = PO.DOM;
		if(d.Ready) 
		{
			if(s) s[f].apply(s, a);
			else f.apply(null, a);
			return;
		}
		PO.DOM._f.push({f:f, a:a, s:s});
	},
	commit: function(e)
	{
		var d = PO.DOM;
		if((e && e.load) || d.Ready) 
		{
			d.Sealed = true;
			if(d.Ready) return;
		}
		d.Ready = true;
		for(var i=0, l=d._f.length; i<l; i++)
		{
			if(d._f[i].s) d._f[i].s[d._f[i].f].apply(d._f[i].s, d._f[i].a);
			else d._f[i].f.apply(d._f[i], d._f[i].a);
		}
	},
	bind: function()
	{
		if(this.Bound) return;
		this.Bound = true;
		
// 		Mozilla, and webkit nightlies
		if (document.addEventListener && !PO.U.Browser.Opera) document.addEventListener('DOMContentLoaded', PO.DOM.commit, false);
		
// 		If IE is used and is not in a frame
// 		Continually check to see if the document is ready
		if (PO.U.Browser.IE && window == top) 
		{
			(function()
			{
				if (PO.DOM.Ready) return;
				try 
				{
// 					If IE is used, use the trick by Diego Perini
// 					http://javascript.nwbox.com/IEContentLoaded/
					document.documentElement.doScroll('left');
				} 
				catch( error ) 
				{
					setTimeout(arguments.callee, 0);
					return;
				}
				PO.DOM.commit();
			})();
		}

// 		Opera
		if (PO.U.Browser.Opera) document.addEventListener('DOMContentLoaded', function ()
		{
			if (PO.DOM.Ready) return;
			for (var i = 0; i < document.styleSheets.length; i++)
			{
				if (document.styleSheets[i].disabled) 
				{
					setTimeout(arguments.callee, 0);
					return;
				}
			}
			PO.DOM.commit();
		}, false);

// 		Safari
		if (PO.U.Browser.Safari) 
		{
			var stl = document.getElementsByTagName('link'), a, sl=0, sts, stsl;
			for(a=0, l=stl.length; a<l; a++)
			{
				if(stl.item(a).getAttribute('rel') == 'stylesheet') sl += 1;
			}
			(function(){
				if (PO.DOM.Ready) return;
				if (document.readyState != 'loaded' && document.readyState != 'complete')
				{
					setTimeout( arguments.callee, 0 );
					return;
				}
				var sts = document.getElementsByTagName('style');
				stsl = sts.length;
				if (document.styleSheets.length != sl+stsl) 
				{
					setTimeout(arguments.callee, 0);
					return;
				}
				PO.DOM.commit();
			})();
		}
		
// 		A fallback to window.onload, that will always work
		if (typeof window.addEventListener != 'undefined') 			window.addEventListener('load', PO.DOM.commit, false);
		else if (typeof document.addEventListener != 'undefined') 	document.addEventListener('load', PO.DOM.commit, false);
		else if (typeof window.attachEvent != 'undefined') 			window.attachEvent('onload', PO.DOM.commit);
		else if (typeof window.onload == 'function') 
		{
			var wol = window.onload;
			window.onload = function()
			{
				wol();
				PO.DOM.commit();
			};
		}
		else window.onload = PO.DOM.commit;
	}
};

PO.embed = function(src, opt)
{
	o = PO.U.merge(opt, PO.Options);
	p = PO.U.determinePluginType(src, o.force_plugin);
	if(p)
	{
		if(p.loaded > 0)
		{
			if(!PO.L[p.name])
			{
				setTimeout(PO.embed, 10, src, opt);
				return;
			}
			if(!PO.L[p.name])
			{
				PO.M.call(PO.M.Error.OnLibrary, {src:src, library:p.name}, 'e');
				return false;
			}
			var sk = o._skip_detect_key = o.skip_detect_key+'-'+p.name, gp = PO.U.getParam(sk), cn = 'PO-'+p.name+'-Memory=', sd = false;
			if(gp)
			{
				sd = gp == 'true';
				if(o.memorise_detect_status)
				{
					var t = (new Date()).getTime(), e = o.memorise_cookie_expiry, c = cn + gp
						+ '; expires=' + (new Date( t > e ? t + e : e )).toGMTString()
						+ (o.memorise_cookie_path ? '; path=' + o.memorise_cookie_path : '')
						+ (o.memorise_cookie_domain ? '; domain=' + o.memorise_cookie_domain : '')
						+ (o.memorise_cookie_secure ? '; secure' : '');
				}
			}
			else
			{
				if(o.memorise_detect_status)
				{
					var cp = document.cookie.indexOf(escape(cn)+'='), cv = false;
					if(cp != -1)
					{
						var pv = p + cn.length, ep = document.cookie.indexOf(';', pv);
						cv = unescape(document.cookie.substring(pv, ep != -1 ? ep : null));
						sd = cv == 'true';
					}
				}
			}
			o._skip_detect = (sd && o.skip_detect_allow);
			o.attributes = PO.U.merge(o.attributes, {
				width 		: o.width,
				height 		: o.height
			});
			return PO.L[p.name].create(src, o, p);
		}
		else if(o.auto_load)
		{
			opt.force_plugin = p;
			PO.U.loadPlugin(p, {f:PO.embed, a:[src, opt]}, o);
			return true;
		}
		else
		{
			PO.M.call(PO.M.Debug.OnRequireLoad, {src:src, library:p.name}, 'd');
			return false;
		}
	}
};

// the player version object for detecting which is correct version
// orginal idea geoff stearns and swfobject.
PO.U.PlayerVersion = function(v)
{
	var ma = parseInt(v[0]);
	this.ma = ma != null ? ma : 0;
	this.mi = parseInt(v[1]) || 0;
	this.r = parseInt(v[2]) || 0;
};
PO.U.PlayerVersion.prototype = {
	validate: function(v)
	{
		if(this.ma < v.ma) return false;
		if(this.ma > v.ma) return true;
		if(this.mi < v.mi) return false;
		if(this.mi > v.mi) return true;
		return !(this.r < v.r);
	},
	toString: function()
	{
		return [this.ma, this.mi, this.rev].join('.');
	}
};

// the object embed writer
PO.ObjectEmbed = function(src, o, lp, rp)
{
	this._id = o._id = o.force_plugin_id ? o.force_plugin_id : 'PluginObject-'+PO.U.hash(8)+'-'+(new Date()).getTime();
	this.src = src;
	this.plugin = lp;
	this._rp = rp;
	o.attributes = PO.U.merge(o.attributes, {
		codebase 		: o.codebase,
		class_id 		: o.class_id,
		mime_type 		: o.mime_type
	});
	o.attributes = PO.U.merge({
		width 			: o.width,
		height 			: o.height
	}, o.attributes);
	this.options = o;
	this.attributes = o.attributes || {};
	this.params = o.params || {};
	this.Version = {
		Required  : o.version ? new PO.U.PlayerVersion(o.version.toString().split('.')) : new PO.U.PlayerVersion([1,0,0]),
		Valid 	  : false,
		Installed : false
	};
	
	if(o.no_cache) this.src += (this.src.indexOf('?') === -1 ? '?' : '&') + (new Date()).getTime();
	
	if(!o._skip_detect) this.Version.Installed = lp.detectVersion(o, this.Version.Required);
	if(o._skip_detect || this.Version.Installed != -1)
	{
		this.Version.Valid = o._skip_detect ? true : this.Version.Installed.validate(this.Version.Required);
		if(o.auto_embed && o.force_into_id) PO.DOM.register('write', [], this);
		else this.write();
	}
};
PO.ObjectEmbed.prototype = {
	write: function()
	{
		var el, o = this.options, h, elnf;
		if(typeof o.force_into_id == 'string') 
		{
			if(!(el = document.getElementById(o.force_into_id))) PO.M.call(PO.M.Error.OnWrite, {src:this.src, elm:o.force_into_id}, 'e');
		}
		elnf = typeof el == 'undefined';
		if(this.Version.Valid)
		{
			h = (o.placeholder) ? this._placeholder() : this._html();
			if(elnf)
			{
				if(PO.DOM.Ready && this._rp.loaded == 2) PO.M.call(PO.M.Error.OnWriteSealedDyLoad, {src:this.src}, 'e');
				else document.write(h);
			}
			else el.innerHTML = h;
			return true;
		}
		else
		{
			if(o.on_fail_redirect) 
			{
				document.location.replace(o.on_fail_redirect);
			}
			else
			{
				var nd = document.location.href, m;
				nd += (nd.indexOf('?') == -1 ? '?' : '&')+o._skip_detect_key+'=true';
				m = PO.M.parse(o.on_fail_message, {library:this._rp.name, version:this.Version.Installed.toString(), required:this.Version.Required.toString(), upgrade:o.upgrade_url, nodetect:nd});
				if(elnf)
				{
					if(PO.DOM.Sealed) alert(m);
					else document.write(m);
				}
				else el.innerHTML = m;
			}
		}
		return false;
	},
	_placeholder: function()
	{
		var o = this.options, h;
		PO.R[this._id] = this;
		h = '<img id="PlaceHolder-'+this._id+'" src="'+o.placeholder+'" width="'+o.width+'" height="'+o.height+'" title="'+o.placeholder_title+'" alt="'+o.placeholder_alt+'" style="cursor:pointer;" onclick="PO.R[\''+this._id+'\']._activate();" />';
		if(!o.force_into_id) h = '<div id="Wrapper-'+this._id+'">'+h+'</div>';
		return h;
	},
	_activate: function()
	{
		var o = this.options, el = document.getElementById('PlaceHolder-'+this._id);
		o.placeholder = null;
		el.parentNode.removeChild(el);
		if(!o.force_into_id) o.force_into_id = 'PlaceHolder-Wrapper-'+this._id;
		this.write();
	},
	_html: function()
	{
		var h = '', a = this.attributes, p = this.params;
		if(PO.U.Browser.IE)
		{ 
			h = '<object id="'+ this._id +'" classid="'+ a.class_id +'" codebase="'+a.codebase+'" width="'+ a.width +'" height="'+ a.height +'"><param name="src" value="'+ this.src +'" />';
			for(var key in p) h += '<param name="'+ key +'" value="'+ p[key] +'" />';
			h += "</object>";
		}
//		PC IE
		else
		{ 
			h = '<embed type="'+ a.mime_type +'" src="'+ this.src +'" width="'+ a.width +'" height="'+ a.height +'" id="'+ this._id +'" name="'+ this._id +'" pluginspace="'+o.upgrade_url+'" ';
			for(var key in p) h += [key] +'="'+ p[key] +'" '; 
			h += '/>';
		} 
		return h;
	}
};

// bind the on content callbacks
PO.DOM.bind();
PluginObject = PO;
