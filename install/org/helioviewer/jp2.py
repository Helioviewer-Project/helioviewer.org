# -*- coding: utf-8 -*-
"""Helioviewer.org JPEG 2000 processing functions"""
import os
from datetime import datetime
from xml.dom.minidom import parseString
from org.helioviewer.db import get_datasources, enable_datasource

__INSERTS_PER_QUERY__ = 500
__STEP_FXN_THROTTLE__ = 50

def traverse_directory(path):
    '''Searches a directory for JPEG2000 images.
    
    Traverses file-tree starting with the specified path and builds a list of
    the available images.
    '''
    images = []

    for child in os.listdir(path):
        node = os.path.join(path, child)
        if os.path.isdir(node):
            newImgs = traverse_directory(node)
            images.extend(newImgs)
        else:
            if node[-3:] == "jp2":
                images.append(node)

    return images

def extract_JP2_info(img):
    '''Gets required information from an image's header tags.
    
     Extracts useful meta-information from a given JP2 image and returns a
     dictionary of that information.
    '''

    # Get XMLBox as DOM
    try:
        dom = parseString(get_JP2_XMLBox(img, "meta"))
        fits = dom.getElementsByTagName("fits")[0]
    except Exception as e:
        print("Error retrieving JP2 XML Box.")
        raise e
        
    # Detect image type and fetch require meta information
    telescop = get_element_value(fits, "TELESCOP")
    detector = get_element_value(fits, "DETECTOR")
    instrume = get_element_value(fits, "INSTRUME")
    
    if instrume and instrume[0:3] == 'AIA':
        datatype = "aia"
    elif instrume and instrume[0:3] == 'HMI':
        datatype = "hmi"
    elif detector == 'EUVI':
        datatype = "euvi"
    elif detector and detector[0:3] == "COR":
        datatype = "cor"
    elif instrume == 'EIT':
        datatype = "eit"
    elif instrume == 'LASCO':
        datatype = "lasco"
    elif instrume == 'MDI':
        datatype = "mdi"
        
    try:
        info = _get_header_tags(fits, datatype)
    except Exception as e:
        print("Error parsing JP2 header")
        raise e 

    return info

def _get_header_tags(fits, type_):
    """Returns a normalized dictionary of header values
    
    A normalized mapping of important header values is created and returned.
    Not all of the header values are used, but instead only those that are
    required for the Map class to function are included. Note that some values
    may be cast to new types in the process.
    
    Parameters
    ----------
    fits : dict
        A dictionary container the header keywords from the file being read in
    type_ : str
        A short string describing the type of data being mapped
    
    Returns
    -------
    out : dict
        A new mapped dictionary of useful header values
    """
    date_fmt1 = "%Y-%m-%dT%H:%M:%S.%f"
    date_fmt2 = "%Y/%m/%dT%H:%M:%S.%f"
    date_fmt3 = "%Y-%m-%dT%H:%M:%S.%fZ"
    
    
    if type_ == "aia":
        # Note: Trailing "Z" in date was dropped on 2010/12/07 
        return {
            "date": datetime.strptime(
                get_element_value(fits, "DATE-OBS")[0:22], date_fmt1),
            "detector": "AIA",
            "instrument": "AIA",
            "measurement": get_element_value(fits, "WAVELNTH"),
            "observatory": "SDO"
        }
    elif type_ == "hmi":
        # Note: Trailing "Z" in date was dropped on 2010/12/07
        meas = get_element_value(fits, "CONTENT").split(" ")[0].lower()
        return {
            "date": datetime.strptime(
                get_element_value(fits, "DATE-OBS")[0:22], date_fmt1),
            "detector": "HMI",
            "instrument": "HMI",
            "measurement": meas,
            "observatory": "SDO"
        }
    elif type_ == "euvi":
        return {
            "date": datetime.strptime(
                get_element_value(fits, "DATE_OBS"), date_fmt1),
            "detector": "EUVI",
            "instrument": "SECCHI",
            "measurement": get_element_value(fits, "WAVELNTH"),
            "observatory": get_element_value(fits, "OBSRVTRY")
        }
    elif type_ == "cor":
        return {
            "date": datetime.strptime(
                get_element_value(fits, "DATE_OBS"), date_fmt1),
            "detector": get_element_value(fits, "DETECTOR"),
            "instrument": "SECCHI",
            "measurement": "white-light",
            "observatory": get_element_value(fits, "OBSRVTRY")
        }
    elif type_ == "eit":
        return {
            "date": datetime.strptime(
                get_element_value(fits, "DATE_OBS"), date_fmt3),
            "detector": "EIT",
            "instrument": "EIT",
            "measurement": get_element_value(fits, "WAVELNTH"),
            "observatory": "SOHO"
        }
    elif type_ == "lasco":
        datestr = "%sT%s" % (get_element_value(fits, "DATE_OBS"), get_element_value(fits, "TIME_OBS"))
        return {
            "date": datetime.strptime(datestr, date_fmt2),
            "detector": get_element_value(fits, "DETECTOR"),
            "instrument": "LASCO",
            "measurement": "white-light",
            "observatory": "SOHO"
        }
    elif type_ == "mdi":
        datestr = get_element_value(fits, "DATE_OBS")
            
        # MDI sometimes has an "60" in seconds field
        if datestr[17:19] == "60":
            datestr = datestr[:17] + "30" + datestr[19:]
        
        # Measurement
        dpcobsr = get_element_value(fits, "DPC_OBSR")
        meas = "magnetogram" if dpcobsr.find('Mag') != -1 else "continuum"
        
        return {
            "date": datetime.strptime(datestr, date_fmt3),
            "detector": "MDI",
            "instrument": "MDI",
            "measurement": meas,
            "observatory": "SOHO"
        }

def get_element_value(dom, name):
    '''Gets the value for the specified dom-node if it exists.
    
    Retrieves the value of a unique dom-node element or returns false if element
    is not found/ more than one.
    '''
    element = dom.getElementsByTagName(name)

    if element:
        return element[0].childNodes[0].nodeValue
    else:
        return None

def get_JP2_XMLBox(file, root):
    '''Extracts the XML box from a JPEG 2000 image.
    
    Given a filename and the name of the root node, extracts the XML header box
    from a JP2 image.
    '''
    fp = open(file, 'rb')

    xml = ""
    for line in fp:
         xml += line
         if line.find("</%s>" % root) != -1:
                 break
    xml = xml[xml.find("<%s>" % root):]
    
    fp.close()

    # 2010/04/12 TEMP Work-around for AIA invalid XML
    return xml.replace("&", "&amp;")

def process_jp2_images (images, rootdir, cursor, mysql, stepFxn=None):
    '''Processes a collection of JPEG2000 Images'''
    
    if mysql:
        import MySQLdb
    else:
        import pgdb

    remainder = len(images) % __INSERTS_PER_QUERY__

    # Return tree of known data-sources
    sources = get_datasources(cursor)
    
    # Insert images into database, 500 at a time
    if len(images) >= __INSERTS_PER_QUERY__:
        for x in range(len(images) // __INSERTS_PER_QUERY__):
            insert_n_images(images, __INSERTS_PER_QUERY__, sources,
                          rootdir, cursor, mysql, stepFxn)
            
    # Update tree of known data-sources
    sources = get_datasources(cursor)
            
    # Process remaining images
    insert_n_images(images, remainder, sources, rootdir, cursor, mysql, stepFxn)

    
def insert_n_images(images, n, sources, rootdir, cursor, mysql, stepFxn=None):
    """Inserts multiple images into a database using a single query"""
    query = "INSERT INTO images VALUES "
    
    error = ""
    
    for y in range(n):
        # Grab next image
        img = images.pop()
    
        print("Processing image: " + img)
        
        path, filename = os.path.split(img)
        
        # Remove static part of filepath
        if rootdir[-1] == "/":
            rootdir = rootdir[:-1]
        path = path[len(rootdir):]
        
        # Extract header meta information
        try:
            m = extract_JP2_info(img)
        except Exception as e:
            print("Error processing %s" % filename)
            error += filename + "\n"
        else:
            # Data Source
            source = sources[m["observatory"]][m["instrument"]][m["detector"]][m["measurement"]]
            
            # Enable datasource if it has not already been
            if (not source['enabled']):
                sources[m["observatory"]][m["instrument"]][m["detector"]][m["measurement"]]["enabled"] = True
                enable_datasource(cursor, source['id'])
        
            # Date
            date = m["date"]
    
            # insert into database
            query += "(NULL, '%s', '%s', '%s', %d)," % (path, filename, date, source['id'])
        
            # Progressbar
            if stepFxn and (y + 1) % __STEP_FXN_THROTTLE__ is 0:
                stepFxn(filename)
                
    # Log any errors encountered
    if error:
        import time
        f = open('error.log', 'a')
        f.write(time.strftime("%a, %d %b %Y %H:%M:%S", time.localtime()) + "\n" + error)
    
    # Remove trailing comma
    query = query[:-1] + ";"
        
    # Execute query
    try:
        cursor.execute(query)
    
    except Exception as e:
        print("Error: " + e.args[1])
    
