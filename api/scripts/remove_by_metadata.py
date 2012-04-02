#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""Quarantines images whose metadata match some specified criteria"""
import sys
import os
import re
import operator
import shutil
import remove
import database
from itertools import islice

def main():
    # Connect to database
    cursor = database.get_dbcursor()
    
    # Get search path
    input_ = raw_input("Enter a directory or path to a list of files to check: ")
    corrupt_dir = "/var/www/jp2/Corrupted"
    
    # Get search criterion (e.g. CDELT < 0.01 or IMG_TYPE = DARK)
    filter_key = raw_input("Header key: ")
    filter_op = raw_input("Operator [=, <, <=, >, or >=]: ")
    
    while filter_op not in ["=", "<", ">", "<=", ">="]:
        print ("Invalid operator specified. Please try again.")
        filter_op = raw_input("Operator [=, <, <=, >, or >=]: ")

    filter_val = raw_input("Value: ")

    # Get a list of files to search
    if os.path.isdir(input_):
        images = find_images(input_)
    else:
        images = [i for i in open(input_)]
    
    print("Scanning %d images..." % len(images))
    
    # Filter image list based on criterion
    quarantine = filter_images(images, filter_key, filter_op, filter_val)
    
    if len(quarantine) is 0:
        print("No matches found!")
    
    # Remove quarantined images
    print ("Found %d images matching the criterion. " % len(quarantine))
    
    choice = raw_input("Are you sure you want to remove them? [y/n] ")
    
    while choice not in ["y", "n"]:
        print ("Invalid choice. Please choice y or n")
        choice = raw_input("\nAre you sure you want to remove them? [y/n] ")
    
    for file_ in quarantine:
        filepath = remove.remove_from_db(cursor, root_dir, os.path.basename(file_))
        remove.remove_from_archive(filepath, corrupt_dir)
    
    print("Finished!")
        
def filter_images(images, filter_key, filter_op, filter_val):
    """Filters a set of images and returns only those that match the specified
    criteria."""
    # Cast numeric values to floats
    try:
        filter_val = float(filter_val)
    except ValueError, TypeError:
        pass
    
    # Filter regex
    pattern = re.compile("[^>]*>([^<]*)")
    
    # Get operator
    operators = {
        "=": operator.eq,
        "<": operator.lt,
        "<=": operator.le,
        ">": operator.gt,
        ">=": operator.ge
    }
    op_function = operators[filter_op]
    
    # Log matched files
    fp = open("remove_by_metadata.log", "w")

    # Find corrupt images
    filtered = []
    
    for x in images:
        with open(x) as image:
            header = list(islice(image, 200))
            
            # Scan lines 1-200 in header
            for line in header:
                # If the key is found
                if line.find(filter_key) != -1:
                    # Get the value associated with that key
                    value = pattern.search(line).group(1)
                    
                    # Cast numeric values to floats
                    if isinstance(filter_val, float):
                        try:
                            value = float(filter_val)
                        except ValueError, TypeError:
                            pass
                    
                    # Evaluate
                    if op_function(value, filter_val):
                        fp.write(os.path.basename(x) + "\n")
                        filtered.append(x)
    fp.close()
    
    return filtered

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
   
if __name__ == '__main__':
    sys.exit(main())
