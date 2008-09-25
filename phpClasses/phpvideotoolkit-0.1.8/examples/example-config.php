<?php

	/* SVN FILE: $Id$ */
	
	ini_set('error_reporting', E_ALL);
	ini_set('track_errors', '1');
	ini_set('display_errors', '1');
	ini_set('display_startup_errors', '1');

// 	shortcut the DIRECTORY_SEPARATOR value
	if(!defined('DS'))
	{
		define('DS', DIRECTORY_SEPARATOR);
	}

// 	define the paths to the required binaries
	define('PHPVIDEOTOOLKIT_FFMPEG_BINARY', '/usr/bin/ffmpeg');
	define('PHPVIDEOTOOLKIT_FLVTOOLS_BINARY', '/usr/bin/flvtool2');
	define('PHPVIDEOTOOLKIT_MENCODER_BINARY', '/usr/bin/mencoder'); // only required for video joining
	define('PHPVIDEOTOOLKIT_FFMPEG_WATERMARK_VHOOK', '/usr/lib/vhook/watermark.so'); // only required for video wartermarking
// 	define('PHPVIDEOTOOLKIT_FFMPEG_BINARY', 'xxxx');
// 	define('PHPVIDEOTOOLKIT_FLVTOOLS_BINARY', 'xxxx');
// 	define('PHPVIDEOTOOLKIT_MENCODER_BINARY', 'xxxx'); // only required for video joining
// 	define('PHPVIDEOTOOLKIT_FFMPEG_WATERMARK_VHOOK', 'xxxx'); // only required for video wartermarking
	
// 	define the absolute path of the example folder so that the examples only have to be edited once
// 	REMEMBER the trailing slash
	define('PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH', dirname(__FILE__).DS);

	if(PHPVIDEOTOOLKIT_FFMPEG_BINARY == 'xxxx' || PHPVIDEOTOOLKIT_FLVTOOLS_BINARY == 'xxxx' || PHPVIDEOTOOLKIT_MENCODER_BINARY == 'xxxx' || PHPVIDEOTOOLKIT_FFMPEG_WATERMARK_VHOOK == 'xxxx' || PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH == 'xxxx')
	{
		die('Please open examples/example-config.php to set your servers values.');
//<-		exits 		
	}
	
// 	use a particular version for the examples
	$use_version = 'php5';
	$has_version_warning = false;
// 	check if php5 is ok
	if($use_version == 'php5' && version_compare(PHP_VERSION, '5.0.0', '<'))
	{
		$use_version = 'php4';
		$has_version_warning = true;
	}
// print_r(array($use_version, version_compare('4', PHP_VERSION, '<')));
// exit;
	if(!isset($ignore_demo_files) || !$ignore_demo_files)
	{
		$is_file = is_file(PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'to-be-processed'.DS.'cat.mpeg');
		if($is_file)
		{
			if(!isset($ignore_config_output) || !$ignore_config_output) 
			{
				echo '<span class="alert">Please note that this example requires demo files. If you have not got these demo files you can download them from <a href="http://www.buggedcom.co.uk/ffmpeg">here</a>.<br /><br />This example will now quit.</span>';
				exit;
			}
		}
		else
		{
			if(!isset($ignore_config_output) || !$ignore_config_output) 
			{
				echo '<br />';
			}
		}
	}
	
	
	