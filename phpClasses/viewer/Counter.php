<?php
class Counter {
	private static $counters;
	
	public static function getNext($name) {
		if (isset(self::$counters[$name])) {
			return ++self::$counters[$name];
		} else {
			return self::$counters[$name] = 0;
		}
	}
}
?>