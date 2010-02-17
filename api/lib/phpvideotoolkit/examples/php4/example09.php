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
	 */

	echo '<html><head><link type="text/css" rel="stylesheet" href="../common/styles.css"><meta name="author" content="Oliver Lillie"></head><body>';
	echo '<a class="backtoexamples" href="../index.php#examples">&larr; Back to examples list</a><br /><br />';
	echo '<strong>This example shows you how to access the information about your ffmpeg installation.</strong><br /><br />';
	$ignore_demo_files = true;	
	
// 	load the examples configuration
	require_once '../example-config.php';
	
// 	require the library
	require_once '../../phpvideotoolkit.'.$use_version.'.php';
	
// 	temp directory
	$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'tmp'.DS;
	
// 	start ffmpeg class
	$toolkit = new PHPVideoToolkit($tmp_dir);
	
// 	get the ffmpeg info
	$info = $toolkit->getFFmpegInfo();
	
// 	determine the type of support for ffmpeg-php
	echo '<strong>FFmpeg-PHP Support</strong><br />';
	
// 	determine if ffmpeg-php is supported
	$has_ffmpeg_php_support = $toolkit->hasFFmpegPHPSupport();
// 	you can also determine if it has ffmpeg php support with below
// 	$has_ffmpeg_php_support = $info['ffmpeg-php-support'];

	switch($has_ffmpeg_php_support)
	{
		case 'module' :
			echo 'Congratulations you have the FFmpeg-PHP module installed.<br />';
			break;
			
		case 'emulated' :
			echo 'You haven\'t got the FFmpeg-PHP module installed, however you can use the PHPVideoToolkit\'s adapter\'s to emulate FFmpeg-PHP.<br />In order to make use of the FFmpeg-PHP adapter class all you need to do is add the following, replacing xxxx with the path to the files, then use FFmpeg-PHP as normal.
<br /><pre>	if(!class_exists(\'ffmpeg_movie\')) 
	{
		require_once \'xxxx/adapters/ffmpeg-php/ffmpeg_movie.php\';
		require_once \'xxxx/adapters/ffmpeg-php/ffmpeg_frame.php\';
		require_once \'xxxx/adapters/ffmpeg-php/ffmpeg_animated_gif.php\';
	}</pre><strong>Note:</strong> It is recommended that if you heavily use FFmpeg-PHP that you install the module. <br />
';
			break;
			
		case false :
			echo 'You have no support at all for FFmpeg-PHP.<br />';
			break;
	}
	
	echo '<br /><strong>This is the information that is accessible about your install of FFmpeg.</strong><br />';
	echo '<span class="small">You may also wish to see <a href="example14.php">example 14</a> which gives you an encode/decode lookup table.</span>';
	echo '<pre>';
	print_r($info);
	echo '</pre>';
    echo '</body></html>';
	