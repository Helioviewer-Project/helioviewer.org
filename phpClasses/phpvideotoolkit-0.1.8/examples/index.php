<?php

	/* SVN FILE: $Id$ */
	
	ini_set('error_reporting', E_ALL);
	ini_set('track_errors', '1');
	ini_set('display_errors', '1');
	ini_set('display_startup_errors', '1');
	
	session_start();

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
// 	print_r(array(__LINE__));exit;
	
// 	from php notes on file_get_contents
	function curl_get_file_contents($URL)
    {    
		if(ini_get('allow_url_fopen'))
		{
			return file_get_contents($URL);
		}
        $c = curl_init();
        curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($c, CURLOPT_URL, $URL);
        $contents = curl_exec($c);
        curl_close($c);
        if ($contents) return $contents;
            else return FALSE;
    }	

	if(isset($_SESSION['current_version']))
	{
		$release_date 		= $_SESSION['current_version']['date'];
		$release_version 	= $_SESSION['current_version']['version'];
		$release_link 		= $_SESSION['current_version']['link'];
	}
	else
	{
		$downloads_page = curl_get_file_contents('http://sourceforge.net/project/showfiles.php?group_id=222844');
		if($downloads_page !== false)
		{
			$_SESSION['current_version'] = array();
			
			$downloads_page = str_replace(array("\r\n", "\r", "\n", "\t"), '', $downloads_page);
			
			preg_match('!\<table cellpadding="0" cellspacing="0" summary="Latest file listings"><caption>The latest file releases</caption>(.*)</table>!', $downloads_page, $matches);
			preg_match('!<td>(.*)</td>!', $matches[1], $matches);
			$data = substr($matches[1], 0, strpos($matches[1], '</a>',  strpos($matches[1], '</a>')+4));
			
			preg_match('!<td>([^</td>]+)</td>!', $matches[1], $matches);
			$_SESSION['current_version']['date'] = $release_date = $matches[1];
			
			preg_match_all('!href="([^\"]+)"!', $data, $matches);
			$_SESSION['current_version']['link'] = $release_link = 'http://sourceforge.net'.$matches[1][1];
			$_SESSION['current_version']['version'] = $release_version = substr($data, -5);
		}
		else
		{    
			$release_date = 'unknown';
			$release_version = 'unknown';
			$release_link = 'http://sourceforge.net/project/showfiles.php?group_id=222844';
		}
	}

	$changelog = file_get_contents('../CHANGELOG');
	$most_recent_changes = trim(substr($changelog, 0, strpos($changelog, "[", 15)));
	
// 	$ignore_version_warning = true;
	$ignore_demo_files = true;
	require_once 'example-config.php';
	require_once '../phpvideotoolkit.'.$use_version.'.php';
	$toolkit = new PHPVideotoolkit(PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'tmp'.DS);
	$current_version = $toolkit->version;
	$current_is_old = $release_date == 'unknown' ? -1 : version_compare($current_version, $release_version) === -1;
	
?><html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>PHPVideoToolkit, &copy; Oliver Lillie <?php echo date('Y'); ?></title>
	<meta name="author" content="Oliver Lillie">
	<link type="text/css" rel="stylesheet" href="common/styles.css">
</head>
<body id="top">
	<strong>PHPVideoToolkit &copy; Oliver Lillie, 2008</strong><br />
	<br />
	1. <a href="#about">About &amp; Current Version</a><br />      
	2. <a href="#recentchanges">Most Recent Changes</a><br />
	3. <a href="#installation">Installation</a><br />
	4. <a href="#support">Support &amp; Feedback</a><br />
	5. <a href="#examples">Examples</a><br />
	6. <a href="#license">License</a><br />
	7. <a href="#changelog">Changes</a><br />
	<br />
	<hr />
	<a id="about"></a><strong>About &amp; Current Version</strong><br />
	<br />
	The version of PHPVideoToolkit you currently have is "<?php echo $current_version; ?>".<br /><?php
	if($current_is_old === -1)
	{
?><strong class="alert">WARNING: It was not possible to retrieve the latest version number from the remote server. <br />
Please check you are using the latest version by visiting the <a href="<?php echo $release_link; ?>">Sourceforge downloads page</a>.</strong><br />
<?php
	}
	else if($current_is_old)
	{
?><br />
<br /><strong class="alert">Your current version of PHPVideoToolkit is old. The newer version, "<?php echo $release_version; ?>" was released on <?php echo $release_date; ?>. Please <a href="<?php echo $release_link; ?>">click here</a> to download the newer version.</strong><br />
<?php	
	}
	else
	{
?> <strong>Your current version is up to date.</strong><br />
<?php	
	}
	if($has_version_warning)
	{
?>	<br />
	<strong class="alert">Please note, it has been detected that you are running PHP4 and the examples will be automatically configured to use the phpvideotoolbox.php4.php class and the php4 examples instead of the php5 versions. Please note that whilst every effort has been made to unsure all the php5 development work is backported to the php4 class, I don't actually use php4 anymore so if something doesn't work as expected please let me know. <br />
		<br />
		Please also note that as php4 is now <a href="http://www.php.net/archive/2008.php#id2008-08-07-1">officially dead</a> I won't support php4 from version 0.2.0 of PHPVideoToolkit onwards.</strong><br /><?php
	}
	
?><br />
	This class is a wrapper around the FFmpeg, FLVTools2 and Mencoder programs to allow PHP developers to manipulate and convert video files in any easy to use object oriented way. It also currently provides FFmpeg-PHP emulation in pure PHP so you wouldn't need to compile and install the module. Note, it isn't intended as a FFmpeg-PHP replacement, only an alternative solution and it is recommended that if you make heavy use of the FFmpeg-PHP functionality you should install the module as it is more efficient.<br />
	<br />
	PHPVideoToolkit is pretty much the only video/audio class that you will need from now on. It performs several types of manipulation operations that include video format conversion, extract video frames into separate image files, assemble a video stream from a set of separate video images, extract audio from video, watermark videos and extracted frames. Several parameters can also be configured like the output video file format (which can be Flash video or any other supported by ffmpeg), video and audio bit rate and sample rate, video dimensions and aspect ratio. It can also retrieve information about the media file, such as duration, bitrate, framerate, format, dimensions, display aspect ratio, pixel aspect ratio, audio stereo, audio frequency and audio format, without any other additional library such as ffmpeg-php.<br />
	<br />
	The  home of PHPVideoToolkit is located at Sourceforge. Whilst I will make every effort to update the files at every location it is updated you should always check the <a href="http://phpvideotoolkit.sourceforge.net/">Sourceforge repository</a> for the latest version.<br />
	<br />
	<a href="http://sourceforge.net/projects/phpvideotoolkit/">http://sourceforge.net/projects/phpvideotoolkit/</a><br />
	<br />
	<a class="backtotop" href="#top">&uarr; Back to top</a><br />
	<br />
	<hr />
	<a id="mostrecent"></a><strong>Most Recent Changes</strong><br />
	<pre><?php echo $most_recent_changes; ?></pre>
	<a class="backtotop" href="#top">&uarr; Back to top</a><br />
	<hr />
	<a id="installation"></a><strong>Installation</strong><br />
	<br />
	If you already have FFmpeg, and optionally FLVTools2 and Mencoder installed on your server then you will not have to install anything. However if you do not have these binaries then please read the following <a href="../INSTALL">help file</a>. <i>Please be aware that I will not answer support requests for helping in installing FFmpeg or the other binaries as there is much information on the internet. If you are really stuck hire someone to do it, ie at rent-a-coder etc.</i><br />
	<br />
	<a class="backtotop" href="#top">&uarr; Back to top</a><br />
	<br />
	<hr />
	<a id="support"></a><strong>Support &amp; Feedback</strong><br />
	<br />
	I am currently redesigning the website and ask that all bug reports go through the <a href="http://sourceforge.net/tracker/?group_id=222844&atid=1056885">SourceForge forums/issue trackers</a>. However you may post support or help requests in the <a href="http://www.buggedcom.co.uk/discuss">PHP Video Toolkit Forum</a>.<br />
	<br />
	<a class="backtotop" href="#top">&uarr; Back to top</a><br />
	<br />
	<hr />
	<a id="examples"></a><strong>Examples</strong><br />
	<br />
	I have compiled a great number of examples to show you how to use PHPVideoToolkit. You can find links to the demo files and brief explanations about each below.<br />
	<i>Please be sure to edit the example-config.php file located in the examples folder.</i><br />
	<br /><ul>
		<li><a href="<?php echo $use_version; ?>/example01.php"><strong>Example 1</strong></a>, This example will show you how to quickly transcode a video into the commonly used Flash Video (FLV) format.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example02.php"><strong>Example 2</strong></a>, This will show you how to extract a series of frame grabs from a video source.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example03.php"><strong>Example 3</strong></a>, This shows you how to compile a movie from a series of images<!-- , and add a sound source -->.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example04.php"><strong>Example 4</strong></a>, This will show you how to watermark videos if your FFmpeg binary has been compiled with --enable-vhook. It will also show you how to watermark a frame grab.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example05.php"><strong>Example 5</strong></a>, This will display metadata information about the audio or video files without the need for having installed FFmpeg-PHP.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example06.php"><strong>Example 6</strong></a>, This will show you how to extract audio from a video.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example07.php"><strong>Example 7</strong></a>, This will show you how to join multiple videos together. <strong>(not currently complete)</strong><br /></li>
		<li><a href="<?php echo $use_version; ?>/example08.php"><strong>Example 8</strong></a>, <?php
	if($has_version_warning)
	{
?>		<strong class="alert">PHP5 Only!</strong> <?php
	}
?>This example utilizes the PHPVideoToolkit 'VideoTo' adapter class, to show you how to quickly and simply convert video to some predetermined common formats. <br /></li>
		<li><a href="<?php echo $use_version; ?>/example09.php"><strong>Example 9</strong></a>, This will show you how to access information about your FFmpeg binary.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example10.php"><strong>Example 10</strong></a>, This will demonstrate how to extract a specific frame from video.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example11.php"><strong>Example 11</strong></a>, <?php
	if($has_version_warning)
	{
?>		<strong class="alert">PHP5 Only!</strong> <?php
	}
?>This example utilizes the PHPVideoToolkit 'FFmpeg-PHP' adapters. It will demonstrate that it is possible to run an application/script without having to install the FFMmpeg-PHP module as the adapter classes provide a pure PHP based emulation of the module. Please note that these adapter classes require other libraries, <a href="http://code.google.com/p/php-reader/" target="_blank">php-reader</a> and <a href="http://www.phpclasses.org/browse/package/3163.html" target="_blank">GifEncoder</a>, which for convenience, have both been bundled (only with the SourceForge downloads, PHPClasses users will still have to download these packages or <a href="http://sourceforge.net/project/showfiles.php?group_id=222844">download the main package here</a>) with the PHPVideoToolkit package. Note, both of the required libraries are subject to different licenses than that of PHPVideoToolkit. However both licenses are compatible with commercial distribution (as of 24.09.2008)<br /></li>
		<li><a href="<?php echo $use_version; ?>/example12.php"><strong>Example 12</strong></a>, Shows you how you can simply and easily manipulate timecode strings to get them into whatever format you desire.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example13.php"><strong>Example 13</strong></a>, This demonstrates how to simply create a FLV stream script.<br /></li>
		<li><a href="<?php echo $use_version; ?>/example14.php"><strong>Example 14</strong></a>, This gives you an encode/decode lookup table so you can see which formats can be encoded and/or decoded with your version of FFmpeg, whilst showing you how to easily check for different codecs.<br /></li>
	</ul>
	<br />
	<a class="backtotop" href="#top">&uarr; Back to top</a><br />
	<br />
	<hr />
	<a id="license"></a><strong>License</strong><br />
	<br />
	The PHPVideoToolkit class, the VideoTo adapter class, the Toolkit adapter classes, the FFmpeg-PHP adapter classes and all associated examples are subject to the BSD style license laid out below.<br />
	<br />
	<strong>PHPVideoToolkit Copyright (c) 2008 Oliver Lillie <br />
	<a href="http://www.buggedcom.co.uk">http://www.buggedcom.co.uk</a></strong><br />
	<br />
	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.<br />
	<br />
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.<br />
	<br />
	<a class="backtotop" href="#top">&uarr; Back to top</a><br />
	<br />
	<hr />
	<a id="changelog"></a><strong>Changes</strong><pre><?php
	
echo $changelog;

?></pre>
	<a class="backtotop" href="#top">&uarr; Back to top</a><br />
	<br />
</body>
</html>