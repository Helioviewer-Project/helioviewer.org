--TEST--
ffmpeg getFramesResampled test
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

$framecount = $mov->getFrameCount();
for($i = 1; $i <= $framecount; $i++) {
    $img = sprintf("%s/test-%04d.png", $tmp_dir, $i);
    $width = 40 + ($i % 2 ? $i+1 : $i);
    $height = 40 + ($i % 2 ? $i+1 : $i);
    $frame = $mov->getFrame($i);
    $frame->resize($width, $height); 
    $gd_image = $frame->toGDImage();
    imagepng($gd_image, $img);
    printf("ffmpeg getFramesResampled(%d): md5 = %s\n", 
            $i, md5(file_get_contents($img)));
    imagedestroy($gd_image);
    unlink($img);
}
?>
--EXPECT--
ffmpeg getFramesResampled(1): md5 = 66c093edcb781f280dcd6e4944be1856
ffmpeg getFramesResampled(2): md5 = ff2de2dcad243c67bfa383aee28bc0e5
ffmpeg getFramesResampled(3): md5 = 31690bc75828aa902189a6c89c1c8ab5
ffmpeg getFramesResampled(4): md5 = 7a0525fa5313ae736b3c344c93104d33
ffmpeg getFramesResampled(5): md5 = 88eed76c164a2ed446f63a09f9e4ff3f
ffmpeg getFramesResampled(6): md5 = 96b85b2d7012f6da94dbe6a4c84cdf6f
ffmpeg getFramesResampled(7): md5 = beb066f88d3e770e3f0f945cc74e4225
ffmpeg getFramesResampled(8): md5 = 6ae41c95758045cd6fd0d8e974db71aa
ffmpeg getFramesResampled(9): md5 = 0eb108faabe76be132e1d8924223ec51
ffmpeg getFramesResampled(10): md5 = 205946896e22e2b2f012b35237f44fdb
ffmpeg getFramesResampled(11): md5 = 40cb96b66bea0c24136bfe099ee78ebc
ffmpeg getFramesResampled(12): md5 = 293f491eca1f36c6348e50af408e06f4
ffmpeg getFramesResampled(13): md5 = ae4d3e495fec9e57ff7156bed65e86d1
ffmpeg getFramesResampled(14): md5 = 52c9046907fc0384f16dca9de070350e
ffmpeg getFramesResampled(15): md5 = adfb85334a8fe49a3a504d1f3d6a10aa
ffmpeg getFramesResampled(16): md5 = a3bc8af4398892a6336e43d58711aabc
ffmpeg getFramesResampled(17): md5 = edb41a148256bc233332712714039532
ffmpeg getFramesResampled(18): md5 = bbf124d121209179459dbc04423b1403
ffmpeg getFramesResampled(19): md5 = db86adecbb17eceed41bd87f8c74a08e
ffmpeg getFramesResampled(20): md5 = b26f0df453787c347c229a3759fa3f1f
ffmpeg getFramesResampled(21): md5 = 7474f9c6c3ff052fd6f2e7e686fee4b6
ffmpeg getFramesResampled(22): md5 = 91be532325b0b1e99f6f117fa2518fda
ffmpeg getFramesResampled(23): md5 = f6fccd85605e9b96d0f0f06b1b1c2e4d
ffmpeg getFramesResampled(24): md5 = e3f3c6b443b883e1d22d558ec3717d48
ffmpeg getFramesResampled(25): md5 = 931d55a6fd6e52d5f263c6d6f5a5532b
ffmpeg getFramesResampled(26): md5 = 931d55a6fd6e52d5f263c6d6f5a5532b
ffmpeg getFramesResampled(27): md5 = 6ffdc5bcc11166c69d8cec22e501445b
ffmpeg getFramesResampled(28): md5 = aa5f882b8786ba4376480584a99b2c3f
ffmpeg getFramesResampled(29): md5 = ca7a7dd2df7097c5489aa0e0f3f30d6e
ffmpeg getFramesResampled(30): md5 = e5d509939357c9f85d2a90c46b07d3c7
ffmpeg getFramesResampled(31): md5 = bdb6f2d95273704d7c2d56946a6e2c11
ffmpeg getFramesResampled(32): md5 = 12bdcc3a7a5fe0be55b33080ae6905f0
ffmpeg getFramesResampled(33): md5 = 1642ed2beb8d0455f502f7451f3ac53e
ffmpeg getFramesResampled(34): md5 = a818b04e8caac96b97931754b74690e6
ffmpeg getFramesResampled(35): md5 = a558cfeb5a93bb50ec30840d7e57b718
ffmpeg getFramesResampled(36): md5 = b8baf6b0907180abc26f0698310a9bdb
ffmpeg getFramesResampled(37): md5 = 6daf5303b57015b626a15ebac681662c
ffmpeg getFramesResampled(38): md5 = 904ca28eb05a544bd785edbc56f61800
ffmpeg getFramesResampled(39): md5 = 4b915f44ed1087318f7003023b2d5039
ffmpeg getFramesResampled(40): md5 = 845f252eecdec9a901e9e52653f6eebd
ffmpeg getFramesResampled(41): md5 = 57a0d3afeff9cb49778f274cc196dcec
ffmpeg getFramesResampled(42): md5 = 2e714246f1988366dc6e7e955d44ac5a
ffmpeg getFramesResampled(43): md5 = 10ca14458e012ef6c9716615e9d0de1d
ffmpeg getFramesResampled(44): md5 = abf3c65b3d684a5e119d5a03e78e40cb
ffmpeg getFramesResampled(45): md5 = a6c6d43211d0e4900e061def283c5135
ffmpeg getFramesResampled(46): md5 = 7756e01be28a56df77df74b4067adbfd
ffmpeg getFramesResampled(47): md5 = 9478270bb7b3af26033ab3c743728593
ffmpeg getFramesResampled(48): md5 = 770b2a60f9605a7aff13e02319263a2d
ffmpeg getFramesResampled(49): md5 = 892d34da72e8f6168381a771c9bbc042
ffmpeg getFramesResampled(50): md5 = dee7bf5e54f4931985b65cb6f2569025
ffmpeg getFramesResampled(51): md5 = f9edd3a49aed199a9e8fa740837aed4f
ffmpeg getFramesResampled(52): md5 = 733781902d7b2b4024c8a9c15c8de278
ffmpeg getFramesResampled(53): md5 = e51b54364d8f5b6bff58d491f9b6f63a
ffmpeg getFramesResampled(54): md5 = 1467fe47b6dc525a276e09c3c2a7fee0
ffmpeg getFramesResampled(55): md5 = 333dfe0a7bd9942224c9073adc58c5d3
ffmpeg getFramesResampled(56): md5 = 868292b090ffc9f1533526ac7ec33e92
ffmpeg getFramesResampled(57): md5 = f3b52cf86cfbf1ca8054b8e15a448548
ffmpeg getFramesResampled(58): md5 = 871aa9234cc2127686bffc8ac67722aa
ffmpeg getFramesResampled(59): md5 = be27932448d37e50cf088ddf07e6fab1
ffmpeg getFramesResampled(60): md5 = bb7f217937e5a0ec44cd33bbd4d99d11
ffmpeg getFramesResampled(61): md5 = 8b99175a1312865dffc9a4c053ec1be2
ffmpeg getFramesResampled(62): md5 = f1918df7e827242c318f10a89a39cbfb
ffmpeg getFramesResampled(63): md5 = 9144f04ee65b60b944648bdd7ecf2c2a
ffmpeg getFramesResampled(64): md5 = 1e74a01df464c22ea0defec0c41ec3ec
ffmpeg getFramesResampled(65): md5 = 487c5cc53ab5ed71c5a89662ebf940c2
ffmpeg getFramesResampled(66): md5 = c135b2980373512e09b2b0a14b68c5ce
ffmpeg getFramesResampled(67): md5 = 014dec88ea7d30ba96bb32dbd56b6dd8
ffmpeg getFramesResampled(68): md5 = b2ecac46e29f95540a2e83ffd18009c6
ffmpeg getFramesResampled(69): md5 = fe2d58740a7ecdd3fd85e3c9f5b469fd
ffmpeg getFramesResampled(70): md5 = ccb073ffcc35d2af4634cfd4029209e8
ffmpeg getFramesResampled(71): md5 = 4c37c9adb29bad77b641f94ad20faefa
ffmpeg getFramesResampled(72): md5 = 1b816058af35e4e0482c5db4571ea317
ffmpeg getFramesResampled(73): md5 = 8853f0822dc7dc8b71e16b886f587ba7
ffmpeg getFramesResampled(74): md5 = e1945b82c162b9526422f2aef4caefce
ffmpeg getFramesResampled(75): md5 = 0c4771b4935a000329e322be20e610cd
ffmpeg getFramesResampled(76): md5 = 0c4771b4935a000329e322be20e610cd
ffmpeg getFramesResampled(77): md5 = 3991b2c2d0d9d3000f129ab53be84868
ffmpeg getFramesResampled(78): md5 = 07db45e004e320e8ce3b3990a524f127
ffmpeg getFramesResampled(79): md5 = 5a08c34b26c803c3dd79265280ac9158
ffmpeg getFramesResampled(80): md5 = b7ac592475127c8e958fea93cba6b1b4
ffmpeg getFramesResampled(81): md5 = 232f328f5b99623d73c57e073275b673
ffmpeg getFramesResampled(82): md5 = ae9c4db78f65407440552d6fb6820630
ffmpeg getFramesResampled(83): md5 = 78606ae6a3c8f8f7937415096f219b31
ffmpeg getFramesResampled(84): md5 = df2cb34cfc425551a53bf18ff4763791
ffmpeg getFramesResampled(85): md5 = 2ec66369fbe3333a89cf4a875718e4df
ffmpeg getFramesResampled(86): md5 = 5e7ecd86cfdddc2deff1227ce735757d
ffmpeg getFramesResampled(87): md5 = ffa3df1d866046805be9824237cef92d
ffmpeg getFramesResampled(88): md5 = 5112f06703bb045855bc0e9372cb8081
ffmpeg getFramesResampled(89): md5 = f01ba20455c6be6b8467a7cd3d51a5ca
ffmpeg getFramesResampled(90): md5 = ea9a61501c4e0f8601c00c3b73116ceb
ffmpeg getFramesResampled(91): md5 = 555a9cc00b931021218856ce772adff2
ffmpeg getFramesResampled(92): md5 = 4f6aa55607fa3648000b1f9d403d83d3
ffmpeg getFramesResampled(93): md5 = 1a986e3770acf52dfd1697008bfb33aa
ffmpeg getFramesResampled(94): md5 = 63b73eccc56c823bc8e03cfc82a9f6e5
ffmpeg getFramesResampled(95): md5 = b20a5e2e28b10b05bfbdcb9598bec1eb
ffmpeg getFramesResampled(96): md5 = 8c10e74cca40b0d6248785ff5290ebc4
ffmpeg getFramesResampled(97): md5 = 9c33b0a4b2584b74188b3714b4041eaf
ffmpeg getFramesResampled(98): md5 = e4e9d7cb476c275b9fc6522a4926c69e
ffmpeg getFramesResampled(99): md5 = be3da65db4eb8b844ac9e926ebd65892
ffmpeg getFramesResampled(100): md5 = ef18ceb8dbe3976730a0ca298aa2ac7d
ffmpeg getFramesResampled(101): md5 = e0ecaad161ed1c4608c6d1b82e7bd03d
ffmpeg getFramesResampled(102): md5 = 1b76e8d36e26a0a319365efaa944a686
ffmpeg getFramesResampled(103): md5 = defb8330b2a58b0c6b02c30d9722a76a
ffmpeg getFramesResampled(104): md5 = c2872f4bfa6ec2d60335cb23428cdbc7
ffmpeg getFramesResampled(105): md5 = d96cbd3cc9b01a181fab618c5c1f142a
ffmpeg getFramesResampled(106): md5 = db3dde6a880fbb8b4cde905480f7d3b7
ffmpeg getFramesResampled(107): md5 = 293ed6e9b750701dad8a4f4fdb421f53
ffmpeg getFramesResampled(108): md5 = 2a5005973fd1c0e9205864a8667a8463
ffmpeg getFramesResampled(109): md5 = 7c6411ba2929c6d69658b79f6b9c0ce4
ffmpeg getFramesResampled(110): md5 = d28aa64820cb1f9d926d33d9886228ed
ffmpeg getFramesResampled(111): md5 = aa1051d09280c9d0443f956563528dae
