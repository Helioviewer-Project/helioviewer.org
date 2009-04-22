<?php
/**
 * Helioviewer API Configuration
 * @package Config
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 *  TODO: Switch to ini + APC
 *  TODO: Instead of manually specifying backup servers, simply use any
 *  available tiling server that supports request.
 */
class Config {
	
	// Version Information
	const LAST_UPDATE		 = '2009/04/22';
	const BUILD_NUM          = 222;
	
	// Viewer
	const DEFAULT_ZOOM_LEVEL = 11;
	const DEFAULT_OBS_TIME   = 1065312000000;
	const DEFAULT_TIMESTEP   = 86400;
	const MIN_ZOOM_LEVEL     = 8;
	const MAX_ZOOM_LEVEL     = 15;           
	const PREFETCH_SIZE      = 0;
	
	// Database
	const DB_HOST            = 'localhost';
	const DB_NAME            = 'hv';
	const DB_USER            = 'helioviewer';
	const DB_PASS            = 'helioviewer';
	
	// Filepaths
	const TMP_ROOT_DIR       = '/var/www/hv/tmp';
	const WEB_ROOT_DIR       = '/var/www/hv';
	const CACHE_DIR          = '/var/www/hv/cache/';
	const JP2_DIR            = '/var/www/hv/jp2/';
	const KDU_LIBS_DIR       = '/usr/lib/kakadu/';
	const EMPTY_TILE         = 'images/transparent_512.png';
	
	// URL's
	const WEB_ROOT_URL       = 'http://localhost/hv';
	const TMP_ROOT_URL       = 'http://localhost/hv/tmp';
	const EVENT_SERVER_URL   = 'http://localhost:8080/Dispatcher/resources/eventCatalogs?';
	const API_BASE_URL       = 'api/index.php';
	
    // Tiling Servers
    const TILE_SERVER_1       = 'api/index.php';
    const TILE_SERVER_2       = 'http://delphi.nascom.nasa.gov/helioviewer/api/index.php';
    
    // Backup API
    const BACKUP_ENABLED     = false;
    const BACKUP_API         = 'http://delphi.nascom.nasa.gov/helioviewer/api/index.php';
    
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
	const TILE_PAD_WIDTH           = 8;
	
	// Image scale computation
	const BASE_ZOOM_LEVEL          = 10;
	const BASE_IMAGE_SCALE         = 2.63;

	// Apache IMagick Module
	const MOD_IMAGICK_ENABLED = false;
	
	// Debugging
	const ENABLE_CACHE = true;
    const ERROR_LOG    = '/var/www/hv/log/error';
}
?>
