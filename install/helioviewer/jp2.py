# -*- coding: utf-8 -*-
"""Helioviewer.org JPEG 2000 processing functions"""
import os
import logging
from helioviewer.db import get_datasources, enable_datasource

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

def process_jp2_images (images, root_dir, cursor, mysql=True, step_fxn=None):
    '''Processes a collection of JPEG 2000 Images'''
    if mysql:
        import MySQLdb
    else:
        import pgdb

    # Return tree of known data-sources
    sources = get_datasources(cursor)

    # Insert images into database, 500 at a time
    while len(images) > 0:
        subset = images[:__INSERTS_PER_QUERY__]
        images = images[__INSERTS_PER_QUERY__:]
        insert_images(subset, sources, root_dir, cursor, mysql, step_fxn)
    
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
    for i, img in enumerate(images):    
        directory, filename = os.path.split(img['filepath'])

        path = "/" + os.path.relpath(directory, rootdir)
        
        # Cast measurement to string
        img["measurement"] = str(img["measurement"])
        
        # Data Source
        source = sources[img["observatory"]][img["instrument"]][img["detector"]][img["measurement"]]
        
        # Enable datasource if it has not already been
        if (not source['enabled']):
            sources[img["observatory"]][img["instrument"]][img["detector"]][img["measurement"]]["enabled"] = True
            enable_datasource(cursor, source['id'])

        # insert into database
        query += "(NULL, '%s', '%s', '%s', %d)," % (path, filename, img["date"], source['id'])
    
        # Progressbar
        if step_function and (i + 1) % __STEP_FXN_THROTTLE__ is 0:
            step_function(filename)
    
    # Remove trailing comma
    query = query[:-1] + ";"
        
    # Execute query
    cursor.execute(query)
    
class BadImage(ValueError):
    """Exception to raise when a "bad" image (e.g. corrupt or calibration) is
    encountered."""
    def __init__(self, message=""):
        self.message = message
    def get_message(self):
        return self.message
