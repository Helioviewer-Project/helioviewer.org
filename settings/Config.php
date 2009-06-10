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
	// $PATH and $DYLD_LIBRARY_PATH commands so that this will run on Jaclyn's Mac
	const PATH_CMD			 = "export PATH=\$PATH:/sw/bin:/opt/local/bin:/usr/local/bin:/opt/local/lib:/usr/bin:/bin:/usr/sbin:/sbin:/usr/X11/bin";
	const DYLD_CMD			 = "export DYLD_LIBRARY_PATH=\$DYLD_LIBRARY_PATH:/Users/beck/kakadu/lib/";
	// Version Information
	const LAST_UPDATE		 = '2009/06/03';
	const BUILD_NUM          = 233;
	
	// Viewer
	const DEFAULT_ZOOM_LEVEL = 11;
	const DEFAULT_OBS_TIME   = 1065312000000;
	const DEFAULT_TIMESTEP   = 86400;
	const MIN_ZOOM_LEVEL     = 8;
	const MAX_ZOOM_LEVEL     = 15;           
	const PREFETCH_SIZE      = 0;
	
	// Database
	const DB_HOST            = 'localhost';
	const DB_NAME            = 'helioviewer';
	const DB_USER            = 'beck';
	const DB_PASS            = 'Wdyn2mf?';
	
	// Filepaths
	const WEB_ROOT_DIR       = '/Library/WebServer/Documents/helioviewer';
	const TMP_ROOT_DIR       = '/Users/beck/helioviewer/tmp';
	const CACHE_DIR          = '/Users/beck/helioviewer/cache/';
	const JP2_DIR            = '/Library/WebServer/Documents/jp2/';
	const KDU_LIBS_DIR       = '/Users/beck/kakadu/lib/';
	const EMPTY_TILE         = 'images/transparent_512.png';
	
	// URL's
	const WEB_ROOT_URL       = 'http://localhost/helioviewer';
	const TMP_ROOT_URL       = 'http://localhost/helioviewer/tmp';
	const EVENT_SERVER_URL   = 'http://achilles.nascom.nasa.gov/~wamsler/API/index.php?';
	const API_BASE_URL       = 'api/index.php';
	
    // Tiling Servers
    const DISTRIBUTED_TILING_ENABLED  = false;
    const TILE_SERVER_1               = 'api/index.php';
    const TILE_SERVER_2               = 'http://delphi.nascom.nasa.gov/helioviewer/api/index.php';
    
    // Backup API
    const BACKUP_ENABLED     = false;
    const BACKUP_API         = 'http://delphi.nascom.nasa.gov/helioviewer/api/index.php';
	
	// Executables
	const KDU_MERGE_BIN      = '/Users/beck/kakadu/bin/kdu_merge';
	const KDU_EXPAND         = '/Users/beck/kakadu/bin/kdu_expand';
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
	
	// Debugging
	const ENABLE_CACHE = true;
    const ERROR_LOG    = '/Users/beck/helioviewer/log/error';
}
?>
