<?php
/**
 * Helioviewer.org Configuration
 * @package Config
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 */
class Config {

	// Version Information
	const LAST_UPDATE		 = '2009/09/10';
	const BUILD_NUM          = 321;

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
	const WEB_ROOT_DIR       = '/var/www/helioviewer';
	const TMP_ROOT_DIR       = '/var/www/helioviewer/tmp';
	const CACHE_DIR          = '/var/www/helioviewer/cache/';
	const JP2_DIR            = '/var/www/jp2/';
	const KDU_LIBS_DIR       = '/usr/local/lib/kakadu/';
	const EMPTY_TILE         = 'images/transparent_512.png';

	// Environmental variables
	const PATH_CMD			 = "export PATH=\$PATH:/usr/local/bin:/usr/local/lib:/usr/bin/:/usr/lib/";
	const DYLD_CMD			 = "export LD_LIBRARY_PATH=\$LD_LIBRARY_PATH:/usr/local/lib/:/usr/lib/";

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
    const BACKUP_SERVER         = 'http://delphi.nascom.nasa.gov/helioviewer/api/index.php';

	// Executables
	const KDU_MERGE_BIN      = '/usr/local/bin/kdu_merge';
	const KDU_EXPAND         = '/usr/local/bin/kdu_expand';
	const EXIF_TOOL          = '/usr/bin/exiftool';

	// Movie Parameters
	const MAX_MOVIE_FRAMES   = 150;
    const WATERMARK_URL      = "/var/www/helioviewer/images/logos/watermark_small_gs.png";

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
    const ERROR_LOG    = '/var/www/helioviewer/log/error';
}
?>
