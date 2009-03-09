<?php
/**
 * Helioviewer API Configuration
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
	
	// URL's
	const WEB_ROOT_URL       = 'http://helioviewer.org';
	const TMP_ROOT_URL       = 'http://helioviewer.org/tmp';	
	const EVENT_SERVER_URL   = "http://achilles.nascom.nasa.gov/~wamsler/API/index.php?";
	const TILE_API_URL       = '/home/esahelio/public_html/api/lib/helioviewer/no-mod-imagick/Tile.php';
		
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
	const PNG_COMPRESSION_QUALITY = 40;
}
?>
