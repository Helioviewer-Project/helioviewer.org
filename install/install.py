#!/usr/bin/python
# -*- coding: utf-8 -*-
import sys
from PyQt4 import QtCore, QtGui
from org.helioviewer.InstallDialog import Ui_InstallDialog
from org.helioviewer.jp2 import *
from org.helioviewer.db  import *
from org.helioviewer.utils import *

#
# Main Application Window
#
class HelioviewerInstallDialog(QtGui.QDialog):
    def __init__(self, parent=None):
        QtGui.QWidget.__init__(self, parent)
        self.ui = Ui_InstallDialog()
        self.ui.setupUi(self)
        self.initEvents()
        
    def initEvents(self):
    	QtCore.QObject.connect(self.ui.jp2BrowseBtn, QtCore.SIGNAL("clicked()"), self.openBrowseDialog)
    	QtCore.QObject.connect(self.ui.startBtn, QtCore.SIGNAL("clicked()"), self.validateFields)
    	
    	#QtCore.QObject.connect(self.ui.jp2RootDirInput, QtCore.SIGNAL("textChanged()"), self.checkJP2Dir) Not working?
    	#QtCore.QObject.connect(self.ui.jp2RootDirInput, QtCore.SIGNAL("textEdited()"), self.openBrowseDialog)
							   
    def openBrowseDialog(self):
    	fd = QtGui.QFileDialog(self)
    	directory = fd.getExistingDirectory()
    	self.ui.jp2RootDirInput.setText(directory)

    def validateFields(self):
    	print "Test"

    def checkJP2Dir(self):
    	print "Directory changed...(check to see if any jp2s found)"

def main(args):
    app = QtGui.QApplication(sys.argv)
    win = HelioviewerInstallDialog()
    win.show()
    sys.exit(app.exec_())

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
