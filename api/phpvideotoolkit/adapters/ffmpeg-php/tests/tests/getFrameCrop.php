--TEST--
ffmpeg getFrame cropping test
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

function print_image_md5($gd_image) {
    if ($gd_image) {
        $img = sprintf("tmp.png", $tmp_dir);
        imagepng($gd_image, $img);
        // generate md5 of file
        printf("%s\n", md5(file_get_contents($img)));
        unlink($img);
    } else {
        printf("failed\n");
    }
}

$framenumber = 73;
$mov = new PHPVideoToolkit_movie($dir.'/examples/to-be-processed/cat.mpeg', false, $tmp_dir);
$img = sprintf("%s/test-%04d.png", $tmp_dir, $framenumber);

/* cropping as part of resize */
$frame = $mov->getFrame($framenumber);
$frame->resize(50, 50, 10, 10, 10, 10);
$gd_image = $frame->toGDImage();
print('ffmpeg resize and crop: md5 = ');
print_image_md5($gd_image);
imagedestroy($gd_image);
$framenumber++;

/* cropping without resize */
$frame = $mov->getFrame($framenumber);
$frame->crop(10, 10, 10, 10);
$gd_image = $frame->toGDImage();
print('ffmpeg crop: md5 = ');
print_image_md5($gd_image);
imagedestroy($gd_image);
?>
--EXPECT--
ffmpeg resize and crop: md5 = 9953e3252c3a2204cfe1ea5101a72f7f
ffmpeg crop: md5 = 2ef711ce6500fe9bd7377f2deb65ed08
