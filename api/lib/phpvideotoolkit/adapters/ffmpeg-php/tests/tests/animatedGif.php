--TEST--
ffmpeg animatedGif
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
$mov = new PHPVideoToolkit_movie($dir.'/examples/to-be-processed/Video000.3gp', false, $tmp_dir);
$agif = sprintf("%s/test.gif", $tmp_dir);

$ff_gif = new PHPVideoToolkit_animated_gif($agif, 120, 96, 5, 5);

for ($i = 1; $i < 70; $i+=10) {
    $ff_frame = $mov->getFrame($i);
    $ff_gif->addFrame($ff_frame);
}

$img = imagecreatetruecolor(128,96);
$red = imagecolorallocate($img, 255, 0, 0);
$white = imagecolorallocate($img, 255, 255, 255);

imagerectangle($img, 5, 5, 90, 90, $white );

$ff_frame_img = new PHPVideoToolkit_frame($img);

$ff_gif->addFrame($ff_frame_img);

printf("ffmpeg animated gif: md5 = %s\n", md5(file_get_contents($agif)));
// unlink($agif);

?>
--EXPECT--
ffmpeg animated gif: md5 = 81441e56d9cb5c781e5f7499217614a3
