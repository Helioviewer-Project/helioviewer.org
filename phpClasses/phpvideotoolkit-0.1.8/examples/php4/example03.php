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
	echo '<strong>This example shows you how to compile a movie from multiple jpegs.</strong><br />';
	
// 	load the examples configuration
	require_once '../example-config.php';
	
// 	require the library
	require_once '../../phpvideotoolkit.'.$use_version.'.php';
	
//	output files dirname has to exist
	$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'tmp'.DS;
	
//	input movie files
	$files_to_process = array(
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-1.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-2.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-3.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-4.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-5.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-6.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-7.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-8.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-9.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-10.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-11.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-12.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-13.jpg',
	    PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'mov02596-14.jpg'
	);
	
	$sound = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'Ballad of the Sneak.mp3';
	
//	output files dirname has to exist
	$video_output_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'processed'.DS.'videos'.DS;
	
//	log dir
	$log_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'logs'.DS;
	
// 	output filename
	$output_filename = 'my-picture-movie.gif';
// 	$output_filename = 'my-picture-movie.mpeg';
	
// 	init PHPVideoToolkit class
	$toolkit = new PHPVideoToolkit($tmp_dir);
	
// 	compile the image to the tmp dir with an input frame rate of 2 per second
	$ok = $toolkit->prepareImagesForConversionToVideo($files_to_process, 2);  
	if(!$ok)
	{
// 		if there was an error then get it 
		echo $toolkit->getLastError()."<br />\r\n";
		exit;
	}
	
// 	set a different output size (this will shrink the images to a video that is smaller, the images are 320x240)
	$toolkit->setVideoOutputDimensions(160, 120);
	
// 	set endless looping
	$toolkit->setGifLoops(0);
// 	$toolkit->addAudio($sound);

// 	set the output parameters
	$ok = $toolkit->setOutput($video_output_dir, $output_filename, PHPVIDEOTOOLKIT_OVERWRITE_EXISTING);
	if(!$ok)
	{
// 		if there was an error then get it 
		echo $toolkit->getLastError()."<br />\r\n";
		exit;
	}
	
// 	execute the ffmpeg command
	$result = $toolkit->execute(false, true);
		
// 	get the last command given
// 	$command = $toolkit->getLastCommand();
// 	echo $command."<br />\r\n<br />\r\n";
	
// 	check the return value in-case of error
	if($result !== PHPVIDEOTOOLKIT_RESULT_OK)
	{
// 		move the log file to the log directory as something has gone wrong
		$toolkit->moveLog($log_dir.'example03.log');
// 		if there was an error then get it 
		echo $toolkit->getLastError()."<br />\r\n";
		exit;
	}
		$toolkit->moveLog($log_dir.'example03.log');
	
	$img = array_shift($toolkit->getLastOutput());
	echo "Video created from images... <b>".basename($img)."</b><br />";
	echo '<img src="../working/processed/videos/'.basename($img).'" border="0" /><br /><br />';
    echo '</body></html>';   
