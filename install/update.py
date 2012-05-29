#!/usr/bin/env python
#-*- coding:utf-8 -*-
'''
Helioviewer Image Ingestion Tool
Last Updated: 2012/03/08

This script scans a specified directory for new JPEG 2000 images to be added
to the Helioviewer.org archive. Any new images encountered are first moved
to the archive and then added to the database.

To periodically scan a directory for new images, you can simply create a cronjob
to run update.py.
'''
import sys
import os
import shutil
import sunpy
from helioviewer.jp2 import find_images, process_jp2_images
from helioviewer.db  import get_db_cursor
from helioviewer import init_logger
from optparse import OptionParser, IndentedHelpFormatter

def main(argv):
    '''Main application access point'''
    options = get_options()
    
    init_logger('update.log')
    
    print('Processing Images...')
    
    # Get a list of images to process
    filepaths = find_images(options.source)
    
    if len(filepaths) is 0:
        return

    images = []

    # Move images to main archive
    for filepath in filepaths:
        dest = os.path.join(options.destination, 
                            os.path.relpath(filepath, options.source))
        
        # Parse image header
        image_params = sunpy.read_header(filepath)
        image_params['filepath'] = dest
        
        images.append(image_params)

        directory = os.path.dirname(dest)
        
        if not os.path.isdir(directory):
            os.makedirs(directory)

        shutil.move(filepath, dest)
    
    # Add images to the database
    cursor = get_db_cursor(options.dbname, options.dbuser, options.dbpass)
    process_jp2_images(images, options.destination, cursor, True)    
    cursor.close()
    
    print('Finished!')
        
def get_options():
    '''Gets command-line parameters'''
    parser = OptionParser('%prog [options]', 
                          formatter=IndentedHelpFormatter(4,100))
    
    params = [
        ('-d', '--database-name', 'dbname', 'Database to insert images into'),
        ('-u', '--database-user', 'dbuser', 'Helioviewer.org database user'),
        ('-p', '--database-pass', 'dbpass', 'Helioviewer.org database password'),
        ('-i', '--input-dir', 'source', 'Directory containing files to process'),
        ('-o', '--output-dir', 'destination', 'Directory to move files to')
    ]
    
    for param in params:
        parser.add_option(param[0], param[1], dest=param[2], help=param[3])

    try:
        options, args = parser.parse_args()

        for param in params:
            if getattr(options, param[2]) is None:
                raise Exception("ERROR: missing required parameter %s.\n" % param[2])
    except Exception, e:
        print_help(parser)
        print e
        sys.exit(2)
            
    return options

def print_help(parser):
    '''Prints program usage description'''
    print ""
    parser.print_help()
    print "\nRequired: \n"
    print "\tdbname, dbuser, dbpass, input-dir and output-dir must all be specified.\n"
    print "Example: \n"
    print "\tupdate.py -d dbname -u user -p pass -i /home/user/incoming -o /var/www/jp2\n"

if __name__ == '__main__':
    main(sys.argv)
