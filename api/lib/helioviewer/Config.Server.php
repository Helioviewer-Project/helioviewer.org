<?php
/**
 * Helioviewer API Configuration
 * @package Config
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 */
class Config {
	// Database
	const DB_HOST            = '';
	const DB_NAME            = '';
	const DB_USER            = '';
	const DB_PASS            = '';
	
	// Filepaths
	const TMP_ROOT_DIR       = '/home/esahelio/public_html/tmp';
	const WEB_ROOT_DIR       = '/home/esahelio/public_html';
	const CACHE_DIR          = '/home/esahelio/public_html/cache/';
	const JP2_DIR            = '/home/esahelio/public_html/jp2/';
	const KDU_LIBS_DIR       = '/home/esahelio/kakadu/lib';
	const EMPTY_TILE         = 'images/transparent_512.gif';
	
	// URL's
	const WEB_ROOT_URL       = 'http://helioviewer.org';
	const TMP_ROOT_URL       = 'http://helioviewer.org/tmp';	
	const EVENT_SERVER_URL   = "http://achilles.nascom.nasa.gov/~wamsler/API/index.php?";
		
	// Regular Expressions	
	const WEB_ROOT_DIR_REGEX = '/\/home\/esahelio\/public_html/';
	const WEB_ROOT_URL_REGEX = '/http:\/\/helioviewer\.org/';
	
	// Executables
	const KDU_MERGE_BIN      = '/home/esahelio/kakadu/bin/kdu_merge';
	const KDU_EXPAND         = '/home/esahelio/kakadu/bin/kdu_expand';
	const EXIF_TOOL          = '/home/esahelio/exiftool/exiftool';

	// Movie Parameters
	const MAX_MOVIE_FRAMES   = 150;
			
	// Image parameters
	const PNG_COMPRESSION_QUALITY  = 20;
	const JPEG_COMPRESSION_QUALITY = 75;
	const BIT_DEPTH                = 8;
	const NUM_COLORS               = 256;
			
	// Apache IMagick Module
	const MOD_IMAGICK_ENABLED = true;

	// Debugging
	const ENABLE_CACHE       = true;
}
?>
