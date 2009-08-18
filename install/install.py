#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys, os, math, getpass
from datetime import datetime

def main():
	printGreeting()

	path = getFilePath()
	images = traverseDirectory(path)

	print "Found " + str(len(images)) + " JPEG2000 images."

	adminuser, adminpass, dbuser, dbpass = getDBInfo()

	setupDatabaseSchema(adminuser, adminpass, dbuser, dbpass)

	print "works so far!"
	sys.exit(2)


	# Exiftool location

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
	''' TODO: Multi-inserts '''
	measurementIds = getMeasurementIds(cursor)

	for img in images:
		path, uri = os.path.split(img)
		meta = extractJP2MetaInfo(img)

		# Format date (> Python 2.5 Method)
		# date = datetime.strptime(meta["date"][0:19], "%Y:%m:%d %H:%M:%S")

		print "Image: " + img

		# Format date
		d = meta["date"]

		# Temporary work-around
		if d[17:19] == "60":
			secs = "30"
		else:
			secs = d[17:19]

		date = datetime(int(d[0:4]), int(d[5:7]), int(d[8:10]), int(d[11:13]), int(d[14:16]), int(secs))

		# insert into database
		query = "INSERT INTO image VALUES(NULL, %d, '%s', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, '%s')" % (
			measurementIds[meta["det"] + meta["meas"]],
			date,
			meta["centering"],
			meta["centerX"],
			meta["centerY"],
			meta["lengthX"],
			meta["lengthY"],
			meta["scaleX"],
			meta["scaleY"],
			meta["radius"],
			meta["width"],
			meta["height"],
			meta["opacityGrp"],
			uri)
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
			"centering" : "Helioviewer Centering",
			"centerX"   : "Helioviewer Xcen",
			"lengthX"   : "Helioviewer Xlen",
			"centerY"   : "Helioviewer Ycen",
			"lengthY"   : "Helioviewer Ylen",
			"scaleX"    : "Helioviewer Cdelt 1",
			"scaleY"    : "Helioviewer Cdelt 2",
			"radius"    : "Helioviewer Rsun",
			"height"    : "Image Height",
			"width"     : "Image Width",
			"opacityGrp": "Helioviewer Opacity Group"}
	meta = {}

	cmd = "exiftool %s" % img
	output = commands.getoutput(cmd)

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

def setupDatabaseSchema(adminuser, adminpass, dbuser, dbpass):
	''' Sets up Helioviewer.org database schema '''
	createDB(adminuser, adminpass, dbuser, dbpass)

	# connect to helioviewer database
	db = MySQLdb.connect(host="localhost", db="helioviewer", user=dbuser, passwd=dbpass)
	cursor = db.cursor()

	createSourceTable(cursor)
	createObservatoryTable(cursor)
	createInstrumentTable(cursor)
	createDetectorTable(cursor)
	createMeasurementTable(cursor)
	createImageTable(cursor)

def createDB(adminuser, adminpass, dbuser, dbpass):
	''' Creates database '''
	db = MySQLdb.connect(host="localhost", user=adminuser, passwd=adminpass)
	cursor = db.cursor()

	sql = \
	'''CREATE DATABASE IF NOT EXISTS helioviewer;
	GRANT ALL ON helioviewer.* TO '%s'@'localhost' IDENTIFIED BY '%s';
	''' % (dbuser, dbpass)

	cursor.execute(sql)
	cursor.close()

def createImageTable(cursor):
	sql = \
	'''CREATE TABLE `image` (
	  `id`			INT unsigned NOT NULL auto_increment,
	  `uri`			VARCHAR(255) NOT NULL,
	  `timestamp`	datetime NOT NULL default '0000-00-00 00:00:00',
	  `sourceId`	SMALLINT unsigned NOT NULL,
	  `corrupt`		BOOL default 0,
	  PRIMARY KEY  (`id`), INDEX (`id`)
	);'''
	cursor.execute(sql)

def createSourceTable(cursor):
	sql = \
	'''CREATE TABLE `datasource` (
		`id`			SMALLINT unsigned NOT NULL,
		`name`			VARCHAR(255) NOT NULL,
		`description`   VARCHAR(255),
		`observatoryId` SMALLINT unsigned NOT NULL,
		`instrumentId`  SMALLINT unsigned NOT NULL,
		`detectorId`	SMALLINT unsigned NOT NULL,
        `measurementId` SMALLINT unsigned NOT NULL,
        `layeringOrder`	TINYINT NOT NULL,
	  PRIMARY KEY  (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;'''
	cursor.execute(sql)

def createObservatoryTable(cursor):
	sql = \
	'''CREATE TABLE `observatory` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;'''

	cursor.execute(sql)

	inserts = \
	'''	INSERT INTO `observatory` VALUES(1, 'SOHO', 'Solar and Heliospheric Observatory'),
	(2, 'TRACE', 'The Transition Region and Coronal Explorer');'''

	cursor.execute(inserts)


def createInstrumentTable(cursor):
	sql = \
	'''CREATE TABLE `instrument` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;
	
	INSERT INTO `instrument` VALUES(1, 'EIT',   'Extreme ultraviolet Imaging Telescope');
	INSERT INTO `instrument` VALUES(2, 'LASCO', 'The Large Angle Spectrometric Coronagraph');
	INSERT INTO `instrument` VALUES(3, 'MDI',   'Michelson Doppler Imager');
	INSERT INTO `instrument` VALUES(4, 'TRACE', 'TRACE');'''

	cursor.execute(sql)

def createDetectorTable(cursor):
	sql = \
	'''CREATE TABLE `detector` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;
	
	INSERT INTO `detector` VALUES(1, 'C2', 'LASCO C2');
	INSERT INTO `detector` VALUES(2, 'C3', 'LASCO C3');
	INSERT INTO `detector` VALUES(3, '', 'EIT');
	INSERT INTO `detector` VALUES(4, '', 'MDI');
	INSERT INTO `detector` VALUES(5, '', 'TRACE');'''
	cursor.execute(sql)

def createMeasurementTable(cursor):
	sql = \
	'''CREATE TABLE `measurement` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	  `units`       VARCHAR(20)  NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;
	
	INSERT INTO `measurement` VALUES(1, '171', '171 Angstrom extreme ultraviolet', 'nm');
	INSERT INTO `measurement` VALUES(2, '195', '195 Angstrom extreme ultraviolet', 'nm');
	INSERT INTO `measurement` VALUES(3, '284', '284 Angstrom extreme ultraviolet', 'nm');
	INSERT INTO `measurement` VALUES(4, '304', '304 Angstrom extreme ultraviolet', 'nm');
	INSERT INTO `measurement` VALUES(5, '171', '171 Angstrom extreme ultraviolet', 'nm');
	INSERT INTO `measurement` VALUES(6, 'int', 'Intensitygram');
	INSERT INTO `measurement` VALUES(7, 'mag', 'Magnetogram');
	INSERT INTO `measurement` VALUES(8, 'WL', 'White Light');
	INSERT INTO `measurement` VALUES(9, 'WL', 'White Light');'''
	cursor.execute(sql)



def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= Helioviewer Database Population Script 0.99                      ="
	print "= Last updated: 2009/08/17                                         ="
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
	adminuser = raw_input("Database admin username [root]: ")
	adminpass = getpass.getpass("Database admin password: ")
	dbuser = raw_input("New database username [Helioviewer]: ")
	dbpass = getpass.getpass("New password [Helioviewer]: ")

	# Default values
	if adminuser == "":
		adminuser = "root"
	if dbuser == "":
		dbuser = "helioviewer"
	if dbpass == "":
		dbpass = "helioviewer"

	return adminuser, adminpass, dbuser, dbpass

def checkModules(modules):
	''' Checks for module's existence and attempts to suggest a possible solution for any mising module required '''
	missing = []

	for module in modules:
		try:
			exec "import %s" % module
			exec "del %s" % module
		except ImportError:
			missing.append(module)

	# If there are any missing modules, suggest a method for installation and exit
	if len(missing) > 0:
		# Error message
		print "[Error] Unable to find module(s):",
		for m in missing:
			print " " + m,
		print ""

		# Determine OS
		system = getOS()

		knownpackages = True

		# Fedora
		if (system == "fedora"):
			msg = "To install, use the following command:\n"
			msg += "    su -c \"yum check-update; yum install"

			for m in missing:
				if m == "MySQLdb":
					msg += " MySQL-python"
				else:
					knownpackages = False

			msg += "\"";

		# Ubuntu	
		elif (system == "ubuntu"):
			msg = "To install, use the following command:"
			msg += "    sudo apt-get update; sudo apt-get install"

			for m in missing:
				if m == "MySQLdb":
					msg += " python-mysqldb"
				else:
					knownpackages = False

		else:
			msg = "Please install these modules before continuing."

		if not knownpackages:
			msg = "Please install these modules before continuing."

		print msg
		sys.exit(2)

def getOS():
	''' Determine operating system in order to suggest module installation method '''
	if (os.uname()[3].lower().find("ubuntu") != -1):
		return "ubuntu"
	elif (os.uname()[2].find("fc") != -1):
		return "fedora"
	else:
		return "other"

if __name__ == '__main__':
	# Attempt to load require modules
	checkModules(["MySQLdb"])
	import MySQLdb

	main()
