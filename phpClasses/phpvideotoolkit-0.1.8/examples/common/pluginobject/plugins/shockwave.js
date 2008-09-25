PO.L.Shockwave = {
	
	options: {
		upgrade_url			: 'http://www.adobe.com/shockwave/download/',
		class_id			: 'clsid:166B1BCA-3F9C-11CF-8075-44455354000',
		codebase			: 'http://download.macromedia.com/pub/shockwave/cabs/director/sw.cab',
		mime_type			: 'application/x-director'
	},
	
	params: {}, 
	attributes: {},
	
	create: function(src, o, p)
	{
		o = PO.U.merge(o, PO.L.Shockwave.options);
		
		o.params = PO.U.merge(o.params || {}, PO.L.Shockwave.params);
		o.attributes = PO.U.merge(o.attributes || {}, PO.L.Shockwave.attributes);
		
		return new ObjectEmbed(src, o, PO.L.Shockwave, p);
	},
	
	_installed_version: false,
	detectVersion: function(o, rv)
	{
		if(PO.L.Shockwave._installed_version) return PO.L.Shockwave._installed_version;
		var pv = new PO.U.PlayerVersion([0,0,0]);
		if (navigator.mimeTypes && navigator.mimeTypes["application/x-director"]&& navigator.mimeTypes["application/x-director"].enabledPlugin)
		{
// 			http://kb.adobe.com/selfservice/viewContent.do?externalId=tn_15722&sliceId=1
// 			todo
		}
		else
		{
// 			todo
		}
		PO.L.Shockwave._installed_version = pv;
		return pv;
	}
	
};
PO.Plugins.Shockwave.loaded = 1;