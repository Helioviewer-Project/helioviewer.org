<?php
/**
 * Helioviewer.org Configuration
 * @package Config
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 */
class Config {

	// Version Information
	const LAST_UPDATE		 = '2009/07/23';
	const BUILD_NUM          = 262;

	// Viewer
	const DEFAULT_OBS_TIME   = '2003-10-05T00:00:00Z';
  	const DEFAULT_ZOOM_LEVEL = 11;
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
	const WEB_ROOT_DIR       = '/var/www/hv';
	const TMP_ROOT_DIR       = '/var/www/hv/tmp';
	const CACHE_DIR          = '/var/www/hv/cache/';
	const JP2_DIR            = '/var/www/hv/jp2/v20090511/';
	const KDU_LIBS_DIR       = '/usr/lib/kakadu/';
	const EMPTY_TILE         = 'images/transparent_512.png';

	// Environmental variables
	const PATH_CMD			 = "export PATH=\$PATH";
	const DYLD_CMD			 = "export DYLD_LIBRARY_PATH=\$DYLD_LIBRARY_PATH";

	// URL's
	const WEB_ROOT_URL       = 'http://localhost/hv';
	const TMP_ROOT_URL       = 'http://localhost/hv/tmp';
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
	const KDU_MERGE_BIN      = '/usr/bin/kdu_merge';
	const KDU_EXPAND         = '/usr/bin/kdu_expand';
	const EXIF_TOOL          = 'exiftool';

	// Movie Parameters
	const MAX_MOVIE_FRAMES   = 1500;
    const WATERMARK_URL      = "/var/www/hv/images/logos/watermark_small_gs.png";

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
    const ERROR_LOG    = '/var/www/hv/log/error';
}
?>
