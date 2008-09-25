--TEST--
ffmpeg getID3Info() test
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
$mov = new PHPVideoToolkit_movie($dir.'/examples/to-be-processed/Ballad of the Sneak.mp3', false, $tmp_dir);
printf("ffmpeg getTitle(): %s\n", $mov->getTitle());
printf("ffmpeg getArtist(): %s\n", $mov->getArtist());
printf("ffmpeg getAlbum(): %s\n", $mov->getAlbum());
printf("ffmpeg getGenre(): %s\n", $mov->getGenre());
printf("ffmpeg getTrackNumber(): %s\n", $mov->getTrackNumber());
printf("ffmpeg getYear(): %s\n", $mov->getYear());

?>
--EXPECT--
ffmpeg getTitle(): Ballad of the Sneak
ffmpeg getArtist(): DaVinci's Notebook
ffmpeg getAlbum(): Strong Bad Sings
ffmpeg getGenre(): Ballad
ffmpeg getTrackNumber(): 1
ffmpeg getYear(): 2004

