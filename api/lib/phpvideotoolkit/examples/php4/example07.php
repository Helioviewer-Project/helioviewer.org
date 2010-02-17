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

	echo '<html><head><link type="text/css" rel="stylesheet" href="../common/styles.css"><script type="text/javascript" charset="utf-8" src="../common/pluginobject/pluginobject.js"></script><script>PO.Options.auto_load_prefix="../common/pluginobject/plugins/";</script><meta name="author" content="Oliver Lillie"></head><body>';
	echo '<a class="backtoexamples" href="../index.php#examples">&larr; Back to examples list</a><br /><br />';
	echo '<strong>This example shows you how to join multiple videos together.<br />Please note that this example while valid code does not work yet within the PHPVideoToolkit class.</strong><br />';
	exit; 
	
// 	load the examples configuration
	require_once '../example-config.php';
	
// 	require the library
	require_once '../../phpvideotoolkit.'.$use_version.'.php';
	
// 	temp directory
	$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'tmp'.DS;
	
//	input movie files
	$files_to_process = array(
		PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'MOV02820.MPG',
		PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'MOV02832.MPG'// ,
		// 		PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'MOV02820.MPG'
	);

//	output files dirname has to exist
	$video_output_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'processed'.DS.'videos'.DS;
	
//	log dir
	$log_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'logs'.DS;
	
//	bit rate of audio (valid vaues are 16,32,64)
	$bitrate = 64;

//	sampling rate (valid values are 11025, 22050, 44100)
	$samprate = 44100;
	
// 	start PHPVideoToolkit class
	$toolkit = new PHPVideoToolkit($tmp_dir);
	
// 	set PHPVideoToolkit class to run silently
	$toolkit->on_error_die = FALSE;
	
	$input_file = array_pop($files_to_process);
// 	get the filename parts
	$filename = basename($input_file);
	$filename_minus_ext = substr($filename, 0, strrpos($filename, '.'));
		
// 	set the input file
	$ok = $toolkit->setInputFile($input_file);
// 	check the return value in-case of error
	if(!$ok)
	{
// 		if there was an error then get it 
		echo $toolkit->getLastError()."<br />\r\n";
		$toolkit->reset();
		exit;
	}
// 	$toolkit->setFormat(PHPVIDEOTOOLKIT_FORMAT_MPEGVIDEO);
	$toolkit->setVideoOutputDimensions(PHPVIDEOTOOLKIT_SIZE_QVGA);
	
// 	loop through the files to process
	foreach($files_to_process as $file)
	{
		$toolkit->addVideo($file);
	}
	
// 	set the output details and overwrite if nessecary
	$ok = $toolkit->setOutput($video_output_dir, $filename_minus_ext.'-joined.mpeg', PHPVIDEOTOOLKIT_OVERWRITE_EXISTING);
// 	check the return value in-case of error
	if(!$ok)
	{
// 		if there was an error then get it 
		echo $toolkit->getLastError()."<br />\r\n";
		$toolkit->reset();
		exit;
	}
	
// 	execute the ffmpeg command and log the calls and PHPVideoToolkit results
	$result = $toolkit->execute(false, true);
	
// 	get the last command given
// 	$command = $toolkit->getLastCommand();
// 	echo $command[0]."<br />\r\n";
// 	echo $command[1]."<br />\r\n";
	
// 	check the return value in-case of error
	if($result !== PHPVIDEOTOOLKIT_RESULT_OK)
	{
// 		move the log file to the log directory as something has gone wrong
		$toolkit->moveLog($log_dir.$filename_minus_ext.'.log');
// 		if there was an error then get it 
		echo $toolkit->getLastError()."<br />\r\n";
		$toolkit->reset();
		exit;
	}
	
	echo 'Videos joined... <b>'.array_shift($toolkit->getLastOutput()).'</b><br />'."\r\n";

// 	reset 
	$toolkit->reset();
 
    echo '</body></html>';
