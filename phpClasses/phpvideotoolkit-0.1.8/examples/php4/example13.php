<?php

	/* SVN FILE: $Id$ */
	
	/**
	 * @author Oliver Lillie (aka buggedcom) <publicmail@buggedcom.co.uk>
	 * @package PHPVideoToolkit
	 * @license BSD
	 * @copyright Copyright (c) 2008 Oliver Lillie <http://www.buggedcom.co.uk>
	 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
	 * files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
	 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
	 * is furnished to do so, subject to the following conditions:  The above copyright notice and this permission notice shall be
	 * included in all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
	 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
	 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
	 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
	 * @see JEROEN WIJERING Flash Media Player, 
	 * 		- @link http://www.jeroenwijering.com/?item=JW_FLV_Media_Player
	 * 		- @author Jeroen Wijering.
	 */

// 	set the packet details as we are restricting the bandwidth
// 	the default details set here mean 5kb per second, ie dialup speed.
	$packet_size = isset($_GET['packet_size']) ? intval($_GET['packet_size']) : (isset($_COOKIE['packet_size']) ? intval($_COOKIE['packet_size']) : 5); 
	$packet_interval = 1;
	setcookie('packet_size', $packet_size, time()+7200, '/');

	if(!isset($_GET['file']))
	{
		echo '<html><head><link type="text/css" rel="stylesheet" href="../common/styles.css"><script type="text/javascript" charset="utf-8" src="../common/pluginobject/pluginobject.js"></script><script>PO.Options.auto_load_prefix="../common/pluginobject/plugins/";</script><meta name="author" content="Oliver Lillie"></head><body>';
		echo '<a class="backtoexamples" href="../index.php#examples">&larr; Back to examples list</a><br /><br />';
		echo '<strong>This example shows how to simply create an FLV stream script.</strong><br />';
		echo '<span class="small">&bull; The flash media player used below is Jeroen Wijering\'s excellent <a href="http://www.jeroenwijering.com/?item=JW_FLV_Media_Player">Flash Media Player</a>. Although bundled with this package the Flash Media Player has a <a href="http://creativecommons.org/licenses/by-nc-sa/2.0/">Creative Commons Attribution-Noncommercial-Share Alike 2.0 Generic</a> license.</span><br />';
		echo '<span class="small">&bull; The media is embedded using <a href="http://sourceforge.net/projects/pluginobject/">PluginObject</a> to embed the examples. It is distributed under a BSD License.</span><br /><br />';
	}
	
// 	load the examples configuration
	$ignore_config_output = true;
	require_once '../example-config.php';
	
// 	set the flv file
	$flv = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'rickroll.flv';
	
// 	require the library
	require_once '../../phpvideotoolkit.'.$use_version.'.php';
// 	temp directory
	$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'tmp'.DS;
// 	start ffmpeg class
	$toolkit = new PHPVideoToolkit($tmp_dir);
		
	if(isset($_GET['file']))
	{
// 		set the flv input
		$toolkit->setInputFile($flv);
// 		get the incoming stream position
		$stream_pos = isset($_GET['pos']) ? $_GET['pos'] : 0;
// 		in this example we will enable bandwidth limiting at the extreme and is not really practicle for live purposes
// 		it will only release 100 bytes of the file every second, thus it should take roughly 5 minutes to release a 29Mb file
// 		it will also prevent the browser cache from retaining the file.
		$toolkit->flvStreamSeek($stream_pos, array('active'=>true, 'packet_size'=>$packet_size, 'packet_interval'=>$packet_interval), false);
		exit;
//<-	exits 		
	} 
	
	$size = filesize($flv);
	echo '<strong>Bandwidth Restrictions and Download Rate.</strong><br />';
	echo 'The flv media is '.$size.' bytes, using the bandwidth speed limit of '.$packet_size.' kb/s media should be completely loaded in roughly '.$toolkit->formatSeconds(round($size/($packet_interval*1024*$packet_size*2), 1), '%hh hours, %mm minutes, %ss.%ms seconds').'.<br />';
	echo 'This may not appear to be the case in the player as the player will buffer the contents, You should notice that after a while the player will re-buffer the file. This is because the file was not loaded directly but through this script which buffered the release of the flv.<br />';
	echo 'However you can test this better by downloading <a href="example13.php?file=../working/to-be-processed/rickroll.flv&pos=0&packet_size='.$packet_size.'">this link</a>.<br />';
	echo 'You should notice that the file is downloading as a normal file off the internet, however the flv will download at a extremely slowed rate (more like dial-up speed than broadband or DSL) even if you are testing this script on your localhost.<br />';
	echo '<br />';
	echo '<strong>Change the example bandwidth restriction.</strong><br />';
	echo '<select onchange="document.location.href=\''.$_SERVER['PHP_SELF'].'?packet_size=\'+this.value">
<option label="5 kb/s (Dialup)" value="5"'.($packet_size == '5' ? ' selected' : '').'>5 kb/s (Dialup)</option>
<option label="10 kb/s" value="10"'.($packet_size == '10' ? ' selected' : '').'>10 kb/s</option>
<option label="20 kb/s" value="20"'.($packet_size == '20' ? ' selected' : '').'>20 kb/s</option>
<option label="40 kb/s" value="40"'.($packet_size == '40' ? ' selected' : '').'>40 kb/s</option>
<option label="80 kb/s" value="80"'.($packet_size == '80' ? ' selected' : '').'>80 kb/s</option>
<option label="160 kb/s" value="160"'.($packet_size == '160' ? ' selected' : '').'>160 kb/s</option>
</select><br />
<br />
<div id="embed-div"></div>
<script type="text/javascript" charset="utf-8">
PluginObject.embed("../../working/to-be-processed/rickroll.flv", {
	width : 400,
	height: 320,
	force_plugin:PluginObject.Plugins.FlashMedia,
	player: "../common/mediaplayer/player.swf",
	force_into_id:"embed-div",
	auto_fix_path:false,
	variables: { 
		bufferlength : 3,
		streamer: "../../php4/example13.php",
		autostart: true
    }
});         
</script><br />
</body></html>';

  

// echo '<embed 
// src="mediaplayer/mediaplayer.swf" 
// width="400" 
// height="320"
// allowfullscreen="true" 
// flashvars="width=400&height=320&autostart=true&file=example13.php?file=to-be-processed/rickroll.flv&searchbar=false&streamscript=../example13.php" 
// />';    
