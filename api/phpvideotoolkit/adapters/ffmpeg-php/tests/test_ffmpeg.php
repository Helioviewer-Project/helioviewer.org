<?
/*
 * This test script is not part of the automatic regression tests. It serves
 * as a simple manual test script and an example of the syntax for calling
 * the ffmpeg-php functions
 * 
 * To run it from the command line type 'php -q ffmpeg_test.php 'or from a 
 * browser * copy this file into your web root and point your browser at it.
 */

$extension = "ffmpeg";
$extension_soname = $extension . "." . PHP_SHLIB_SUFFIX;
$extension_fullname = PHP_EXTENSION_DIR . "/" . $extension_soname;

// load extension
if (extension_loaded($extension)) {
    echo 'The FFMPEG-PHP module is loaded and therefore these tests will be carried out upon the module and not the ffmpeg class apapters';
}
else
{
	require_once '../ffmpeg_movie.php';
	require_once '../ffmpeg_frame.php';
	require_once '../ffmpeg_animated_gif.php';
}

if (php_sapi_name() != 'cgi') {
    echo '<pre>';
}

$ignore_demo_files = true;
$dir = dirname(dirname(dirname(dirname(__FILE__))));
require_once $dir.'/examples/example-config.php';
$tmp_dir = PHPVIDEOTOOLKIT_EXAMPLE_ABSOLUTE_PATH.'tmp/';

// printf("ffmpeg-php version string: %s\n", FFMPEG_PHP_VERSION_STRING);
// printf("libavcodec build number: %d\n", LIBAVCODEC_BUILD_NUMBER);
// printf("libavcodec version number: %d\n", LIBAVCODEC_VERSION_NUMBER);

echo "--------------------";
print_class_methods("ffmpeg_movie");
echo "\n\n--------------------";
print_class_methods("ffmpeg_frame");
echo "\n\n--------------------";
print_class_methods("ffmpeg_animated_gif");
echo "\n\n--------------------\n";
// get an array for movies from the test media directory 
$movies = getDirFiles($dir.'/examples/to-be-processed');
// print_r($movies);
foreach($movies as $movie) {        
    $mov = new PHPVideoToolkit_movie($movie, false, $tmp_dir);
    printf("file name = %s\n", $mov->getFileName());
    printf("duration = %s seconds\n", $mov->getDuration());
    printf("frame count = %s\n", $mov->getFrameCount());
    printf("frame rate = %0.3f fps\n", $mov->getFrameRate());
    printf("comment = %s\n", $mov->getComment());
    printf("title = %s\n", $mov->getTitle());
    printf("author = %s\n", $mov->getAuthor());
    printf("copyright = %s\n", $mov->getCopyright());
    printf("get bit rate = %d\n", $mov->getBitRate());
    printf("has audio = %s\n", $mov->hasAudio() == 0 ? 'No' : 'Yes');
    if ($mov->hasAudio()) {
        printf("get audio codec = %s\n", $mov->getAudioCodec());
        printf("get audio bit rate = %d\n", $mov->getAudioBitRate());
        printf("get audio sample rate = %d \n", $mov->getAudioSampleRate());
        printf("get audio channels = %s\n", $mov->getAudioChannels());
    }
    printf("has video = %s\n", $mov->hasVideo() == 0 ? 'No' : 'Yes');
    if ($mov->hasVideo()) {
        printf("frame height = %d pixels\n", $mov->getFrameHeight());
        printf("frame width = %d pixels\n", $mov->getFrameWidth());
        printf("get video codec = %s\n", $mov->getVideoCodec());
        printf("get video bit rate = %d\n", $mov->getVideoBitRate());
        printf("get pixel format = %s\n", $mov->getPixelFormat());
        printf("get pixel aspect ratio = %s\n", $mov->getPixelAspectRatio());
        printf("get frame = %s\n", is_object($mov->getFrame(10)) ? 'true' : 'false');
        printf("get frame number = %d\n", $mov->getFrameNumber());
    }
    echo "\n\n--------------------\n";
}

if (php_sapi_name() != 'cgi') {
    echo '</pre>';
}

/* FUNCTIONS */
function print_class_methods($class) {
    echo "\nMethods available in class '$class':\n";
    $methods = get_class_methods($class);
    if (is_array($methods)) {
        foreach($methods as $method) {
            echo $method . "\n";
        }
    } else {
        echo "No Methods Defined\n";
    }
}

function getDirFiles($dirPath)
{
    if ($handle = opendir($dirPath))
    {
        while (false !== ($file = readdir($handle))) {
			if(strpos($file, '.') !== 0)
			{
            	$fullpath = $dirPath . '/' . $file;
				$info = pathinfo($fullpath);
            	if (!is_dir($fullpath) && $file != "CVS" && $info['extension'] != 'jpg')
                	$filesArr[] = trim($fullpath);
			}
        }
        closedir($handle);
    } 

    return $filesArr;   
}


?>
