#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Helioviewer Image Ingestion Tool
Last Updated: 2012/03/08

This script scans a specified directory for new JPEG 2000 images to be added
to the Helioviewer.org archive. Any new images encountered are first moved
to the archive and then added to the database.

To periodically scan a directory for new images, you can simply create a cronjob
to run update.py.

Example usage:

    update.py -d hvdb -u hvuser -p hvpass -i /home/user/incoming -o /var/www/jp2

"""
import sys
import os
from helioviewer.jp2 import find_images, process_jp2_images
from helioviewer.db  import get_db_cursor
from optparse import OptionParser, IndentedHelpFormatter

def main(argv):
    '''Main application access point'''
    options = get_options()
    
    print("Processing Images...")
    
    # Get a list of images to process
    images = find_images(options.source)
    
    if len(images) is 0:
        return

    filepaths = []

    # Move images to main archive
    for image in images:
        dest = os.path.join(options.destination, 
                            os.path.relpath(image, options.source))
        filepaths.append(dest)

        directory = os.path.dirname(dest)
        
        if not os.path.isdir(directory):
            os.makedirs(directory)

        shutil.move(image, dest)
    
    # Add images to the database
    cursor = get_db_cursor(options.dbname, options.dbuser, options.dbpass)
    process_jp2_images(filepaths, options.destination, cursor, True)    
    cursor.close()
    
    print("Finished!")
        
def get_options():
    ''' Gets command-line parameters'''
    parser = OptionParser("%prog [options]", 
                          formatter=IndentedHelpFormatter(4,100))
    parser.add_option("-d", "--database-name", dest="dbname",
                      help="Database to insert images into")
    parser.add_option("-u", "--database-user", dest="dbuser",
                      help="Helioviewer.org database user")
    parser.add_option("-p", "--database-pass", dest="dbpass",
                      help="Helioviewer.org database password")
    parser.add_option("-i", "--input-dir", dest="source",
                      help="Directory containing files to process")
    parser.add_option("-o", "--output-dir", dest="destination",
                      help="Directory to move files to")
    
    try:                                
        options, args = parser.parse_args()
                    
    except:
        sys.exit(2)

    return options

if __name__ == '__main__':
    main(sys.argv)
