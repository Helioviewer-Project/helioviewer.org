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
	echo '<strong>This example shows you how to manipulate/format timecode strings.</strong><br /><br />';
	$ignore_demo_files = true;
	
// 	load the examples configuration
	require_once '../example-config.php';
	
// 	require the library
	require_once '../../phpvideotoolkit.'.$use_version.'.php';
	
// 	temp directory
	$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'working'.DS.'tmp'.DS;
	
	
// 	set the time to examine / format
	if(isset($_POST['hours']))
	{
// 		capture timecode and framerate
		$timecode = str_pad(intval($_POST['hours']), 2, '0', STR_PAD_LEFT).':'.str_pad(intval($_POST['mins']), 2, '0', STR_PAD_LEFT).':'.str_pad(intval($_POST['secs']), 2, '0', STR_PAD_LEFT).'.'.str_pad(intval($_POST['millisecs']), 2, '0', STR_PAD_LEFT);
		$frame_rate = intval($_POST['framerate']);
	}
	else
	{
// 		set the frame rate for the timecodes and default time
		$timecode = '01:14:32.59';
		$frame_rate = 25;
	}
	$timecode_format = '%hh:%mm:%ss.%ms';
	
// 		 * 		default '%hh:%mm:%ss'
// 		 * 			- %hh (hours) representative of hours
// 		 * 			- %mm (minutes) representative of minutes
// 		 * 			- %ss (seconds) representative of seconds
// 		 * 			- %fn (frame number) representative of frames (of the current second, not total frames)
// 		 * 			- %ms (milliseconds) representative of milliseconds (of the current second, not total milliseconds) (rounded to 3 decimal places)
// 		 * 			- %ft (frames total) representative of total frames (ie frame number)
// 		 * 			- %st (seconds total) representative of total seconds (rounded).
// 		 * 			- %sf (seconds floored) representative of total seconds (floored).
// 		 * 			- %sc (seconds ceiled) representative of total seconds (ceiled).
// 		 * 			- %mt (milliseconds total) representative of total milliseconds. (rounded to 3 decimal places)
	
	
// 	start ffmpeg class
	$toolkit = new PHPVideoToolkit($tmp_dir);
	
	echo '<strong>Timecode Format Placeholders</strong><br />';
	echo 'When you format a timecode or format a number of seconds into a timecode you can use the following placeholders to contain different time and frame values<br /><br />';
	echo '<table border="0" cellspacing="0" cellpadding="2">
		<tr>
			<td style="width:50px;border-bottom:1px solid #ccc;">
				<strong>%hh</strong>
			</td>
			<td style="border-bottom:1px solid #ccc;">
				hours
			</td>
		</tr>
		<tr>
			<td>
				<strong>%mm</strong>
			</td>
			<td>
				minutes
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				&nbsp;
			</td>
			<td class="light small" style="border-bottom:1px solid #ccc;">
				NOTE: Smart Value Warning. By default if %hh (hours) aren\'t used in the format then this will give the total number of minutes.
			</td>
		</tr>
		<tr>
			<td>
				<strong>%ss</strong>
			</td>
			<td>
				seconds
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				&nbsp;
			</td>
			<td class="light small" style="border-bottom:1px solid #ccc;">
				NOTE: Smart Value Warning. By default if %hh (hours) or %mm (mins) aren\'t used in the format then this will give the total number of seconds.
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				<strong>%fn</strong>
			</td>
			<td style="border-bottom:1px solid #ccc;">
				frame number
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				<strong>%ms</strong>
			</td>
			<td style="border-bottom:1px solid #ccc;">
				milliseconds
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				<strong>%ft</strong>
			</td>
			<td style="border-bottom:1px solid #ccc;">
				frames total
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				<strong>%st</strong>
			</td>
			<td style="border-bottom:1px solid #ccc;">
				seconds total
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				<strong>%sf</strong>
			</td>
			<td style="border-bottom:1px solid #ccc;">
				seconds floored
			</td>
		</tr>
		<tr>
			<td style="border-bottom:1px solid #ccc;">
				<strong>%sc</strong>
			</td>
			<td style="border-bottom:1px solid #ccc;">
				seconds ceiled
			</td>
		</tr>
		<tr>
			<td>
				<strong>%mt</strong>
			</td>
			<td>
				milliseconds total
			</td>
		</tr>
	</table>';
	echo '<br />';
	echo 'With regards to the Smart Value Warnings, you can turn off smart values by setting the $use_smart_values argument to false when formatting a timecode.<br /><br />';
	
	echo '<strong>Original Timecode</strong><br />';
	echo $timecode.'<br /><br />';
	
	echo '<strong>Timecode conversion to seconds</strong><br />';
	echo 'Frame seconds (rounded) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%st', $frame_rate).'<br />';
	echo 'Frame seconds (rounded down) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%sf', $frame_rate).'<br />';
	echo 'Frame seconds (rounded up) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%sc', $frame_rate).'<br />';
	echo 'Frame seconds -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%mt', $frame_rate).'<br /><br />';
	
	echo '<strong>Timecode conversion to frames</strong><br />';
	echo 'Frame number (in current second) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%fn', $frame_rate).'<br />';
	echo 'Frame number (in video) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%ft', $frame_rate).'<br /><br />';
	
	echo '<strong>Timecode conversion to other timecodes</strong><br />';
	echo 'hh:mm -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%hh:%mm', $frame_rate).'<br />';
	echo 'hh:mm:ss -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%hh:%mm:%ss', $frame_rate).'<br />';
	echo 'hh:mm:ss.fn -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%hh:%mm:%ss.%fn', $frame_rate).'<br />';
	echo 'hh:mm:ss.ms -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%hh:%mm:%ss.%ms', $frame_rate).'<br />';
	echo 'mm:ss (smart minutes) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%mm:%ss', $frame_rate).'<br />';
	echo 'mm:ss.fn (smart minutes) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%mm:%ss.%fn', $frame_rate).'<br />';
	echo 'ss.ms (smart seconds) -> '.$toolkit->formatTimecode($timecode, $timecode_format, '%ss.%ms', $frame_rate).'<br /><br />';
	
 // 	output the timecode form, remembering to disable smart values
	$use_smart_values = false;
	echo '<strong>Change Timecode</strong><br />';
	echo '<form action="example12.php" method="post"><table border="0" cellspacing="0" cellpadding="0">
		<tr>
			<td class="small" style="padding-left:4px;">
				Hours
			</td>
			<td class="small" style="padding-left:4px;">
				Mins
			</td>
			<td class="small" style="padding-left:4px;">
				Secs
			</td>
			<td class="small" style="padding-left:4px;">
				Milli
			</td>
			<td class="small" style="padding-left:4px;" colspan="2">
				Frame Rate
			</td>
		</tr>
		<tr>
			<td>
				<input type="text" name="hours" value="'.$toolkit->formatTimecode($timecode, $timecode_format, '%hh', $frame_rate, $use_smart_values).'" id="hours" style="width:35px;margin-right:3px;" />:
			</td>
			<td>
				<input type="text" name="mins" value="'.$toolkit->formatTimecode($timecode, $timecode_format, '%mm', $frame_rate, $use_smart_values).'" id="mins" style="width:35px;margin:0 3px 0 3px;" />:
			</td>
			<td>
				<input type="text" name="secs" value="'.$toolkit->formatTimecode($timecode, $timecode_format, '%ss', $frame_rate, $use_smart_values).'" id="secs" style="width:35px;margin:0 3px 0 3px;" />:
			</td>
			<td>
				<input type="text" name="millisecs" value="'.$toolkit->formatTimecode($timecode, $timecode_format, '%ms', $frame_rate, $use_smart_values).'" id="millisecs" style="width:35px;margin:0 3px 0 3px;" />/
			</td>
			<td>
				<input type="text" name="framerate" value="'.$frame_rate.'" id="framerate" style="width:35px;margin:0 3px 0 3px;" />
			</td>
			<td>
				<input type="submit" value="Update" style="margin:0 0 0 10px;" />
			</td>
		</tr>
</table></form><br />';
	
   echo '</body></html>';
