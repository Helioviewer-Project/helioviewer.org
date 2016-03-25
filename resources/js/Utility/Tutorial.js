function startTutorial(){
	if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-left.open") == false){
		helioviewer.drawerLeftClick(true);
	}
	
	boneVojage([
        {
			selector: '#moving-container',
			text: '<b>Viewport</b><br><br>Displays the selected image data and/or solar features and event markers. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Viewer_window" target="_blank">More...</a>',
			position: 'bottom'
		},{
			selector: '#accordion-date',
			text: '<b>Time selector</b><br><br>Select the Date/Time of the data to display in the Viewport. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Time_selector" target="_blank">More...</a>',
			position: 'bottom_right'
		},{
			selector: '#accordion-images',
			text: '<b>Image selector</b><br><br>Add, change and overlay images. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Overlay_selector" target="_blank">More...</a>',
			position: 'best'
		},{
			selector: '#accordion-events',
			text: '<b>Features & Events</b><br><br>Use the Solar Features & Events checkbox interface to select annotations to overlay onto the images in the viewport. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Events_selector" target="_blank">More...</a>',
			position: 'top_right'
		},{
			selector: '#zoom',
			text: '<b>Zoom tool</b><br><br>Allows zooming in/out and recentering of data in the viewer window. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Zooming_tool" target="_blank">More...</a>',
			position: 'bottom'
		},{
			selector: '#mouse-coords-box',
			text: '<b>Mouse Coordinates</b><br><br>The location of the mouse is reported. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#coordinates" target="_blank">More...</a>',
			position: 'bottom'
		},{
			selector: '#scale',
			text: '<b>Size-of-Earth Indicator</b><br><br>User can select one of the two types of Scale indicators.  <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Scaling" target="_blank">More...</a>',
			position: 'bottom'
		},{
			selector: '#menus',
			text: '<b>Navigation Menu</b><br><br><p style="text-align:left"><img src="http://wiki.helioviewer.org/w/images/c/c7/Icon-rss.png"> : Helioviewer Project Announcements.<BR>\
<img src="http://wiki.helioviewer.org/w/images/9/9f/Icon-youtube.png"> : View Helioviewer Movies Shared to YouTube.<BR>\
<img src="http://wiki.helioviewer.org/w/images/5/53/Icon-movie.png"> : Create a movie.<BR>\
<img src="http://wiki.helioviewer.org/w/images/6/69/Icon-screenshot.png"> : Create a screenshot.<BR>\
<img src="http://wiki.helioviewer.org/w/images/6/61/Icon-data.png"> : Request Science Data Download from External Partners.<BR>\
<img src="http://wiki.helioviewer.org/w/images/3/33/Icon-share.png"> : Share the current viewport on social media.<BR>\
<img src="http://wiki.helioviewer.org/w/images/8/87/Icon-help.png"> : Get Help with Helioviewer.<BR>\
<img src="http://wiki.helioviewer.org/w/images/e/e1/Icon-settings.png"> : Edit Settings &amp; Defaults.</p><br></br> <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Sidebar_Panels" target="_blank">Click here</a> to read about each menu item and functionality.',
			position: 'bottom'
		},{
			selector: '#hv-drawer-tab-timeline',
			text: '<b>	Image Timeline</b><br><br>Contain Data Availability Timeline and other time-series data for selected image sources. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.0.0#Image_timeline" target="_blank">More...</a>',
			position: 'top'
		}
	], {
		delay:0
	});
	
}