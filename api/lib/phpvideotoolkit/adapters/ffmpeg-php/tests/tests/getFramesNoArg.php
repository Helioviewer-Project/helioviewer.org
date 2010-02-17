--TEST--
ffmpeg getFramesNoArg test
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
$i = 0;

while (($frame = $mov->getFrame()) != false) {
    $i++;
    $filename = $img . $i . '.png';
    $gd_image = $frame->toGDImage();
    imagepng($gd_image, $filename);
    printf("ffmpeg getFrame($i): md5 = %s\n", md5(file_get_contents($filename)));
    imagedestroy($gd_image);
    unlink($filename);
}
?>
--EXPECT--
ffmpeg getFrame(1): md5 = 3bdd86fce4a2556bd53b58c1bbebc7da
ffmpeg getFrame(2): md5 = 551362661dca92950a67e2462e246acb
ffmpeg getFrame(3): md5 = 143a0dad4fe8c1fdd3ea446193849e27
ffmpeg getFrame(4): md5 = 9a3b99e039a2d9a39ac5f386da37a35a
ffmpeg getFrame(5): md5 = ad6f536e556da31d751f53566d2da2bf
ffmpeg getFrame(6): md5 = f8e7fcd5631f87514cfa35b6828b1293
ffmpeg getFrame(7): md5 = e4033cf2881f1f30b2ea0da405390bed
ffmpeg getFrame(8): md5 = ba1e46c258b249da33e16ecef79c8143
ffmpeg getFrame(9): md5 = 91d1bca42a945f2bbac9a3d6d59024f5
ffmpeg getFrame(10): md5 = ce6fffed7b39e1ea52b3940de6936b00
ffmpeg getFrame(11): md5 = 694d5fea113f214e88755d0b86c6681b
ffmpeg getFrame(12): md5 = f3ec9da5b65091a94a8db9d059cd7b22
ffmpeg getFrame(13): md5 = 44d4356e5c03609dc3e6e74b7d299cdd
ffmpeg getFrame(14): md5 = 3f48d14a1d87d6f19d7787b62287597a
ffmpeg getFrame(15): md5 = b7bf7f2edf546c35664b25a9ac78128c
ffmpeg getFrame(16): md5 = 6bf69ecb098d5d12e922bfa7080b575d
ffmpeg getFrame(17): md5 = 7a02287cb3007e498d2f8ce474fc1f29
ffmpeg getFrame(18): md5 = a794562e8e8eceaa27a2a05f50e2db35
ffmpeg getFrame(19): md5 = 937d47b7216d8378c9735a088573878f
ffmpeg getFrame(20): md5 = 7ca87ad4bd247c5ba84f6dc455656453
ffmpeg getFrame(21): md5 = 8bc729bcee2a8206b78b094835bd20c0
ffmpeg getFrame(22): md5 = 497ff825736aba4f3e37a248c9042f0b
ffmpeg getFrame(23): md5 = ed30e3f38297d277d5daefb60d57252b
ffmpeg getFrame(24): md5 = 1972ef35ed91fc1e62d8567636600368
ffmpeg getFrame(25): md5 = d82d780ddf49a48799d09a6c0c806903
ffmpeg getFrame(26): md5 = d82d780ddf49a48799d09a6c0c806903
ffmpeg getFrame(27): md5 = 09c9a9c65ea75e4474af29f19cb065a7
ffmpeg getFrame(28): md5 = fb044edb9d04c8a26585e36225c71e21
ffmpeg getFrame(29): md5 = 492f37f01df6d5e48d44f0ab02bdd1b5
ffmpeg getFrame(30): md5 = 20e0efa22bd7eac2fb38695507384635
ffmpeg getFrame(31): md5 = 9ba40e7cdfdf5632dc0dca6887923df2
ffmpeg getFrame(32): md5 = 76b674d1d0de4fc29b666d5e08da66ab
ffmpeg getFrame(33): md5 = 4a1098944969e7cb1c4a860023ad60e8
ffmpeg getFrame(34): md5 = fc2a33faaa4099915d6058476d71458d
ffmpeg getFrame(35): md5 = d300e11368f0227ac075aa7c9ba09aee
ffmpeg getFrame(36): md5 = afdbd04dbbd4c03c9e4e41941c75c937
ffmpeg getFrame(37): md5 = 438c862937fbb29bb73d09ff2eaf4553
ffmpeg getFrame(38): md5 = 879835a6d408600cd429ec2bf6f8e72e
ffmpeg getFrame(39): md5 = 4d0754e4bdc811378d506300c9c666b9
ffmpeg getFrame(40): md5 = ab8233fecf17963a8c137d0ad9ea9c5c
ffmpeg getFrame(41): md5 = 5d14c6feeccc4c5fa8169c294dde0693
ffmpeg getFrame(42): md5 = abfae5f6e2ee3e13dc34f07d19efd914
ffmpeg getFrame(43): md5 = bb89dc5cfe692023a8909669b0d0f309
ffmpeg getFrame(44): md5 = 38fb08e6109680054da5b82781a0b9a0
ffmpeg getFrame(45): md5 = 4fe339072250857fcbc704f1ed6bb553
ffmpeg getFrame(46): md5 = 2868533e3691e32cfe9c57243bd1c589
ffmpeg getFrame(47): md5 = 87ba60b4f52f2256436719cdfe989001
ffmpeg getFrame(48): md5 = 54700387827a637a7dcda32e7041e1db
ffmpeg getFrame(49): md5 = 7740eb9d341a57f87fbba4c58c19e2b9
ffmpeg getFrame(50): md5 = 0d8c8d74966102fe4111c95b25565b8d
ffmpeg getFrame(51): md5 = 0d8c8d74966102fe4111c95b25565b8d
ffmpeg getFrame(52): md5 = e6d91c77fa6ebca6087de92b901fae61
ffmpeg getFrame(53): md5 = a7ccb77eabf73ee55eb7c519ebee14b0
ffmpeg getFrame(54): md5 = 41b759fabbc0fc4945d986bf5e6b9e99
ffmpeg getFrame(55): md5 = 175c5b0ce59b10b30f180230da4adcf2
ffmpeg getFrame(56): md5 = 781e1c0a0dc68676368d64470751642e
ffmpeg getFrame(57): md5 = faed4dfefd778dca4b3babb46b4358b6
ffmpeg getFrame(58): md5 = a6e6f65397cb957d4a32e6e057b855ed
ffmpeg getFrame(59): md5 = 06d5966f92e8d398c72d9b70951ea638
ffmpeg getFrame(60): md5 = 14bd05aec54f6e69ad5944f73705b0e3
ffmpeg getFrame(61): md5 = b0f5ed5bffe1de76cc09291bc325693e
ffmpeg getFrame(62): md5 = 67916986fab554d86de656daa83380ed
ffmpeg getFrame(63): md5 = fa67c2730e3f7315c653852a291721d0
ffmpeg getFrame(64): md5 = 819543fd8363ad0898a4a62decc89cc2
ffmpeg getFrame(65): md5 = 09351ae484ce966e812356309b8863e7
ffmpeg getFrame(66): md5 = d0590dada857a4291aae06e81942d223
ffmpeg getFrame(67): md5 = 4b4f7b65b5be3c70c64d5d1d9fdacba8
ffmpeg getFrame(68): md5 = 4ce123c67c27205a309dfe8844058ded
ffmpeg getFrame(69): md5 = 2b6ae0547eaaad0187f8331de7100321
ffmpeg getFrame(70): md5 = f6a54878b042a7907e404ab6a8d1fe1e
ffmpeg getFrame(71): md5 = 2c93583df7e21be39d401132cc8cd529
ffmpeg getFrame(72): md5 = f626aeede9090842c82b451e0141e379
ffmpeg getFrame(73): md5 = eb9160f6590cb0f4f63303b0bdb91c85
ffmpeg getFrame(74): md5 = 919223d9951afceec6536d51f71ce986
ffmpeg getFrame(75): md5 = 019d9bf6436fe8d910948e0dccfdbca7
ffmpeg getFrame(76): md5 = 019d9bf6436fe8d910948e0dccfdbca7
ffmpeg getFrame(77): md5 = 62f0a9957cd6a863dff3bd98986ccf3a
ffmpeg getFrame(78): md5 = 0e89a830644873281948dfd3e74c894c
ffmpeg getFrame(79): md5 = 30f16885a78f06c028059b8f1aea8947
ffmpeg getFrame(80): md5 = dcecb7b7c2155b3a89115d1f4648a5eb
ffmpeg getFrame(81): md5 = 00f34465bea2eebd88810149fd7d24ac
ffmpeg getFrame(82): md5 = 92477bb8eaded768e3c2a11309bcc54e
ffmpeg getFrame(83): md5 = c0e3995706b70a46c4c5cdb0c37ac15e
ffmpeg getFrame(84): md5 = a08ea3d49c858f6d7557a13dcff662c9
ffmpeg getFrame(85): md5 = ffa4c83ca71087c913ace0c451384311
ffmpeg getFrame(86): md5 = a998f3418fce0a238bbc17456da3a055
ffmpeg getFrame(87): md5 = 6159beee73b6dd206adcb7ac42522f46
ffmpeg getFrame(88): md5 = 0cd1ff64fc1336fca588b754687cd2b3
ffmpeg getFrame(89): md5 = 2223ef03684f94664eb95a14d7d46d73
ffmpeg getFrame(90): md5 = 82c0d9cbcb33901806220c7cb9b24a47
ffmpeg getFrame(91): md5 = ae029ca2c6199fea52a64b639f6f4c57
ffmpeg getFrame(92): md5 = f5259f7ac39efee46af0b3666fc9ca9d
ffmpeg getFrame(93): md5 = 8ee724ebf7bd50a9ce8ce932f3f96fc4
ffmpeg getFrame(94): md5 = cae0ca4a6a0c9de251f54817381c3e64
ffmpeg getFrame(95): md5 = 22312ac4e17d4bc77601481394fb7b3c
ffmpeg getFrame(96): md5 = ed3b323bf60fbfc6dfdb266e4be7b83e
ffmpeg getFrame(97): md5 = b51a930911fe7b561d80b7e5eafc24c9
ffmpeg getFrame(98): md5 = c91ed59a6d4da87f2558277ca576276e
ffmpeg getFrame(99): md5 = 6308fbc95abc294de93e43c12f0fa566
ffmpeg getFrame(100): md5 = c54c350baa468e99d92b45064f787b43
ffmpeg getFrame(101): md5 = c54c350baa468e99d92b45064f787b43
ffmpeg getFrame(102): md5 = 31425babe7ae6849e01c433e131ade5e
ffmpeg getFrame(103): md5 = fa6c09289d700264e79bfdee9a86f73a
ffmpeg getFrame(104): md5 = 94bd83396e4e24be255c66b3991ce316
ffmpeg getFrame(105): md5 = fc04d7d07a4e65d7c27109bb9b25dc2b
ffmpeg getFrame(106): md5 = 6d56528e607aa772b28aa976291fa190
ffmpeg getFrame(107): md5 = b38891aa11a0129e481f5f3cba02c099
ffmpeg getFrame(108): md5 = 4d4f37bbf1f81f96648c7d7b3a7d78d3
ffmpeg getFrame(109): md5 = 485da30fd589131f44a4060128583917
ffmpeg getFrame(110): md5 = f9fd44c3c88a4832d52c0dcaefdb44e6
ffmpeg getFrame(111): md5 = ea3a4515264db8ce7ee1c73603db66ca
