#!/usr/bin/python
# -*- coding: utf-8 -*-

import os, sys, subprocess
from optparse import OptionParser, OptionError, IndentedHelpFormatter
from datetime import datetime
from math import log

def main(argv):
	''' Main '''
	printGreeting()
	args = getArguments()
	
	# Database configuration
	dbname = "hv2"
	dbuser = "helioviewer"
	dbpass = "helioviewer"
	
	# JP2 Scale Parameters
	baseScale  = 2.63 # Scale of an EIT image at the base zoom-level: 2.63 arcseconds/px
	baseZoom   = 10   # Zoom-level at which (EIT) images are of this scale.
	
	# Tilesize
	tileSize = 512
	
	# PHP Script for caching a single tile
	cacheTile = "./cacheTile.php"

	# Determine images to cache, e.g. 
	images = getDesiredImages(dbname, dbuser, dbpass, args)
	
	for zoomLevel in range(int(args.minZoom), int(args.maxZoom)+1):
		zoomOffset   = zoomLevel - baseZoom
		desiredScale = baseScale * (pow(2, zoomOffset))
	
		for img in images:
			desiredToActual = desiredScale / img['imgScaleX'] # Ratio of the desired scale to the actual JP2 image scale
			scaleFactor = log(desiredToActual, 2)
			relTs = tileSize * desiredToActual
			
			numTilesX = img['width']  / relTs
			numTilesY = img['height'] / relTs

			for x in range (-max(1, numTilesX/2), max(1, numTilesX/2)):
				for y in range (-max(1, numTilesY/2), max(1, numTilesY/2)):
					print "Caching tile(" + str(img['id']) + ", " + str(zoomLevel) + ", " + str(x) + ", " + str(y) + ");"
					ret = subprocess.call([cacheTile, str(img['id']), str(zoomLevel), str(x), str(y)])
	
	#print images[0]['width']
	
	# Next, for each image in resulting array, for each zoom-level, for each x & y coordinate call Tile constructor which generates the tile.
	#ret = subprocess.call(["ls", "-l"])
	#ret = subprocess.call(["./cacheTile.php " + id + " " + zoom + " " + x + " " + y])

def getArguments():
	''' Gets command-line arguments and handles validation '''
	parser = OptionParser("%prog [options]", formatter=IndentedHelpFormatter(2,30))
	parser.add_option("", "--min-Zoom",	dest="minZoom", metavar="ZOOM", help="Minimum zoom-level to cache")
	parser.add_option("", "--max-Zoom", dest="maxZoom", metavar="ZOOM", help="Minimum zoom-level to cache")
	parser.add_option("", "--start-Time", dest="startTime", help="UNIX_TIMESTAMP of date range start")
	parser.add_option("", "--end-Time", dest="endTime", help="UNIX_TIMESTAMP of date range end")

	try:                                
		options, args = parser.parse_args()
					
	except:
		usage(parser)
		sys.exit(2)

	ok = True

	if options.minZoom == None:
		print "Minimum zoom-level not specified!"
		ok = False
		
	if options.maxZoom == None:
		print "Maximum zoom-level not specified!"
		ok = False
		
	if options.startTime == None:
		print "Date range begining not specified!"
		ok = False
		
	if options.endTime == None:
		print "Date range ending not specified!"
		ok = False
		
	if not ok:
		usage(parser)
		sys.exit(2)
		
	return options
	
def getDesiredImages(dbname, dbuser, dbpass, args):
	import MySQLdb

	db = MySQLdb.connect(host = "localhost", db = dbname, user = dbuser, passwd = dbpass)
	cursor = db.cursor(cursorclass=MySQLdb.cursors.DictCursor)

	query = "SELECT *, unix_timestamp(timestamp) FROM image WHERE unix_timestamp(timestamp) >= " + args.startTime + " AND unix_timestamp(timestamp) <= " + args.endTime + ";"
	cursor.execute(query)
	
	return cursor.fetchall()

def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= Helioviewer Precaching Script                                    ="
	print "= By: Keith Hughitt, December 29, 2008                             ="
	print "=                                                                  ="
	print "= This script can be used to precache tiles from a specified range ="
	print "= of dates and zoom-levels.                                        ="
	print "=                                                                  ="
	print "===================================================================="

def usage(parser):
	''' Prints program usage description '''
	print ""
	parser.print_help()
	print "\n Example: \n"
	print "    \"precache.py --start-Time=1065312000 --end-Time=1065512000 --min-Zoom=10 --max-Zoom=14\"\n"
	
if __name__ == "__main__":
    main(sys.argv[1:])
