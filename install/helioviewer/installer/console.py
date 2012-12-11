# -*- coding: utf-8 -*-
"""A text-based installer for Helioviewer.org"""
import sys
import os
import getpass
import sunpy
from helioviewer.jp2 import *
from helioviewer.db  import *

class HelioviewerConsoleInstaller:
    """Text-based installer class"""
    def __init__(self):
        self.print_greeting()
        
        path = self.get_filepath()
        
        # Locate jp2 images in specified filepath
        filepaths = find_images(path)

        # Extract image parameters
        images = []
        
        for filepath in filepaths:
            try:
                image = sunpy.read_header(filepath)
                if (image["measurement"] == '' and image["instrument"] == 'XRT'):
                    image["measurement"] = image['header']['EC_FW1_']+'/'+image['header']['EC_FW2_']
                image['filepath'] = filepath
                images.append(image)
            except:
                raise BadImage("HEADER")
        
        # Check to make sure the filepath contains jp2 images
        if len(images) is 0:
            print("No JPEG 2000 images found. Exiting installation.")
            sys.exit(2)
        else:
            print("Found %d JPEG 2000 images." % len(images))
    
        # Setup database schema if needed
        cursor, mysql = self.get_db_cursor()
    
        print("Processing Images...")
    
        # Insert image information into database
        process_jp2_images(images, path, cursor, mysql)
        cursor.close()
        
        print("Finished!")
        
    def get_db_cursor(self):
        """Returns a database cursor"""
        if (self.should_setup_db()):
            return self.create_db()        
        else:
            return self.get_existing_db_info()
        
    def get_existing_db_info(self):
        """Gets information about existing database from user and returns
        a cursor to that database."""
        print("Please enter Helioviewer.org database name")
        dbname = self.get_database_name()
        
        print("Please enter Helioviewer.org database user information")
        dbuser, dbpass, mysql = self.get_database_info()
        
        cursor = get_db_cursor(dbname, dbuser, dbpass, mysql)
        
        return cursor, mysql
        
    def create_db(self):
        """Sets up the database tables needed for Helioviewer"""
        print("Please enter new database information:")
        dbname = self.get_database_name()
        hvuser, hvpass = self.get_new_user_info()
        
        # Get database information
        print("\nPlease enter existing database admin information:")
        dbuser, dbpass, mysql = self.get_database_info()

        # Setup database schema
        try:
            cursor = setup_database_schema(dbuser, dbpass, dbname, hvuser, 
                                           hvpass, mysql)
            return cursor, mysql
        except:
            print("Specified database already exists! Exiting installer.")
            sys.exit()

    def get_filepath(self):
        '''Prompts the user for the directory information'''
    
        path = get_input("Location of JP2 Images: ")
        while not os.path.isdir(path):
            print("That is not a valid directory! Please try again.")
            path = get_input("Location of JP2 Images: ")
    
        return path
    
    def get_database_type(self):
        ''' Prompts the user for the database type '''
        dbtypes = {1: "mysql", 2: "postgres"}
        
        while True:
            print("Please select the desired database to use for installation:")
            print("\t[1] MySQL")
            print("\t[2] PostgreSQL")
            choice = get_input("Choice: ")
            
            if choice not in ['1', '2']:
                print("Sorry, that is not a valid choice.")
            else:
                return dbtypes[int(choice)]
            
    def get_database_name(self):
        ''' Prompts the user for the database name '''

        dbname = get_input("\tDatabase name [helioviewer]: ")
   
        # Default values
        if not dbname: dbname = "helioviewer"
    
        return dbname
                
    def should_setup_db(self):
        ''' Prompts the user for the database type '''
        options = {1: True, 2: False}
        
        while True:
            print("Would you like to create the database schema used by "
                  "Helioviewer.org?:")
            print("\t[1] Yes")
            print("\t[2] No")
            choice = get_input("Choice: ")
            
            if choice not in ['1', '2']:
                print("Sorry, that is not a valid choice.")
            else:
                return options[int(choice)]
    
    def get_database_info(self):
        ''' Gets database type and administrator login information '''
        import getpass
        
        while True:  
            dbtype = self.get_database_type()
            dbuser = get_input("\tUsername: ")        
            dbpass = getpass.getpass("\tPassword: ")
        
            # Default values
            if not dbuser:
                dbuser = "root"

            # MySQL?
            mysql = dbtype is "mysql"
            
            if not check_db_info(dbuser, dbpass, mysql):
                print("Unable to connect to the database. Please check your "
                      "login information and try again.")
            else:
                return dbuser,dbpass,mysql        

    def get_new_user_info(self):
        ''' Prompts the user for the required database information '''

        # Get new user information (Todo 2009/08/24: validate input form)
        dbuser = get_input("\tUsername [helioviewer]: ")
        dbpass = get_input("\tPassword [helioviewer]: ")
    
        # Default values
        if not dbuser:
            dbuser = "helioviewer"
        if not dbpass:
            dbpass = "helioviewer"
    
        return dbuser, dbpass

    def print_greeting(self):
        ''' Prints a greeting to the user'''
        os.system("clear")
        
        print("""\
====================================================================
= Helioviewer Database Population Script                           =
= Last updated: 2010/10/07                                         =
=                                                                  =
= This script processes JP2 images, extracts their associated      =
= meta-information and stores it away in a database.               =
=                                                                  =
====================================================================""")

# Python 3 compatibility work-around
if sys.version_info[0] >= 3:
    get_input = input
else:
    get_input = raw_input
