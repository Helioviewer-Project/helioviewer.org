# -*- coding: utf-8 -*-
import sys, os
from org.helioviewer.jp2 import *
from org.helioviewer.db  import *
from org.helioviewer.utils import *

class HelioviewerConsoleInstaller:

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
            
    def getDatabasename(self):
        ''' Prompts the user for the database name '''

        dbname = raw_input("    Database name [helioviewer]: ")
   
        # Default values
        if not dbname: dbname = "helioviewer"
    
        return dbname
                
    def shouldSetupSchema(self):
        ''' Prompts the user for the database type '''
        options = {1: True, 2: False}
        
        while True:
            print "Would you like to create the database schema used by Helioviewer.org?:"
            print "   [1] Yes"
            print "   [2] No"
            choice = int(raw_input("Choice: "))
            
            if choice not in [1,2]:
                print "Sorry, that is not a valid choice."
            else:
                return options[choice]
    
    def getDatabaseInfo(self):
        ''' Gets database type and administrator login information '''
        import getpass
        
        while True:  
            dbtype    = self.getDatabaseType()
            dbuser     = raw_input("    Username: ")        
            dbpass = getpass.getpass("    Password: ")
        
            # Default values
            if not dbuser: dbuser = "root"

            # MySQL?
            # mysql = True if dbtype is "mysql" else False
            if dbtype is "mysql":
                mysql = True
            else:
                mysql = False
            
            if not checkDBInfo(dbuser, dbpass, mysql):
                print "Unable to connect to the database. Please check your login information and try again."
            else:
                return dbuser,dbpass,mysql        

    def getNewUserInfo(self):
        ''' Prompts the user for the required database information '''

        # Get new user information (Todo 2009/08/24: validate input form)
        dbuser = raw_input("    Username [helioviewer]: ")
        dbpass = raw_input("    Password [helioviewer]: ")
    
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
= Last updated: 2010/10/07                                         =
=                                                                  =
= This script processes JP2 images, extracts their associated      =
= meta-information and stores it away in a database.               =
=                                                                  =
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

    # Setup database schema if needed
    if (app.shouldSetupSchema()):
        print "Please enter new database information:"
        dbname = app.getDatabasename()
        hvuser, hvpass = app.getNewUserInfo()
        
        print ""
        
        # Get database information
        print "Please enter existing database admin information:"
        dbuser, dbpass, mysql = app.getDatabaseInfo()

        # Setup database schema
        cursor = setupDatabaseSchema(dbuser, dbpass, dbname, hvuser, hvpass, mysql)
    
    else:
        # Get database information
        print "Please enter Helioviewer.org database name"
        dbname = app.getDatabasename()
        
        print "Please enter Helioviewer.org database user information"
        dbuser, dbpass, mysql = app.getDatabaseInfo()
        
        cursor = getDatabaseCursor(dbname, dbuser, dbpass, mysql)

    print "Processing Images..."

    # Insert image information into database
    processJPEG2000Images(images, path, cursor, mysql)
    
    #print("Creating database index")        
    #createDateIndex(cursor)
    
    cursor.close()

    print "Finished!"
    
def loadUpdater(options):
    ''' Loads the text-based installation tool and runs it in update-mode '''
    app = HelioviewerConsoleInstaller(options)
    
    # MySQL?
    if options.dbtype == "mysql":
        mysql = True
    else:
        mysql = False
        
    cursor = getDatabaseCursor(options.dbname, options.dbuser, options.dbpass, mysql)

    print "Processing Images..."

    # Insert image information into database
    processJPEG2000Images(options.files, options.basedir, cursor, mysql)
    
    cursor.close()

    print "Finished!"
    
# Add Index
# CREATE INDEX date_index USING BTREE ON image (date);

#print "Finished!"