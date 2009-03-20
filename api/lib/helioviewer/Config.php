<?php
/**
 * Helioviewer API Configuration
 * @package Config
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 *  TODO: Determine performance of storing in class vs. YAML (need to use for every tile)
 */
class Config {
	
	// Database
	const DB_HOST            = 'localhost';
	const DB_NAME            = 'hv2';
	const DB_USER            = 'helioviewer';
	const DB_PASS            = 'helioviewer';
	
	// Filepaths
	const TMP_ROOT_DIR       = '/var/www/hv/tmp';
	const WEB_ROOT_DIR       = '/var/www/hv';
	const CACHE_DIR          = '/var/www/hv/cache/';
	const JP2_DIR            = '/var/www/hv/jp2/';
	const KDU_LIBS_DIR       = '/usr/lib/kakadu/';
	const EMPTY_TILE         = 'images/transparent_512.gif';
	
	// URL's
	const WEB_ROOT_URL       = 'http://localhost/hv';
	const TMP_ROOT_URL       = 'http://localhost/hv/tmp';
	const EVENT_SERVER_URL   = "http://localhost:8080/Dispatcher/resources/eventCatalogs?";
	
	// Regular Expressions
	const WEB_ROOT_DIR_REGEX = '/\/var\/www\/hv/';
	const WEB_ROOT_URL_REGEX = '/http:\/\/localhost\/hv/';
	
	// Executables
	const KDU_MERGE_BIN      = '/usr/bin/kdu_merge';
	const KDU_EXPAND         = '/usr/bin/kdu_expand';
	const EXIF_TOOL          = 'exiftool';
	
	// Movie Parameters
	const MAX_MOVIE_FRAMES   = 150;

	// Image parameters
	const PNG_COMPRESSION_QUALITY  = 20;
	const JPEG_COMPRESSION_QUALITY = 75;
	const BIT_DEPTH                = 8;
	const NUM_COLORS               = 256;

	// Apache IMagick Module
	const MOD_IMAGICK_ENABLED = false;
	
	// Debugging
	const ENABLE_CACHE = true;
}
?>
