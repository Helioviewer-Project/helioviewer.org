# -*- coding: utf-8 -*-
"""Helioviewer.org JPEG 2000 processing functions"""
import os
from datetime import datetime
from xml.dom.minidom import parseString
from shared.db import get_datasources, enable_datasource

__INSERTS_PER_QUERY__ = 500
__STEP_FXN_THROTTLE__ = 50

def find_images(path):
    '''Searches a directory for JPEG 2000 images.
    
    Traverses file-tree starting with the specified path and builds a list of
    the available images.
    '''
    images = []
    
    for root, dirs, files in os.walk(path):
        for file_ in files:
            if file_.endswith('.jp2'):
                images.append(os.path.join(root, file_))

    return images

def process_jp2_images (images, rootdir, cursor, mysql, step_function=None):
    '''Processes a collection of JPEG 2000 Images'''
    if mysql:
        import MySQLdb
    else:
        import pgdb
    
    # Error message
    error = ""

    # Return tree of known data-sources
    sources = get_datasources(cursor)
    
    valid_images = []
    
    # Parse image headers
    for img in images:
        print("Processing image: " + img)

        try:
            meta_info = parse_header(img)
            meta_info["filepath"] = img
        except Exception as e:
            directory, filename = os.path.split(img)
            error += "Unable to process header for %s (%s)\n" % (filename, e)
            print("Error processing %s" % filename)
        else:
            valid_images.append(meta_info)
    
    # Insert images into database, 500 at a time
    while len(valid_images) > 0:
        subset = valid_images[:__INSERTS_PER_QUERY__]
        valid_images = valid_images[__INSERTS_PER_QUERY__:]
        insert_images(subset, __INSERTS_PER_QUERY__, sources, rootdir, cursor, 
                      mysql, step_function)
        
    # Log any errors encountered
    if error:
        import time
        f = open('error.log', 'a')
        f.write(time.strftime("%a, %d %b %Y %H:%M:%S", time.localtime()) + "\n" + error)
    
def insert_images(images, sources, rootdir, cursor, mysql, step_function=None):
    """Inserts multiple images into a database using a single query
    
    Parameters
    ----------    
    images : list
        list of image dict representations
    sources : list
        tree of datasources supported by Helioviewer
    rootdir : string
        image archive root directory
    cursor : mixed 
        database cursor
    mysql : bool
        whether or not MySQL syntax should be used
    step_function : function
        function to call after each insert query
    """    
    query = "INSERT IGNORE INTO images VALUES "

    # Add images to SQL query
    for img in images:    
        directory, filename = os.path.split(img)

        path = "/" + os.path.relpath(directory, rootdir)
        
        # Data Source
        source = sources[img["observatory"]][img["instrument"]][img["detector"]][img["measurement"]]
        
        # Enable datasource if it has not already been
        if (not source['enabled']):
            sources[img["observatory"]][img["instrument"]][img["detector"]][img["measurement"]]["enabled"] = True
            enable_datasource(cursor, source['id'])

        # insert into database
        query += "(NULL, '%s', '%s', '%s', %d)," % (path, filename, img["date"], source['id'])
    
        # Progressbar
        if step_function and (y + 1) % __STEP_FXN_THROTTLE__ is 0:
            step_function(filename)
    
    # Remove trailing comma
    query = query[:-1] + ";"
        
    # Execute query
    cursor.execute(query)
