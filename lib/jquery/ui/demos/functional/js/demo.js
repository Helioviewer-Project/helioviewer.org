var uid = 0;

/**
 * Render a demo template page
 * @author Eduardo Lundgren (braeker)
 * @param {Object} model
 */
var uiRenderDemo = function(model) {

	var title = model.title, renderAt = $(model.renderAt);

	renderAt.append(
		'<h1>'+ title +'</h1><br>'
	);

	$.each(model.demos, function(i, demo) {
		
		/**
		 * Rendering each demo
		 */

		if (!demo) return;
		
		var uiHtmlRendered = $('<div class="ui-html-rendered"></div>');
		
		if (model.onRenderStart) model.onRenderStart.apply(window);
		
		var gid = 'ui-gen-'+uid++, demoBox = $('<div id="'+gid+'">');

		renderAt.append(demoBox);

		var detailsHtml = $(
			'<br><div class="ui-details"><div class="menutitle">'+demo.title+'</div></div>'
		);
		
		var descBox = $(
			'<div class="ui-demo-description">'+(demo.desc||'')+'</div>'
		);
		
		var optionsBox = $(
			'<div class="ui-demo-options"><label for="select-'+gid+'">More options:</label></div>'
		);
	
		var codesBox = $(
			'<div id="code-'+gid+'">'
		)
		.css({display: 'none'});

		var sourceTmpl = $(
			'<div class="ui-demo-view-code snippet"></div>'
		);
		
		var preTmpl = $(
			'<pre></pre>'
		);
		
		var codeTmpl = $(
			'<code></code>'
		);
		
		var htmlCode = '', sourceHtml = sourceTmpl.clone(), sourceJs = sourceTmpl.clone(), entitiesHtml = function(html) {
			return html.replace(/</g,"&lt;").replace(/>/g,"&gt;");
		};
		
		// Render simple HTML
		if (typeof demo.html == 'string') {
			uiHtmlRendered.html(demo.html);
			htmlCode = demo.html;
		}
		// Render data html by URL
		if (typeof demo.html == 'object' && demo.html.url) {
			
			$.ajax({ 
				type: "GET", 
				url: demo.html.url,
				cache: false,
				success: function(data) {
					uiHtmlRendered.html(data);
					htmlCode = data;
					
					// set html code view
					sourceHtml.html(preTmpl.clone().html( codeTmpl.clone().html(entitiesHtml(htmlCode)) ));
					
					$.each(demo.options, function(x, o) {
						// eval the first source of <select>
						if (!x) jQuery.globalEval(o.source);
					});
					
					// fire renderEnd callback to ajax async transactions
					if (model.onRenderEnd) model.onRenderEnd.apply(window);
				}
			});
			
		}
		// set html code view
		sourceHtml.html(preTmpl.clone().html( codeTmpl.clone().html(entitiesHtml(htmlCode)) ));

		var select = $('<select id="select-'+ gid+'">').change(function() {
			var ecode = $(this).val();

			jQuery.globalEval(demo.destroy);
			jQuery.globalEval(ecode);

			sourceJs.html(preTmpl.html(ecode));
		});

		var a = $('<a>View Source</a>').attr('href', 'javascript:void(0);').addClass('link-view-source').click(function() {
			el = this;
			codesBox.slideToggle("slow", function(){
				var text = $(el).text();
				if(/view source/i.test(text)) {
					$(el).text("Hide Source");
				} else {
					$(el).text("View Source");
				}
			});
		});

		demoBox.append(
			detailsHtml, descBox, uiHtmlRendered, optionsBox.append(
				select, a, '<br>', codesBox.append('<br>JavaScript:<br><br>', sourceJs, 'HTML:<br><br>', sourceHtml)
			)
		);
		
		// population select with the demo options
		$.each(demo.options, function(x, o) {
			if (o && o.desc) {
				select.append($('<option>' + o.desc + '</option>').val(o.source));
				// eval the first source of <select>
				if (!x) {
					sourceJs.html(preTmpl.html(o.source));
					jQuery.globalEval(o.source);
				}
			}
		});
		
		// fire renderEnd callback to direct-html-render
		if (typeof demo.html != 'object' && model.onRenderEnd) model.onRenderEnd.apply(window);
		
	});
};

var loadDemo = function(comp) {
	$('#containerDemo').html("<img src='img/loading.gif'>");
	
	$("#containerDemo").ajaxError(function(request, settings){ 
		$(this).html("Ops, there is no template file for this component."); 
	});
	
	$.get(comp+'.html', function(data) {
		$('#containerDemo').html(data);
	});
};