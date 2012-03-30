#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Helioviewer.org Image Removal Tool

Last Updated: 2012/03/28

This tool can be used to remove corrupted images from the archive. Note that
only filenames should be specified, and not entire filepaths

Usage:
    python remove.py filename.jp2 [filename2.jp2 ...]

"""
import sys
import os
import shutil
import database

def main(argv):
    rootdir = "/var/www/jp2"
    moveto  = "/var/www/jp2/Corrupted"
    
    # Make sure at least one file was specified
    if len(argv) < 2:
        print "Incorrect number of arguments. Please specify the names of the files you wish to remove."
        sys.exit()
        
    # Connect to database
    cursor = database.get_dbcursor()
        
    for filename in argv[1:]:
        filepath = remove_from_db(cursor, rootdir, filename)
        remove_from_archive(filepath, moveto)    
    
    print "Done!"
    
def remove_from_db(cursor, rootdir, filename):
    print "Removing %s from the database" % filename

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

def remove_from_archive(filepath, moveto):
    print "Moving %s to %s" % (filepath.split("/").pop(), moveto)
    
    if not os.path.isdir(moveto):
        os.mkdir(moveto, 0755)
        
    shutil.move(filepath, moveto)
   
if __name__ == '__main__':
    main(sys.argv)
