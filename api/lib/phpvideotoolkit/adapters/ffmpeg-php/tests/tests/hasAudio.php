--TEST--
ffmpeg hasAudio test
--SKIPIF--
<?php 
require_once '../../ffmpeg_movie.php';
require_once '../../ffmpeg_frame.php';
require_once '../../ffmpeg_animated_gif.php';
$ignore_demo_files = true;
$dir = dirname(dirname(dirname(dirname(dirname(__FILE__)))));
require_once $dir.'/examples/example-config.php';
$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'tmp/';
?>
--FILE--
<?php
$mov = new PHPVideoToolkit_movie($dir.'/examples/to-be-processed/MOV00007.gif', false, $tmp_dir);
printf("ffmpeg hasAudio(): %s\n", $mov->hasAudio() ? 'Yes' : 'No');
$mov = new PHPVideoToolkit_movie($dir.'/examples/to-be-processed/cat.mpeg', false, $tmp_dir);
printf("ffmpeg hasAudio(): %s\n", $mov->hasAudio() ? 'Yes' : 'No');
?>
--EXPECT--
ffmpeg hasAudio(): No
ffmpeg hasAudio(): Yes
