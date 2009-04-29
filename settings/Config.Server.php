<?php
/**
 * Helioviewer API Configuration
 * @package Config
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 */
class Config {
    
  	// Version Information
	const LAST_UPDATE		 = '2009/04/29';
	const BUILD_NUM          = 225;
    
   	// Viewer
	const DEFAULT_ZOOM_LEVEL = 11;
	const DEFAULT_OBS_TIME   = 1065312000000;
	const DEFAULT_TIMESTEP   = 86400;
	const MIN_ZOOM_LEVEL     = 8;
	const MAX_ZOOM_LEVEL     = 15;           
	const PREFETCH_SIZE      = 0;
    
	// Database
	const DB_HOST            = '';
	const DB_NAME            = '';
	const DB_USER            = '';
	const DB_PASS            = '';
	
	// Filepaths
	const WEB_ROOT_DIR       = '/home/esahelio/public_html';
	const TMP_ROOT_DIR       = '/home/esahelio/public_html/tmp';
	const CACHE_DIR          = '/home/esahelio/public_html/cache/';
	const JP2_DIR            = '/home/esahelio/public_html/jp2/';
	const KDU_LIBS_DIR       = '/home/esahelio/kakadu/lib';
	const EMPTY_TILE         = 'images/transparent_512.png';
	
	// URL's
	const WEB_ROOT_URL       = 'http://helioviewer.org';
	const TMP_ROOT_URL       = 'http://helioviewer.org/tmp';	
	const EVENT_SERVER_URL   = 'http://achilles.nascom.nasa.gov/~wamsler/API/index.php?';
   	const API_BASE_URL       = 'api/index.php';
    
    // Tiling Servers
    const TILE_SERVER_1       = 'api/index.php';
    const TILE_SERVER_2       = 'http://delphi.nascom.nasa.gov/helioviewer/api/index.php';

    // Backup API
    const BACKUP_ENABLED     = false;
    const BACKUP_API         = 'http://delphi.nascom.nasa.gov/helioviewer/api/index.php';
	
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
	const TILE_PAD_WIDTH           = 8;
			
	// Image scale computation
	const BASE_ZOOM_LEVEL          = 10;
	const BASE_IMAGE_SCALE         = 2.63;

	// Apache IMagick Module
	const MOD_IMAGICK_ENABLED = false;

	// Debugging
	const ENABLE_CACHE = true;
    const ERROR_LOG    = '/home/esahelio/public_html/log/error';
}
?>
