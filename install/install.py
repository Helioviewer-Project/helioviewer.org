#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys, os, math, getpass, commands
from datetime import datetime
from xml.dom.minidom import parseString

def main():
	printGreeting()

	path = getFilePath()
	images = traverseDirectory(path)
	
	if(len(images) == 0):
		print "No JPEG 2000 images found. Exiting installation."
		sys.exit(2)
	else:
		print "Found " + str(len(images)) + " JPEG2000 images."

	adminuser, adminpass, dbuser, dbpass = getDBInfo()
	
	cursor = setupDatabaseSchema(adminuser, adminpass, dbuser, dbpass)

	processJPEG2000Images(images, cursor)
		
	# Add Index
	# CREATE INDEX image_index USING BTREE ON image (timestamp);

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
	INSERTS_PER_QUERY = 500
	
	remainder = len(images) % INSERTS_PER_QUERY
	
	dataSources = getDataSources(cursor)
	
	if len(images) >= INSERTS_PER_QUERY:
		for x in range(len(images) / INSERTS_PER_QUERY):
			for y in range(INSERTS_PER_QUERY):
				img = images.pop()
				path, uri = os.path.split(img)
				meta = extractJP2MetaInfo(img, dataSources)
		
				# Format date (> Python 2.5 Method)
				# date = datetime.strptime(meta["date"][0:19], "%Y:%m:%d %H:%M:%S")
		
				print "Processing image: " + img
		
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

def extractJP2MetaInfo (img, sources):
	''' Extracts useful meta-information from a given JP2 image and
		returns a dictionary of that information.'''
	meta = {}

	# TODO: (2009/08/18)
	# Create a method to try and sniff the dataSource type before processing? Or do lazily?
	
	# Get XMLBox as DOM
	dom = parseString(getJP2XMLBox(img, "meta"))

	# FITS Element
	fits = dom.getElementsByTagName("fits")[0];
	
	# Date
	
	#EIT?
	eitdate = fits.getElementsByTagName("DATE_OBS")
	if eitdate:
		datestring = eitdate[0].childNodes[0].nodeValue
		datestring = datestring[0:-1] + "000Z" # Python uses microseconds (See: http://bugs.python.org/issue1982)
		date = datetime.strptime(datestring, "%Y-%m-%dT%H:%M:%S.%fZ")
		
	meta["date"] = date

	return meta

def getJP2XMLBox(file, root):
	''' Given a filename and the name of the root node, extracts
	    the XML header box from a JP2 image '''
	fp = open(file, 'rb')
	
	xml = ""
	for line in fp:
	     xml += line
	     if line.find("</%s>" % root) != -1:
	             break
	xml = xml[xml.find("<%s>" % root):]
	
	return xml

def getDataSources(cursor):
	''' Returns a list of the known datasources '''

	sql = \
	''' SELECT
			datasource.id as id,
			observatory.name as observatory,
			instrument.name as instrument,
			detector.name as detector,
			measurement.name as measurement
		FROM datasource
			LEFT JOIN observatory ON datasource.observatoryId = observatory.id 
			LEFT JOIN instrument ON datasource.instrumentId = instrument.id 
			LEFT JOIN detector ON datasource.detectorId = detector.id 
			LEFT JOIN measurement ON datasource.measurementId = measurement.id;'''

	cursor.execute(sql)
	return cursor.fetchall()


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
	
	return cursor

def createDB(adminuser, adminpass, dbuser, dbpass):
	''' Creates database '''
	try:
		#TODO (2009/08/18) Catch error case when db already exists, and gracefully exit
		db = MySQLdb.connect(host="localhost", user=adminuser, passwd=adminpass)
		cursor = db.cursor()
		cursor.execute("CREATE DATABASE IF NOT EXISTS helioviewer;")
		cursor.execute("GRANT ALL ON helioviewer.* TO '%s'@'localhost' IDENTIFIED BY '%s';" % (dbuser, dbpass))
	except MySQLdb.Error, e:
		print "Error: " + e.args[1]
		sys.exit(2)

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
	cursor.execute(
	'''CREATE TABLE `datasource` (
	    `id`            SMALLINT unsigned NOT NULL,
	    `name`          VARCHAR(127) NOT NULL,
	    `description`   VARCHAR(255),
	    `observatoryId` SMALLINT unsigned NOT NULL,
	    `instrumentId`  SMALLINT unsigned NOT NULL,
	    `detectorId`    SMALLINT unsigned NOT NULL,
	    `measurementId` SMALLINT unsigned NOT NULL,
	    `layeringOrder` TINYINT NOT NULL,
	    `dateField`		VARCHAR(127) NOT NULL,
	    `dateFormat`	VARCHAR(127) NOT NULL,
	  PRIMARY KEY  (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;''')
	
	cursor.execute('''
	INSERT INTO `datasource` VALUES
		(0, 'EIT 171', 'SOHO EIT 171', 0, 0, 0, 0, 1, 'DATE_OBS','')
	''')

def createObservatoryTable(cursor):
	""" Creates table to store observatory information """
	
	cursor.execute('''
	CREATE TABLE `observatory` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;''')	

	cursor.execute('''
	INSERT INTO `observatory` VALUES
		(0, 'SOHO', 'Solar and Heliospheric Observatory'),
		(1, 'TRACE', 'The Transition Region and Coronal Explorer');
	''')

def createInstrumentTable(cursor):
	""" Creates table to store instrument information """
	
	cursor.execute('''
	CREATE TABLE `instrument` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;''')
	
	cursor.execute('''
	INSERT INTO `instrument` VALUES
		(0, 'EIT',   'Extreme ultraviolet Imaging Telescope'),
		(1, 'LASCO', 'The Large Angle Spectrometric Coronagraph'),
		(2, 'MDI',   'Michelson Doppler Imager'),
		(3, 'TRACE', 'TRACE');
	''')



def createDetectorTable(cursor):
	""" Creates table to store detector information """
	
	cursor.execute('''
	CREATE TABLE `detector` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;''')
	
	cursor.execute('''
	INSERT INTO `detector` VALUES
		(0, '', 'EIT'),
		(1, 'C2', 'LASCO C2'),
		(2, 'C3', 'LASCO C3'),
		(3, '', 'MDI'),
		(4, '', 'TRACE');''')


def createMeasurementTable(cursor):
	""" Creates table to store measurement information """
	
	cursor.execute('''
	CREATE TABLE `measurement` (
	  `id`          SMALLINT unsigned NOT NULL,
	  `name`        VARCHAR(255) NOT NULL,
	  `description` VARCHAR(255) NOT NULL,
	  `units`       VARCHAR(20)  NOT NULL,
	   PRIMARY KEY (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;''')
	
	cursor.execute('''
	INSERT INTO `measurement` VALUES
		(0, '171', '171 Ångström extreme ultraviolet', 'Å'),
		(1, '195', '195 Ångström extreme ultraviolet', 'Å'),
		(2, '284', '284 Ångström extreme ultraviolet', 'Å'),
		(3, '304', '304 Ångström extreme ultraviolet', 'Å'),
		(4, 'int', 'Intensitygram', 'DN'),
		(5, 'mag', 'Magnetogram', 'Mx'),
		(6, 'WL', 'White Light', 'DN');''')



def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= Helioviewer Database Population Script 0.99.1                    ="
	print "= Last updated: 2009/08/18                                         ="
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
