#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Remove YouTube entries from database associated with missing (e.g. duplicate
or removed) ids.
"""
import sys
import datetime
import getpass
import MySQLdb
import gdata.youtube
import gdata.youtube.service

def main():
    """Main"""
    # Connect to database
    cursor = get_dbcursor()
    
    # Decide how many days back to scan
    num_days = int(raw_input("How many days back would you like to scan? [7]") or 7)
    start_date = datetime.datetime.utcnow() - datetime.timedelta(num_days)
    
    # Get list of Youtube ids to check
    ids = get_youtubeids(cursor, start_date)
    
    print("Scanning %d matched video entries..." % len(ids));
       
    # Find videos that no longer exist on YouTube
    to_remove = find_missing_videos(cursor, ids)
    
    # Stop if no matches found
    if len(to_remove) is 0:
        print("No missing videos found. Exiting script.")
        sys.exit()
            
    # Confirm with user before removing
    print("Videos to be removed: ")
    for x in to_remove:
        print x
    print("Total: %d" % len(to_remove))
    
    choice = raw_input("Are you sure you want to remove these videos from the database? ")
    while choice.lower() not in ["yes", "y", "no", "n"]:
        choice = raw_input("Please enter yes or no ")
        
    if choice in ["n", "no"]:
        sys.exit("Exiting without making any changes.")
        
    # Once confirmed, remove all videos found to be missing
    # Default param style (MySQLdb.paramstyle) is 'format' so %s is used 
    sql = "DELETE FROM youtube WHERE youtubeId IN (%s)" % ','.join(['%s'] * len(to_remove))
    cursor.execute(sql, to_remove)
        
    print("===========")
    print(" Summary")
    print("===========")
    print("Number of movies removed: %d / %d" % (len(to_remove), len(ids)))
    
def get_youtubeids(cursor, start_date):
    """Get a list of Youtube ids starting from the specified date"""
    sql = "SELECT youtubeId FROM youtube WHERE timestamp >= '%s'" % start_date
    cursor.execute(sql)
    result = cursor.fetchall()
    
    return [row[0] for row in result]

def find_missing_videos(cursor, ids):
    """Checks the list of YouTube ids for missing videos"""
    # Connect to YouTube
    yt_service = gdata.youtube.service.YouTubeService()
    yt_service.ssl = True

    missing = []    
    for video_id in ids:
        try:
            entry = yt_service.GetYouTubeVideoEntry(video_id=video_id)
        except gdata.service.RequestError:
            missing.append(video_id)
            
    return missing
    
def get_dbcursor():
    """Prompts the user for database info and returns a database cursor"""
    print("Please enter existing database login information:")
    dbname, dbuser, dbpass = get_dbinfo()

    db = MySQLdb.connect(host="localhost", db=dbname, user=dbuser, 
                         passwd=dbpass)

    db.autocommit(True)
    return db.cursor()
    
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

if __name__ == '__main__':
    sys.exit(main())
