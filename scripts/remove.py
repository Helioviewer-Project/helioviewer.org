#!/usr/bin/env python
#-*- coding:utf-8 -*-

###############################################################################
# Helioviewer.org Image Removal Tool
# Last Updated: 2010/09/23
#
# This tool can be used to remove corrupted images from the archive. Note that
# only filenames should be specified, and not entire filepaths
#
# Usage:
#
#    python remove.py filename.jp2 [filename2.jp2 ...]
#    
###############################################################################
import sys
import os
import shutil
import MySQLdb

def main(argv):
    rootdir = "/var/www/jp2/LATEST"
    moveto  = "/var/www/jp2/Corrupted"
    dbname  = "dbname"
    dbuser  = "dbuser"
    dbpass  = "dbpass"
    
    if len(argv) < 2:
        print "Incorrect number of arguments. Please specify the names of the files you wish to remove."
        sys.exit()
        
    for filename in argv[1:]:
        filepath = removeFromDatabase(rootdir, filename, dbname, dbuser, dbpass)
        removeFromArchive(filepath, moveto)    
    
    print "Done!"
    
def removeFromDatabase(rootdir, filename, dbname, dbuser, dbpass):
    print "Removing %s from the database" % filename
    
    try:
        db = MySQLdb.connect(host="localhost", db=dbname, user=dbuser, passwd=dbpass)
        cursor = db.cursor()
    except Exception, e:
        print e
        sys.exit()
    
    # First get the filepath    
    sql = "SELECT CONCAT('%s', filepath, '/', filename) FROM images WHERE filename = '%s'" % (rootdir, filename)
    
    if cursor.execute(sql):
        filepath = cursor.fetchone()[0]
    else:
        print "File not found in database. Stopping execution."
        sys.exit()
    
    # Then remove from the database
    sql = "DELETE FROM images WHERE filename = '%s'" % filename
    cursor.execute(sql)
    
    return filepath

def removeFromArchive(filepath, moveto):
    print "Moving %s to %s" % (filepath.split("/").pop(), moveto)
    
    if not os.path.isdir(moveto):
        os.mkdir(moveto, 0755)
        
    shutil.move(filepath, moveto)
   
if __name__ == '__main__':
    main(sys.argv)
