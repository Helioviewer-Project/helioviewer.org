#!/usr/bin/env python
#-*- coding:utf-8 -*-

###############################################################################
# Helioviewer.org Image Removal Tool
# Last Updated: 2009/04/21
#
# This tool can be used to remove a corrupted image from the archive.
#
# Usage:
#
#    python remove.py filename.jp2
#    
###############################################################################
import sys, os, shutil, MySQLdb

def main(argv):
    rootdir = "/var/www/jp2/LATEST"
    moveto  = "/var/www/jp2/Corrupted"
    dbname  = "dbname"
    dbuser  = "dbuser"
    dbpass  = "dbpass"
    
    if len(argv) is not 2:
        print "Incorrect number of arguments. Please specify the name of the file you wish to remove."
        sys.exit()
        
    filename = argv[1]
    
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
    sql = "SELECT CONCAT('%s', filepath, '/', filename) FROM image WHERE filename = '%s'" % (rootdir, filename)
    
    if cursor.execute(sql):
        filepath = cursor.fetchone()[0]
    else:
        print "File not found in database. Stopping execution."
        sys.exit()
    
    # Then remove from the database
    sql = "DELETE FROM image WHERE filename = '%s'" % filename
    cursor.execute(sql)
    
    return filepath

def removeFromArchive(filepath, moveto):
    print "Moving %s to %s" % (filepath.split("/").pop(), moveto)
    
    if not os.path.isdir(moveto):
        os.mkdir(moveto, 0755)
        
    shutil.move(filepath, moveto)
   
if __name__ == '__main__':
    main(sys.argv)