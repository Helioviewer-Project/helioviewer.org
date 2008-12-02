#!/usr/bin/python
# -*- coding: utf-8 -*-

import os, math, MySQLdb
from datetime import datetime

def main():
	printGreeting()
	path = getFilePath()
	images = traverseDirectory(path)

	print "Found " + str(len(images)) + " JPEG2000 images."

	#dbname, dbuser, dbpass = getDBInfo()
	dbname = "hv2"
	dbuser = "helioviewer"
	dbpass = dbuser

	db = MySQLdb.connect(host = "localhost", db = dbname, user = dbuser, passwd = dbpass)
	cursor = db.cursor()

	if(len(images) > 0):
		processJPEG2000Images(images, cursor)

	print "Finished!"

def traverseDirectory (path):
	''' Traverses file-tree starting with the specified path and builds a
		list of the available images '''
	images = []

	for child in os.listdir(path):
		node = os.path.join(path, child)
		if os.path.isdir(node):
			newImgs = traverseDirectory(node)
			images.extend(newImgs)
		else:
			if node[-3:] == "jp2":
				images.append(node)

	return images

def processJPEG2000Images (images, cursor):
	''' Processes a collection of JPEG2000 Images. '''
	measurementIds = getMeasurementIds(cursor)

	for img in images:
		#dir, file = os.path.split(img)
		meta = extractJP2MetaInfo(img)

		# Format date
		date = datetime.strptime(meta["date"][0:19], "%Y:%m:%d %H:%M:%S")

		#date = datetime.datetime(int(d[0:4]), int(d[5:7]), int(d[8:10]), int(d[11:13]), int(d[14:16]), int(d[17:19]))

		# insert into database
		query = "INSERT INTO image VALUES(NULL, %d, '%s', %s, %s, %s, %s, %s, %s, %s, '%s')" % (measurementIds[meta["det"] + meta["meas"]], date, meta["centerX"], meta["centerY"], meta["scaleX"], meta["scaleY"], meta["radius"], meta["width"], meta["height"], img)
		print query

		try:
			cursor.execute(query)

		except MySQLdb.Error, e:
			print "Error: " + e.args[1]

def extractJP2MetaInfo (img):
	''' Extracts useful meta-information from a given JP2 image and
		returns a dictionary of that information.'''
	import commands

	tags = {"date":    "Helioviewer Date Obs",
			"obs" :    "Helioviewer Observatory",
			"inst":    "Helioviewer Instrument",
			"det" :    "Helioviewer Detector",
			"meas":    "Helioviewer Measurement",
			"centerX": "Fits Crpix 1",
			"centerY": "Fits Crpix 2",
			"scaleX" : "Helioviewer Cdelt 1",
			"scaleY" : "Helioviewer Cdelt 2",
			"radius" : "Helioviewer Rsun",
			"height" : "Image Height",
			"width"  : "Image Width"}
	meta = {}

	cmd   = "exiftool %s" % img
	output= commands.getoutput(cmd)

	for (param, tag) in tags.items():
		for line in output.split("\n"):
			if (line.find(tag + "  ") != -1):
				meta[param] = line[34:]

	return meta

def getMeasurementIds(cursor):
	''' Returns an associative array of the measurement ID's used for the
		measurement types supported. Uses the combination of detector and
		measurement (e.g. 195EIT) as a hash key.'''

	query = "SELECT  detector.abbreviation as detector, measurement.abbreviation as measurement, measurement.id as measurementId FROM measurement LEFT JOIN detector on detectorId = detector.id"

	try:
		cursor.execute(query)
		result_array = cursor.fetchall()
	except MySQLdb.Error, e:
		print "Error: " + e.args[1]

	measurements = {}

	# Note: By convention, "0"'s are added in front of any identifier < full size. (e.g. "C2" -> "0C2").
	for meas in result_array:
		#measurements[meas[0].rjust(3, "0") + meas[1].rjust(3, "0")] = meas[2]
		measurements[meas[0] + meas[1]] = meas[2]

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
	print "= HelioViewer Database Population Script 0.96b                     ="
	print "= By: Keith Hughitt, November 07 2008                              ="
	print "=                                                                  ="
	print "= This script processes JP2 images, extracts their associated      ="
	print "= meta-information and stores it away in a database. Currently,    ="
	print "= it is assumed that the database strucuture has already been      ="
	print "= created (See createTables.sql). Please make sure the images      ="
	print "= are placed in their permanent home (within the server) before    ="
	print "= running the installation script.                                 ="
	print "=                                                                  ="
	print "= The script requires several pieces of information to function:   ="
	print "=   (1) The location of a directory containing JP2 images.         ="
	print "=   (2) The name of the database schema to populate.               ="
	print "=   (3) The name of the database user with appropriate access.     ="
	print "=   (4) The password for the specified database user.              ="
	print "=                                                                  ="
	print "= Additionally, ExifTool is required to function. It can be        ="
	print "= downloaded from:                                                 ="
	print "=   http://www.sno.phy.queensu.ca/~phil/exiftool/                  ="
	print "===================================================================="

def getFilePath():
	''' Prompts the user for the directory information '''

	path = raw_input("Location of JP2 Images: ")
	while not os.path.isdir(path):
		print "That is not a valid directory! Please try again."
		path = raw_input("Location of JP2 Images: ")

	return path

def getDBInfo():
	''' Prompts the user for the required database information '''
	dbname = raw_input("Database name: ")
	dbuser = raw_input("Database user: ")
	dbpass = raw_input("Database password: ")
	return dbname, dbuser, dbpass

if __name__ == '__main__':
	main()
