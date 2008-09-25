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
	echo '<strong>This example shows you how to extract frames from a movie.</strong><br />';
	
// 	load the examples configuration
	require_once '../example-config.php';
	
// 	require the library
	require_once '../../phpvideotoolkit.'.$use_version.'.php';
	
	echo '<span class="alert"><strong>Note; </strong>This example should work correctly, however it\'s not. I don\'t currently understand why it\'s not producing the expected thumbnails. I\'m currently looking into it and the example will be updated when this process is fixed.</span><br /><br />';
	
// 	temp directory
	$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'tmp'.DS;
	
//	input movie files
	$files_to_process = array(
		PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'MOV00007.3gp',
		PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'Video000.3gp',
		PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'to-be-processed'.DS.'cat.mpeg'
	);

//	output files dirname has to exist
	$thumbnail_output_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'processed'.DS.'thumbnails'.DS;
	
//	log dir
	$log_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'logs'.DS;
	
// 	start PHPVideoToolkit class
	$toolkit = new PHPVideoToolkit($tmp_dir);
	
// 	set PHPVideoToolkit class to run silently
	$toolkit->on_error_die = FALSE;
	
// 	the number of frames to extract per second
	$extraction_frame_rate = 5;
	
// 	start the timer collection
	$total_process_time = 0;
	
// 	loop through the files to process
	foreach($files_to_process as $key=>$file)
	{
// 		get the filename parts
		$filename = basename($file);
		$filename_minus_ext = substr($filename, 0, strrpos($filename, '.'));
		echo '<strong>Extracting '.$filename.'</strong><br />';
		
// 		set the input file
		$ok = $toolkit->setInputFile($file, $extraction_frame_rate);
// 		check the return value in-case of error
		if(!$ok)
		{
// 			if there was an error then get it 
			echo '<b>'.$toolkit->getLastError()."</b><br />\r\n";
			$toolkit->reset();
			continue;
		}
		
// 		set the output dimensions
		$toolkit->setVideoOutputDimensions(160, 120);
		
// 		extract thumbnails from the third second of the video, but we only want to limit the number of frames to 10
		$info = $toolkit->getFileInfo();
		echo 'We are extracting frames at a rate of '.$extraction_frame_rate.'/second so for this file we should have '.ceil($info['duration']['seconds']*$extraction_frame_rate).' frames below.<br />';
		$toolkit->extractFrames('00:00:00', false, $extraction_frame_rate, false, '%hh:%mm:%ss');
		
// 		set the output details
		$ok = $toolkit->setOutput($thumbnail_output_dir, $filename_minus_ext.'[%timecode].jpg', PHPVideoToolkit::OVERWRITE_EXISTING);
// 		$ok = $toolkit->setOutput($thumbnail_output_dir, $filename_minus_ext.'[%12index].jpg', PHPVideoToolkit::OVERWRITE_EXISTING);
// 		check the return value in-case of error
		if(!$ok)
		{
// 			if there was an error then get it 
			echo '<b>'.$toolkit->getLastError()."</b><br />\r\n";
			$toolkit->reset();
			continue;
		}
		
// 		execute the ffmpeg command
		$result = $toolkit->execute(false, true);
		
// 		get the last command given
// 		$command = $toolkit->getLastCommand();
// 		echo $command."<br />\r\n";
		
// 		check the return value in-case of error
		if($result !== PHPVideoToolkit::RESULT_OK)
		{
// 			move the log file to the log directory as something has gone wrong
			$toolkit->moveLog($log_dir.$filename_minus_ext.'.log');
// 			if there was an error then get it 
			echo '<b>'.$toolkit->getLastError()."</b><br />\r\n";
			$toolkit->reset();
			continue;
		}
		
// 		get the process time of the file
		$process_time = $toolkit->getLastProcessTime();
		$total_process_time += $process_time;
		
		$files = $toolkit->getLastOutput();
		
		echo 'Frames grabbed in '.$process_time.' seconds... <b>'.$thumbnail_output_dir.array_pop($files).'</b><br />'."\r\n";
		foreach($files as $key=>$file)
		{
			echo '<img src="../working/processed/thumbnails/'.$file.'" alt="" border="0" /> ';
		}
		echo '<br /><br />';
	
// 		reset 
		$toolkit->reset();
		
	}
	
	echo ''."\r\n".'The total time taken to process all '.($key+1).' file(s) is : <b>'.$total_process_time.'</b>';
	echo '<br />'."\r\n".'The average time taken to process each file is : <b>'.($total_process_time/($key+1)).'</b>';
    echo '</body></html>';