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
	dbname = "hv"
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
			
			xStart = max(-max(1, numTilesX/2), args.xStart)
			xEnd   = min( max(1, numTilesX/2), args.xEnd)
			yStart = max(-max(1, numTilesY/2), args.yStart)
			yEnd   = min( max(1, numTilesY/2), args.yEnd)

			for x in range (xStart, xEnd):
				for y in range (yStart, yEnd):
					print "Caching tile(" + str(img['id']) + ", " + str(zoomLevel) + ", " + str(x) + ", " + str(y) + ");"
					#ret = subprocess.call([cacheTile, str(img['id']), str(zoomLevel), str(x), str(y)], stderr=subprocess.PIPE)
					ret = subprocess.call([cacheTile, str(img['id']), str(zoomLevel), str(x), str(y)])

def getArguments():
	''' Gets command-line arguments and handles validation '''
	parser = OptionParser("%prog [options]", formatter=IndentedHelpFormatter(2,30))
	parser.add_option("", "--min-Zoom",	dest="minZoom", metavar="ZOOM", help="Minimum zoom-level to cache")
	parser.add_option("", "--max-Zoom", dest="maxZoom", metavar="ZOOM", help="Minimum zoom-level to cache")
	parser.add_option("", "--start-Time", dest="startTime", help="UNIX_TIMESTAMP of date range start")
	parser.add_option("", "--end-Time", dest="endTime", help="UNIX_TIMESTAMP of date range end")
	parser.add_option("", "--x-Start", dest="xStart", help="[Optional] Horizontal lower limit on tiles to precache.")
	parser.add_option("", "--x-End", dest="xEnd", help="[Optional] Horizontal upper limit on tiles to precache.")
	parser.add_option("", "--y-Start", dest="yStart", help="[Optional] Vertical lower limit on tiles to precache.")
	parser.add_option("", "--y-End", dest="yEnd", help="[Optional] Vertical lower limit on tiles to precache.")

	try:                                
		options, args = parser.parse_args()
					
	except:
		usage(parser)

	ok = True

	# Required parameters
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
		
	# Optional parameters (None ~ negative infinity, () ~ positive infinity)
	if options.xStart != None:
		options.xStart = int(options.xStart)

	if options.yStart != None:
		options.yStart = int(options.yStart)

	if options.xEnd == None:
		options.xEnd = ()
	else:
		options.xEnd = int(options.xEnd) + 1
		
	if options.yEnd == None:
		options.yEnd = ()		
	else:
		options.yEnd = int(options.yEnd) + 1
		
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
	print "\n Examples: \n"
	print "    \"precache.py --start-Time=1065312000 --end-Time=1065512000 --min-Zoom=10 --max-Zoom=14\"\n"
	print "\n"
	print "    \"./precache.py --start-Time=1064966400 --end-Time=1067644799 --min-Zoom=13 --max-Zoom=14 --x-Start=-1 --x-End=1 --y-Start=-1 --y-End=1\"\n"
	
if __name__ == "__main__":
    main(sys.argv[1:])
