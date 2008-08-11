#!/usr/bin/python
# -*- coding: utf-8 -*-

import os, math, MySQLdb, datetime

def main():
	printGreeting()

	path = getFilePath()

	images = traverseDirectory(path)
	print "Found " + str(len(images)) + " images."

	dbname, dbuser, dbpass = getDBInfo()
	db = MySQLdb.connect(host = "localhost", db = dbname, user = dbuser, passwd = dbpass)
	cursor = db.cursor()

	processImages(images, cursor)

	print "Finished!"

def traverseDirectory (path):
	''' Traverses file-tree starting with the specified path and builds a
		list of meta-files representing the available images'''
	images = []

	for child in os.listdir(path):
		node = os.path.join(path, child)
		if os.path.isdir(node):
			new = traverseDirectory(node)
			images.extend(new)
		else:
			if node[-4:] == "meta":
				images.append(node[:-5])

	return images

def processImages (images, cursor):
	''' iterates through list of meta files and populates the image and tile
	    tables of the database schema provided. '''
	import glob
	measurementIds = getMeasurementIds(cursor)
	id = getStartingId(cursor);

	for img in images:
		dir, file = os.path.split(img)

		year = int(file[:4])
		mon  = int(file[5:7])
		day  = int(file[8:10])
		hour = int(file[11:13])
		min  = int(file[13:15])
		sec  = int(file[15:17])
		obs  = file[18:22]
		inst = file[23:26]
		det  = file[27:30]
		meas = file[31:34]
		zoom = int(file[35:])

		print "Processing " + file + "..."

		#Add images to the "image" table
		filetype = "png" if (inst == "LAS") else "jpg"

		date = datetime.datetime(year, mon, day, hour, min, sec)
		query = "INSERT INTO image VALUES(%d, %d, '%s', '%s')" % (id, measurementIds[meas], date, filetype)

		try:
			cursor.execute(query)

		except MySQLdb.Error, e:
			print "Error: " + e.args[1]

		#Add entries to the "tile" table
		'''
		for x in range(0, getNumTiles(zoom)/2):
			for y in range(0, getNumTiles(zoom)/2):
				if os.path.exists(os.path.join(dir, file, ):
					print "Tile exists!"
				else:
					print "Tile DOES NOT exist!"
		'''

		for tile in glob.glob(img + "*"):
			if tile[-4:] != "meta":
				tile_dir, tile_name = os.path.split(tile)
				x = int(tile_name[38:40])
				y = int(tile_name[41:43])
				blob = open(tile, 'rb').read()

				sql = "INSERT INTO tile VALUES(%d, %d, %d, %d, null, '%s')" % (id, x, y, zoom, MySQLdb.escape_string(blob))

				try:
					cursor.execute(sql)

				except MySQLdb.Error, e:
					print "Error: " + e.args[1]

		id += 1

def getMeasurementIds(cursor):
	''' Returns an associative array of the measurement ID's used for the
		measurement types supported. '''

	query = "SELECT id, name FROM measurement m LIMIT 0,1000"

	try:
		cursor.execute(query)
		result_array = cursor.fetchall()
	except MySQLdb.Error, e:
		print "Error: " + e.args[1]

	measurements = {}
	for meas in result_array:
		measurements[meas[1]] = meas[0]

	return measurements

def getStartingId(cursor):
	''' Returns the highest Id number found in the database before any new
		images are added. The id numbers can then start at the next highest
		number. This makes it easier to keep track of the image id when
		adding the tiles to the database later.'''

	query = "SELECT id FROM image ORDER BY id  DESC LIMIT 1"

	try:
		cursor.execute(query)
		result = cursor.fetchone()
	except MySQLdb.Error, e:
		print "Error: " + e.args[1]

	return (int(result[0]) + 1) if result else 0

def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= HelioViewer Database Population Script 0.5                       ="
	print "= By: Keith Hughitt, August 11, 2008                               ="
	print "=                                                                  ="
	print "= This script processes raw tile images, and inserts them into a   ="
	print "= database, along with their relevent information.                 ="
	print "=                                                                  ="
	print "= The script requires several pieces of information to function:   ="
	print "=   (1) The location of a directory containing tiled images.       ="
	print "=   (2) The name of the database schema to populate.               ="
	print "=   (3) The name of the database user with appropriate access.     ="
	print "=   (4) The password for the specified database user.              ="
	print "===================================================================="

def getFilePath():
	''' Prompts the user for the directory information '''

	path = raw_input("Root directory: ")
	while not os.path.isdir(path):
		print "That is not a valid directory! Please try again."
		path = raw_input("Root directory: ")

	return path

def getDBInfo():
	''' Prompts the user for the required database information '''
	dbname = raw_input("Database name: ")
	dbuser = raw_input("Database user: ")
	dbpass = raw_input("Database password: ")
	return dbname, dbuser, dbpass


def getNumTiles (zoomLevel):
	''' Returns the number of tiles expected for a given zoom-level '''

	#INCORRECT
	#Each image above zoom-level 9 consists of exactly 4 tiles. For zoom Levels
	#below that, the number of tiles is 4^2, 5^2, etc.
	#return int(4 if zoomLevel >= 10 else math.pow((13 - zoomLevel), 2))

	#CORRECT
	#Each image above zoom-level 9 consists of exactly 4 tiles. For zoom Levels
	#below that, the number of tiles is 4^2, 4^3, etc.
	return int(4 if zoomLevel >= 10 else math.pow(4, 11 - zoomLevel))

def compact(seq):
	'''Removes duplicate entries from a list.
	   From http://www.peterbe.com/plog/uniqifiers-benchmark'''
	seen = set()
	return [ x for x in seq if x not in seen and not seen.add(x)]

if __name__ == '__main__':
	main()
