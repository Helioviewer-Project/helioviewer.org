# -*- coding: utf-8 -*-
import sys, os
from org.helioviewer.jp2 import *
from org.helioviewer.db  import *
from org.helioviewer.utils import *

class HelioviewerConsoleInstaller():

    def __init__(self, options):
        self.options = options
        
    def getFilePath(self):
        ''' Prompts the user for the directory information '''
    
        path = raw_input("Location of JP2 Images: ")
        while not os.path.isdir(path):
            print "That is not a valid directory! Please try again."
            path = raw_input("Location of JP2 Images: ")
    
        return path
    
    def getDatabaseType(self):
        ''' Prompts the user for the database type '''
        dbtypes = {1: "mysql", 2: "postgres"}
        
        while True:
            print "Please select the desired database to use for installation:"
            print "   [1] MySQL"
            print "   [2] PostgreSQL"
            choice = int(raw_input("Choice: "))
            
            if choice not in [1,2]:
                print "Sorry, that is not a valid choice."
            else:
                return dbtypes[choice]
    
    def getDatabaseInfo(self):
        ''' Gets database type and administrator login information '''
        import getpass
        
        while True:  
            dbtype    = self.getDatabaseType()
            admin     = raw_input("Database admin: ")        
            adminpass = getpass.getpass("Password: ")
        
            # Default values
            if not admin: admin = "root"

            # MySQL?
            mysql = True if dbtype is "mysql" else False
            
            if not checkDBInfo(admin, adminpass, mysql):
                print "Unable to connect to the database. Please check your login information and try again."
            else:
                return admin,adminpass,mysql        

    def getNewUserInfo(self):
        ''' Prompts the user for the required database information '''

        # Get new user information (Todo 2009/08/24: validate input form)
        dbuser = raw_input("New database username [Helioviewer]: ")
        dbpass = raw_input("New password [Helioviewer]: ")
    
        # Default values
        if not dbuser: dbuser = "helioviewer"
        if not dbpass: dbpass = "helioviewer"
    
        return dbuser, dbpass

    def printGreeting(self):
        ''' Prints a greeting to the user'''
        os.system("clear")
        
        print """\
====================================================================
= Helioviewer Database Population Script                           =
= Last updated: 2009/08/24                                         =
=                                                                  =
= This script processes JP2 images, extracts their associated      =
= meta-information and stores it away in a database. Currently,    =
= it is assumed that the database strucuture has already been      =
= created (See createTables.sql). Please make sure the images      =
= are placed in their permanent home (within the server) before    =
= running the installation script.                                 =
=                                                                  =
= The script requires several pieces of information to function:   =
=   (1) The location of a directory containing JP2 images.         =
=   (2) The name of the database schema to populate.               =
=   (3) The name of the database user with appropriate access.     =
=   (4) The password for the specified database user.              =
===================================================================="""

def loadTextInstaller(options):
    ''' Loads the text-based installation tool '''
    app = HelioviewerConsoleInstaller(options)
    app.printGreeting()
    
    # Filepath
    path = app.getFilePath()
    
    # Locate jp2 images in specified filepath
    images = traverseDirectory(path)
    
    # Check to make sure the filepath contains jp2 images
    if len(images) is 0:
        print "No JPEG 2000 images found. Exiting installation."
        sys.exit(2)
    else:
        print "Found %d JPEG2000 images." % len(images)

    # Get database information
    admin, adminpass, mysql = app.getDatabaseInfo()
    mysql = True
    hvuser, hvpass = app.getNewUserInfo()
    
    # Setup database schema
    cursor = setupDatabaseSchema(admin, adminpass, hvuser, hvpass, mysql)

    print "Processing Images..."

    # Insert image information into database
    processJPEG2000Images(images, path, cursor, mysql)

    print "Finished!"
    
# Add Index
# CREATE INDEX image_index USING BTREE ON image (timestamp);

#print "Finished!"