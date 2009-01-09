<?php
/**
 * Helioviewer API Configuration (Dev)
 */
class Config {
	const TMP_ROOT_DIR = '/var/www/hv/tmp';
	const TMP_ROOT_URL = 'http://localhost/hv/tmp';
	const WEB_ROOT_DIR = '/var/www/hv';
	const WEB_ROOT_DIR_REGEX = '/\/var\/www\/hv/';
	const WEB_ROOT_URL = 'http://localhost/hv';
	const WEB_ROOT_URL_REGEX = '/http:\/\/localhost\/hv/';
	const KDU_MERGE_BIN = '/usr/bin/kdu_merge';
	const KDU_LIBS_DIR = '/usr/lib/kakadu/';
	const EXIF_TOOL = 'exiftool';
	const MAX_MOVIE_FRAMES = 150;
	const EVENT_SERVER_URL = "http://helioviewer.kicks-ass.net:8080/Dispatcher/resources/eventCatalogs?";
}
?>
