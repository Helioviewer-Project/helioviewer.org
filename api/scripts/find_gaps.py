#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Find gaps in Helioviewer data archive.

Works by creating a temporary table with the images sorted by date, and then
finding all instances where the difference in timestamps from one image to the
next is greater than some specified amount. This is primarily useful for finding
gaps in SDO data for which a complete list of the expected files is not easily
computable. For cases like SOHO and STEREO a simpler approach is to get a
complete list of all files available and compare it to what is found in the db.

keith.hughitt@nasa.gov
Oct 26, 2011
"""
import sys
import getpass
import csv
import MySQLdb

def main():
    """Main"""
    cursor = get_dbcursor()
    datasources = get_datasources(cursor)
    
    for source in datasources:
        sourceid = source[0]
        inst = source[3]
        meas = source[5]

        print "Processing %s %s" % (inst, meas)

        create_temp_table(cursor, sourceid)
        gaps = query_temp_table(cursor)
        
        output_file = "%s_%s.csv" % (inst, meas)
        c = csv.writer(open(output_file,"wb"))
        c.writerow(("start", "end", "elapsed (s)"))
        c.writerows(gaps)
        
        delete_temp_table(cursor)
        
def create_temp_table(cursor, sourceid):
    """Creates a temporary table used to find gaps"""
    cursor.execute(
    """CREATE TABLE t (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY)
        SELECT date 
        FROM images 
        WHERE sourceId=%d AND date > '2011-02-01 00:00:00' 
        ORDER BY date;""" % sourceid)
        
def query_temp_table(cursor, gap_size=60):
    """Queries the temporary table for gaps"""
    sql = \
    """SELECT a.date as start,
              b.date as end, 
             (UNIX_TIMESTAMP(b.date) - UNIX_TIMESTAMP(a.date)) AS gap
       FROM t AS a
       JOIN t AS b  ON b.id = a.id + 1
       HAVING gap >= %d;""" % gap_size
       
    cursor.execute(sql)
    return cursor.fetchall()
    
def delete_temp_table(cursor):
    """Removes the temporary table"""
    cursor.execute("DROP TABLE t")
    
def get_datasources(cursor, obs="SDO"):
    """Retrieves a list of the known datasources"""
    sql = \
    """ SELECT
            datasources.id as id,
            datasources.enabled as enabled,
            observatories.name as observatory,
            instruments.name as instrument,
            detectors.name as detector,
            measurements.name as measurement
        FROM datasources
            LEFT JOIN observatories
            ON datasources.observatoryId=observatories.id 
            LEFT JOIN instruments
            ON datasources.instrumentId=instruments.id 
            LEFT JOIN detectors
            ON datasources.detectorId=detectors.id 
            LEFT JOIN measurements
            ON datasources.measurementId=measurements.id
        WHERE observatories.name='%s';""" % obs

    cursor.execute(sql)
    return cursor.fetchall()
            
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

