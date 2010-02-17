--TEST--
ffmpeg getFrames forward test
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
    $frame = $mov->getFrame($i);
    $frame->resize(96, 120);
    $image = $frame->toGDImage();
    imagepng($image, $img);
    printf("ffmpeg getFrameResampled($i): md5 = %s\n", md5(file_get_contents($img)));
    imagedestroy($image);
    unlink($img);
}
?>
--EXPECT--
ffmpeg getFrameResampled(1): md5 = 00fc7ce4272a541e6c0298587cd84b1d
ffmpeg getFrameResampled(2): md5 = fc3f1bcdad0a18297102a5a4cd812cac
ffmpeg getFrameResampled(3): md5 = 419e6c7c2492c39f4f7994461b035790
ffmpeg getFrameResampled(4): md5 = e515870278716564c23f3aa0f584951f
ffmpeg getFrameResampled(5): md5 = f1b179e284c88e4af621cdba2ee53bfe
ffmpeg getFrameResampled(6): md5 = 8e1ee36fb435991b6c922d7e48ea6763
ffmpeg getFrameResampled(7): md5 = 8656a12c9ecd6e82e6d4f6882ed3136e
ffmpeg getFrameResampled(8): md5 = f8429c8bfeaba210248184bca3236d0f
ffmpeg getFrameResampled(9): md5 = 2c0900f2d30504e7dd0d4fb096c3cd9d
ffmpeg getFrameResampled(10): md5 = 804dd3aefe04f92086e4365197a1f6a5
ffmpeg getFrameResampled(11): md5 = 12e87d33f98bc72f4a47c1fb4d1e269a
ffmpeg getFrameResampled(12): md5 = 85762c9b83ad8c9497bb0334634d5df1
ffmpeg getFrameResampled(13): md5 = df41bec59cfe6ff29528b96d4d8e9f73
ffmpeg getFrameResampled(14): md5 = 37cc1de42aa59e3606d4c8172e311a9b
ffmpeg getFrameResampled(15): md5 = 1d700398b939801bc6483ccaea683ced
ffmpeg getFrameResampled(16): md5 = dba2351b3d54aae74f1f1e3273178770
ffmpeg getFrameResampled(17): md5 = b8924c49be3870d841ecf420e9e2fa47
ffmpeg getFrameResampled(18): md5 = 2fcd78b1afa8bddf0e32c5772a8bebcd
ffmpeg getFrameResampled(19): md5 = 73e840bd7ab1fbcbc8968d32189169a6
ffmpeg getFrameResampled(20): md5 = 43d661efe1d61304526b3366a3774f60
ffmpeg getFrameResampled(21): md5 = 75967c6be1b02e8e43805fbaff885b25
ffmpeg getFrameResampled(22): md5 = cb7e0b3e25f3685e6cf824ba9907271a
ffmpeg getFrameResampled(23): md5 = 961e4cab79ac559ec199e1c81c4a1a32
ffmpeg getFrameResampled(24): md5 = cddf2b9932e6fbc594f57b6143816f29
ffmpeg getFrameResampled(25): md5 = c33e536defd195d4314c56bcfd307d27
ffmpeg getFrameResampled(26): md5 = c33e536defd195d4314c56bcfd307d27
ffmpeg getFrameResampled(27): md5 = 9e99ade0b1ae92c1d03755790a9ec693
ffmpeg getFrameResampled(28): md5 = 0a6e910ef8012e06bd02cc2328d6d2af
ffmpeg getFrameResampled(29): md5 = feafe5a1be7414f9d0644f99efb114fa
ffmpeg getFrameResampled(30): md5 = 5122ae240c21ae13782d91dd0ff91bfa
ffmpeg getFrameResampled(31): md5 = ccb46130ec157332daf0ba20d02468f5
ffmpeg getFrameResampled(32): md5 = 26af7ed5d6acd2ca58ad51e56f05cd30
ffmpeg getFrameResampled(33): md5 = cca4e7c1a02cf6a240003d9b9b39c488
ffmpeg getFrameResampled(34): md5 = c87c34ee325a55eae63f8d163ceabfaa
ffmpeg getFrameResampled(35): md5 = 0680dda77894efc4800855e32151bf4e
ffmpeg getFrameResampled(36): md5 = 50ea2d798b222d9d0ddde3da791adf4d
ffmpeg getFrameResampled(37): md5 = d1abfd635296721fa0055651e04f9cfe
ffmpeg getFrameResampled(38): md5 = 2b36f28d5e7dc199862af9d7159e3e44
ffmpeg getFrameResampled(39): md5 = 285d77f62c44174773021feb30e99b69
ffmpeg getFrameResampled(40): md5 = 3a0dc70459ec8096783f928c8c7cb731
ffmpeg getFrameResampled(41): md5 = cf90d6a68ec1719823fcf479eb665559
ffmpeg getFrameResampled(42): md5 = ed17d7fe21ef259e2fbea00d7d8234fd
ffmpeg getFrameResampled(43): md5 = 620c14cb0801d0b39adff06e2b63d4b5
ffmpeg getFrameResampled(44): md5 = df17ce8f970ecc4ab637bec0dd8afade
ffmpeg getFrameResampled(45): md5 = 1985af73127d081eed4538e434ae9a9c
ffmpeg getFrameResampled(46): md5 = fd31389e5ba2be66bd9195d52f9fcc20
ffmpeg getFrameResampled(47): md5 = 2bb9b5779e0ce95b2d7ef79fbd8a5770
ffmpeg getFrameResampled(48): md5 = 75a12264b040776609819522009c8d75
ffmpeg getFrameResampled(49): md5 = cfc15539bf487fabbbb1924e176b9198
ffmpeg getFrameResampled(50): md5 = 786347541c8e393ecbfdc5ab372e040e
ffmpeg getFrameResampled(51): md5 = 786347541c8e393ecbfdc5ab372e040e
ffmpeg getFrameResampled(52): md5 = 039a7dd91e3877f88bc4c5cc4b218890
ffmpeg getFrameResampled(53): md5 = a9ef7f166ea90d0ee670236d1cedc078
ffmpeg getFrameResampled(54): md5 = d9e5293d4fce70d81192dc3aa52878bf
ffmpeg getFrameResampled(55): md5 = dc5e3638bffa45212f03cc2eb9b2c7d3
ffmpeg getFrameResampled(56): md5 = 54129cd2b569a2283b2beec469e8e201
ffmpeg getFrameResampled(57): md5 = 887cef1c87003c12e77f11e0122c87c3
ffmpeg getFrameResampled(58): md5 = 373f35da2f22f70ceb89c744b6ba38f8
ffmpeg getFrameResampled(59): md5 = 5cdc81a8ac4030764b91eb49720ae164
ffmpeg getFrameResampled(60): md5 = 31503466bd63ba28f6ee32e114a9edd0
ffmpeg getFrameResampled(61): md5 = 0d7b078623404b0362ead4a947dd567c
ffmpeg getFrameResampled(62): md5 = 7619aeb5c9842e977f88587bd5adc7ee
ffmpeg getFrameResampled(63): md5 = 83ebc77f6ad0b1855f78ffe5ba05723b
ffmpeg getFrameResampled(64): md5 = c64ade989b83acaac4eebe946e1ccc8c
ffmpeg getFrameResampled(65): md5 = e66717765bd1e013670fc51654276115
ffmpeg getFrameResampled(66): md5 = bf930a745ad2ee69e38a1d615571d178
ffmpeg getFrameResampled(67): md5 = bde8f6348870cd692a85e2c6ddb3a8f4
ffmpeg getFrameResampled(68): md5 = 4f074845df14403c93a4097540e37200
ffmpeg getFrameResampled(69): md5 = d027c7678f37a9b0ec3e149b3d50db3d
ffmpeg getFrameResampled(70): md5 = 5b57efb79f81f45de993538b512003ab
ffmpeg getFrameResampled(71): md5 = 6c036c20eaa218efede99aa8b2bcf897
ffmpeg getFrameResampled(72): md5 = 66e6ce4a22c05830fd28476841e6887b
ffmpeg getFrameResampled(73): md5 = d69eb616369ddbdf970a6a6ee325d0c6
ffmpeg getFrameResampled(74): md5 = df658e6439e9c2aaeb2f6dcc1ac81059
ffmpeg getFrameResampled(75): md5 = 67ed5e00abcf81cc0302ffeb0acf287a
ffmpeg getFrameResampled(76): md5 = 67ed5e00abcf81cc0302ffeb0acf287a
ffmpeg getFrameResampled(77): md5 = a1cd8a63b659a6b73988f0d2623e3300
ffmpeg getFrameResampled(78): md5 = 2089481a3970f452b8614479c7c9b6c2
ffmpeg getFrameResampled(79): md5 = 68af48237f75158d50285b4201505448
ffmpeg getFrameResampled(80): md5 = d376cdbb23b05a06cad6b17bccdac289
ffmpeg getFrameResampled(81): md5 = 47af98daacdc2a6875b3ab8f80d1c139
ffmpeg getFrameResampled(82): md5 = 5a46de8a3448b2455152dad11802289e
ffmpeg getFrameResampled(83): md5 = 700c22849d74a0b940b7e69e3d321ecf
ffmpeg getFrameResampled(84): md5 = d9d69f239be6b1162b1637600fca947a
ffmpeg getFrameResampled(85): md5 = 7c53df0cbf9cfafd5b264b14829a8ad4
ffmpeg getFrameResampled(86): md5 = 45bdd38e74b8e0872a958b0de796ba0b
ffmpeg getFrameResampled(87): md5 = 0eb53506bb7059c58e137bc7d4e5097d
ffmpeg getFrameResampled(88): md5 = 70a28e2fb508def712230f5ac9a8fcf5
ffmpeg getFrameResampled(89): md5 = 78b451c1ae135566ffa34ba722474d62
ffmpeg getFrameResampled(90): md5 = 3be2319a2ca5cd7f45316029191fcbe7
ffmpeg getFrameResampled(91): md5 = 362959e6572ff3bb674f1b177803ab1b
ffmpeg getFrameResampled(92): md5 = cd5e5114f5b72adc778d051cfdd20f60
ffmpeg getFrameResampled(93): md5 = d4517a7e9ba1f8460e895dfe2653a13c
ffmpeg getFrameResampled(94): md5 = ece9b5cd5fe1604fdf7e4dd026aec896
ffmpeg getFrameResampled(95): md5 = 63ca9dddcc591845b7837a3e990fee97
ffmpeg getFrameResampled(96): md5 = 6c745bae4ce6cfa28acc4ba1cd1575bb
ffmpeg getFrameResampled(97): md5 = f10e4b0463c7a41124dc6378652c35c1
ffmpeg getFrameResampled(98): md5 = 7aa567280ca22ac220a0f8d4a0f4c228
ffmpeg getFrameResampled(99): md5 = 20ee5a4422950933c05e2879e8e3c14e
ffmpeg getFrameResampled(100): md5 = 83ec70eb512dd098480cd3a9d871b43d
ffmpeg getFrameResampled(101): md5 = 83ec70eb512dd098480cd3a9d871b43d
ffmpeg getFrameResampled(102): md5 = 86bfa44d8a01825256644d2638846979
ffmpeg getFrameResampled(103): md5 = a04f3c478f95311e6fdc303206a01f24
ffmpeg getFrameResampled(104): md5 = fda5651d860e0c24fc5f494ef646a051
ffmpeg getFrameResampled(105): md5 = 8556b9779ba618e7fb8e2913ac3d29ee
ffmpeg getFrameResampled(106): md5 = 6912ac3643beb88772763ee6f00c6e34
ffmpeg getFrameResampled(107): md5 = 4d21783f816a7c9b329b492dba4ae451
ffmpeg getFrameResampled(108): md5 = 39178738b012420efcc1445dc7f2d053
ffmpeg getFrameResampled(109): md5 = fb79e3e1fd43a1359970eb4f16bd2f42
ffmpeg getFrameResampled(110): md5 = aa60b14ff04574e4f6e921d8c4ff36cc
ffmpeg getFrameResampled(111): md5 = 281ab8dbac5f43768a68f584cfd24bbb
