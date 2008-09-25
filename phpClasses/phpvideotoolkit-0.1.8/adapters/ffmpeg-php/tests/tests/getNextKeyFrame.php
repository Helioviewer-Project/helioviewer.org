--TEST--
ffmpeg getFrame without an argument test
--SKIPIF--
<?php 
function_exists("imagecreatetruecolor") or die("skip function imagecreatetruecolor unavailable");
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
$mov = new PHPVideoToolkit_movie($dir.'/examples/to-be-processed/cat.mpeg', false, $tmp_dir);
$img = $tmp_dir . '/test-';

while (($frame = $mov->getNextKeyFrame()) != false) {
    $i = $mov->getFrameNumber();
    $filename = $img . $i . '.png';
    $gd_image = $frame->toGDImage();
    imagepng($gd_image, $filename);
    printf("ffmpeg getFrame($i): md5 = %s\n", md5(file_get_contents($filename)));
    imagedestroy($gd_image);
    unlink($filename);
}
?>
--EXPECT--
ffmpeg getFrame(27): md5 = d82d780ddf49a48799d09a6c0c806903
ffmpeg getFrame(53): md5 = e6d91c77fa6ebca6087de92b901fae61
ffmpeg getFrame(79): md5 = 0e89a830644873281948dfd3e74c894c
ffmpeg getFrame(105): md5 = 94bd83396e4e24be255c66b3991ce316
