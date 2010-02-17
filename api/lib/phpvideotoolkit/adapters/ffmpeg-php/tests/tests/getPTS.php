--TEST--
ffmpeg getPTS test
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
$mov = new PHPVideoToolkit_movie($dir.'/examples/to-be-processed/cat.mpeg', false, $tmp_dir);

$framecount = $mov->getFrameCount();
for($i = 1; $i <= $framecount; $i++) {
    $frame = $mov->getFrame($i);
    printf("ffmpeg getPresentationTimestamp($i): = %s\n", $frame->getPTS());
}
?>
--EXPECT--
ffmpeg getPresentationTimestamp(1): = 0.04
ffmpeg getPresentationTimestamp(2): = 0.08
ffmpeg getPresentationTimestamp(3): = 0.12
ffmpeg getPresentationTimestamp(4): = 0.16
ffmpeg getPresentationTimestamp(5): = 0.2
ffmpeg getPresentationTimestamp(6): = 0.24
ffmpeg getPresentationTimestamp(7): = 0.28
ffmpeg getPresentationTimestamp(8): = 0.32
ffmpeg getPresentationTimestamp(9): = 0.36
ffmpeg getPresentationTimestamp(10): = 0.4
ffmpeg getPresentationTimestamp(11): = 0.44
ffmpeg getPresentationTimestamp(12): = 0.48
ffmpeg getPresentationTimestamp(13): = 0.52
ffmpeg getPresentationTimestamp(14): = 0.56
ffmpeg getPresentationTimestamp(15): = 0.6
ffmpeg getPresentationTimestamp(16): = 0.64
ffmpeg getPresentationTimestamp(17): = 0.68
ffmpeg getPresentationTimestamp(18): = 0.72
ffmpeg getPresentationTimestamp(19): = 0.76
ffmpeg getPresentationTimestamp(20): = 0.8
ffmpeg getPresentationTimestamp(21): = 0.84
ffmpeg getPresentationTimestamp(22): = 0.88
ffmpeg getPresentationTimestamp(23): = 0.92
ffmpeg getPresentationTimestamp(24): = 0.96
ffmpeg getPresentationTimestamp(25): = 1
ffmpeg getPresentationTimestamp(26): = 1.04
ffmpeg getPresentationTimestamp(27): = 1.08
ffmpeg getPresentationTimestamp(28): = 1.12
ffmpeg getPresentationTimestamp(29): = 1.16
ffmpeg getPresentationTimestamp(30): = 1.2
ffmpeg getPresentationTimestamp(31): = 1.24
ffmpeg getPresentationTimestamp(32): = 1.28
ffmpeg getPresentationTimestamp(33): = 1.32
ffmpeg getPresentationTimestamp(34): = 1.36
ffmpeg getPresentationTimestamp(35): = 1.4
ffmpeg getPresentationTimestamp(36): = 1.44
ffmpeg getPresentationTimestamp(37): = 1.48
ffmpeg getPresentationTimestamp(38): = 1.52
ffmpeg getPresentationTimestamp(39): = 1.56
ffmpeg getPresentationTimestamp(40): = 1.6
ffmpeg getPresentationTimestamp(41): = 1.64
ffmpeg getPresentationTimestamp(42): = 1.68
ffmpeg getPresentationTimestamp(43): = 1.72
ffmpeg getPresentationTimestamp(44): = 1.76
ffmpeg getPresentationTimestamp(45): = 1.8
ffmpeg getPresentationTimestamp(46): = 1.84
ffmpeg getPresentationTimestamp(47): = 1.88
ffmpeg getPresentationTimestamp(48): = 1.92
ffmpeg getPresentationTimestamp(49): = 1.96
ffmpeg getPresentationTimestamp(50): = 2
ffmpeg getPresentationTimestamp(51): = 2.04
ffmpeg getPresentationTimestamp(52): = 2.08
ffmpeg getPresentationTimestamp(53): = 2.12
ffmpeg getPresentationTimestamp(54): = 2.16
ffmpeg getPresentationTimestamp(55): = 2.2
ffmpeg getPresentationTimestamp(56): = 2.24
ffmpeg getPresentationTimestamp(57): = 2.28
ffmpeg getPresentationTimestamp(58): = 2.32
ffmpeg getPresentationTimestamp(59): = 2.36
ffmpeg getPresentationTimestamp(60): = 2.4
ffmpeg getPresentationTimestamp(61): = 2.44
ffmpeg getPresentationTimestamp(62): = 2.48
ffmpeg getPresentationTimestamp(63): = 2.52
ffmpeg getPresentationTimestamp(64): = 2.56
ffmpeg getPresentationTimestamp(65): = 2.6
ffmpeg getPresentationTimestamp(66): = 2.64
ffmpeg getPresentationTimestamp(67): = 2.68
ffmpeg getPresentationTimestamp(68): = 2.72
ffmpeg getPresentationTimestamp(69): = 2.76
ffmpeg getPresentationTimestamp(70): = 2.8
ffmpeg getPresentationTimestamp(71): = 2.84
ffmpeg getPresentationTimestamp(72): = 2.88
ffmpeg getPresentationTimestamp(73): = 2.92
ffmpeg getPresentationTimestamp(74): = 2.96
ffmpeg getPresentationTimestamp(75): = 3
ffmpeg getPresentationTimestamp(76): = 3.04
ffmpeg getPresentationTimestamp(77): = 3.08
ffmpeg getPresentationTimestamp(78): = 3.12
ffmpeg getPresentationTimestamp(79): = 3.16
ffmpeg getPresentationTimestamp(80): = 3.2
ffmpeg getPresentationTimestamp(81): = 3.24
ffmpeg getPresentationTimestamp(82): = 3.28
ffmpeg getPresentationTimestamp(83): = 3.32
ffmpeg getPresentationTimestamp(84): = 3.36
ffmpeg getPresentationTimestamp(85): = 3.4
ffmpeg getPresentationTimestamp(86): = 3.44
ffmpeg getPresentationTimestamp(87): = 3.48
ffmpeg getPresentationTimestamp(88): = 3.52
ffmpeg getPresentationTimestamp(89): = 3.56
ffmpeg getPresentationTimestamp(90): = 3.6
ffmpeg getPresentationTimestamp(91): = 3.64
ffmpeg getPresentationTimestamp(92): = 3.68
ffmpeg getPresentationTimestamp(93): = 3.72
ffmpeg getPresentationTimestamp(94): = 3.76
ffmpeg getPresentationTimestamp(95): = 3.8
ffmpeg getPresentationTimestamp(96): = 3.84
ffmpeg getPresentationTimestamp(97): = 3.88
ffmpeg getPresentationTimestamp(98): = 3.92
ffmpeg getPresentationTimestamp(99): = 3.96
ffmpeg getPresentationTimestamp(100): = 4
ffmpeg getPresentationTimestamp(101): = 4.04
ffmpeg getPresentationTimestamp(102): = 4.08
ffmpeg getPresentationTimestamp(103): = 4.12
ffmpeg getPresentationTimestamp(104): = 4.16
ffmpeg getPresentationTimestamp(105): = 4.2
ffmpeg getPresentationTimestamp(106): = 4.24
ffmpeg getPresentationTimestamp(107): = 4.28
ffmpeg getPresentationTimestamp(108): = 4.32
ffmpeg getPresentationTimestamp(109): = 4.36
ffmpeg getPresentationTimestamp(110): = 4.4
ffmpeg getPresentationTimestamp(111): = 4.44
