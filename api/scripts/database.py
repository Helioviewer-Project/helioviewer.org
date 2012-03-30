"""Shared database functions"""
import getpass
import MySQLdb

def get_dbinfo():
    """Gets database type and administrator login information"""
    while True:
        dbname = raw_input("    Database [helioviewer]: ") or "helioviewer"
        dbuser = raw_input("    Username [helioviewer]: ") or "helioviewer"
        dbpass = getpass.getpass("    Password: ")

        if not check_db_info(dbname, dbuser, dbpass):
            print("Unable to connect to the database. Please check your "
                  "login information and try again.")
        else:
            return dbname, dbuser,dbpass

def check_db_info(dbname, dbuser, dbpass):
    """Validate database login information"""
    try:
        db = MySQLdb.connect(db=dbname, user=dbuser, passwd=dbpass)
    except MySQLdb.Error as e:
        print(e)
        return False

    db.close()
    return True

def get_dbcursor():
    """Prompts the user for database info and returns a database cursor"""
    print("Please enter existing database login information:")
    dbname, dbuser, dbpass = get_dbinfo()

    db = MySQLdb.connect(host="localhost", db=dbname, user=dbuser, 
                         passwd=dbpass)

    db.autocommit(True)
    return db.cursor()