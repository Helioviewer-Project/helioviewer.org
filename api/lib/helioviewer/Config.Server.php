<?php
/**
 * Helioviewer API Configuration
 */
class Config {
	const TMP_ROOT_DIR = '/home/esahelio/public_html/tmp';
	const TMP_ROOT_URL = 'http://helioviewer.org/tmp';
	const WEB_ROOT_DIR = '/home/esahelio/public_html';
	const WEB_ROOT_DIR_REGEX = '/\/home\/esahelio\/public_html/';
	const WEB_ROOT_URL = 'http://helioviewer.org';
	const WEB_ROOT_URL_REGEX = '/http:\/\/helioviewer\.org/';
	const KDU_MERGE_BIN = '/home/esahelio/kakadu/bin/kdu_merge';
	const KDU_LIBS_DIR = '/home/esahelio/kakadu/lib';
	const EXIF_TOOL = '/home/esahelio/exiftool/exiftool';
	const MAX_MOVIE_FRAMES = 150;
	const EVENT_SERVER_URL = "http://helioviewer.kicks-ass.net:8080/Dispatcher/resources/eventCatalogs?";
}
?>
