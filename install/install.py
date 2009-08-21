#!/usr/bin/python


###############################################################################
# Helioviewer Database Installation Tool
# Last Updated: 2009/08/21
###############################################################################
import sys
from org.helioviewer.HelioviewerInstallWizard import loadGUIInstaller
from org.helioviewer.jp2 import *
from org.helioviewer.db  import *
from org.helioviewer.utils import *

def main(args):
    loadGUIInstaller(args)

	#path = getFilePath()
	#images = traverseDirectory(path)
	
	#if(len(images) == 0):
	#	print "No JPEG 2000 images found. Exiting installation."
	#	sys.exit(2)
	#else:
	#	print "Found " + str(len(images)) + " JPEG2000 images."

	#adminuser, adminpass, dbuser, dbpass = getDBInfo()
	
	#cursor = setupDatabaseSchema(adminuser, adminpass, dbuser, dbpass)

	#processJPEG2000Images(images, cursor)
		
	# Add Index
	# CREATE INDEX image_index USING BTREE ON image (timestamp);

	#print "Finished!"



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

if __name__ == '__main__':
	main(sys.argv)
