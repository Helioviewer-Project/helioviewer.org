function startTutorial(){
	$(document).trigger("center-viewport");

	if(Helioviewer.userSettings.get("state.drawers.#hv-drawer-left.open") == false){
		helioviewer.drawerLeftClick(true);
	}
	
	boneVojage([
        {
			selector: '#moving-container',
			text: '<b>Viewport</b><br><br>Displays the selected image data and/or solar features and event markers. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Viewer_window" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'bottom'
		},{
			selector: '#accordion-date',
			text: '<b>Time selector</b><br><br>Select the Date/Time of the data to display in the Viewport. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Time_selector" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'bottom_right'
		},{
			selector: '#accordion-images',
			text: '<b>Image selector</b><br><br>Add, change and overlay images. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Overlay_selector" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'best'
		},{
			selector: '#accordion-events',
			text: '<b>Features & Events</b><br><br>Use the Solar Features & Events checkbox interface to select annotations to overlay onto the images in the viewport. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Events_selector" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'top_right'
		},{
			selector: '#accordion-bodies',
			text: '<script>if($("#accordion-events .disclosure-triangle:first").hasClass("closed")===false){$("#accordion-events .disclosure-triangle:first").addClass("closed");$("#accordion-events .content, #soho-dynaccordion .dynaccordion-cell, #stereo_a-dynaccordion .dynaccordion-cell, #stereo_b-dynaccordion .dynaccordion-cell").css("display","none");}</script><b>Celestial Bodies</b><br><br>Use the Celestial Bodies checkbox interface to select Labels and/or Trajectories to overlay onto the images in the viewport. Use the Next/Last buttons in the Trajectory sub-section to skip to the Next/Last trajectory relative to the current observation time. Click on Celestial Body and Satelite labels to reveal more information. Hover over points in trajectory overlay to reveal date information. Click on points in trajectory overlay to set the observation time to that point.',
			position: 'best'
		},{
			selector: '#zoom',
			text: '<b>Zoom tool</b><br><br>Allows zooming in/out and recentering of data in the viewer window. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Zooming_tool" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'bottom'
		},{
			selector: '#mouse-coords-box',
			text: '<b>Mouse Coordinates</b><br><br>The location of the mouse is reported. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#coordinates" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'bottom'
		},{
			selector: '#scale',
			text: '<b>Size-of-Earth Indicator</b><br><br>User can select one of the two types of Scale indicators.  <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Scaling" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'bottom'
		},{
			selector: '#menus',
			text: '<b>Navigation Menu</b><br><br><p style="text-align:left"><div class="tutappicons_box"><img src="https://beta.helioviewer.org/resources/images/projectanounce_icon_white.png">&nbsp;&nbsp; Helioviewer Project Announcements.</div>\
<div class="tutappicons_box"><img src="/resources/images/viewyoutube_icon_white.png">&nbsp;&nbsp;View Helioviewer Movies Shared to YouTube.</div>\
<div class="tutappicons_box"><img src="/resources/images/createmovie_icontest.png">&nbsp;&nbsp;Create a movie.</div>\
<div class="tutappicons_box"><img src="/resources/images/screenshot_icon_white.png">&nbsp;&nbsp;Create a screenshot.</div>\
<div class="tutappicons_box"><img src="/resources/images/datadownload_icon_white.png">&nbsp;&nbsp;Request Science Data Download from External Partners.</div>\
<div class="tutappicons_box"><img src="/resources/images/shareviewport_icon_white.png">&nbsp;&nbsp;Share the current viewport on social media.</div>\
<div class="tutappicons_box"><img src="/resources/images/help_icon_white.png">&nbsp;&nbsp;Get Help with Helioviewer.</div>\
<div class="tutappicons_box"><img src="/resources/images/setting_icon_white.png">&nbsp;&nbsp;Edit Settings &amp; Defaults.</div></p><br></br> <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Sidebar_Panels" target="_blank">Click here <span class="fa fa-external-link fa-fw"></span></a> to read about each menu item and functionality.',
			position: 'bottom'
		},{
			selector: '#hv-drawer-tab-timeline',
			text: '<b>Image Timeline</b><br><br>Contain Data Availability Timeline and other time-series data for selected image sources. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Image_timeline" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'top'
		},{
			selector: '#hv-drawer-tab-timeline-events',
			text: '<b>Events Timeline</b><br><br>Allow to browse data using features and events, and to select data based on those features and events. <a href="http://wiki.helioviewer.org/wiki/Helioviewer.org_User_Guide_3.1.0#Events_timeline" target="_blank">More... <span class="fa fa-external-link fa-fw"></span></a>',
			position: 'top'
		}
	], {
		delay:0
	});
	
	$('.tutorial-greeting').jGrowl("close");

}
