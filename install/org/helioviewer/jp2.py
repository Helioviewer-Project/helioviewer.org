# -*- coding: utf-8 -*-
import os
from datetime import datetime
from xml.dom.minidom import parseString
from org.helioviewer.db import getDataSources, enableDataSource

__INSERTS_PER_QUERY__ = 500
__STEP_FXN_THROTTLE__ = 50

def traverseDirectory (path):
    ''' Traverses file-tree starting with the specified path and builds a
        list of the available images '''
    images = []

    for child in os.listdir(path):
        node = os.path.join(path, child)
        if os.path.isdir(node):
            newImgs = traverseDirectory(node)
            images.extend(newImgs)
        else:
            if node[-3:] == "jp2":
                images.append(node)

    return images

def extractJP2MetaInfo (img):
    ''' Extracts useful meta-information from a given JP2 image and
        returns a dictionary of that information.'''

    # Get XMLBox as DOM
    try:
        dom = parseString(getJP2XMLBox(img, "meta"))
        fits = dom.getElementsByTagName("fits")[0]
    except:
        print "Error retrieving JP2 XML Box."
        
    # Detect image type and fetch require meta information
    telescop = getElementValue(fits, "TELESCOP")
    detector = getElementValue(fits, "DETECTOR")
    instrumu = getElementValue(fits, "INSTRUME")
    
    if telescop == 'SDO/AIA':
        datatype = "aia"
    elif telescop == 'SDO/HMI':
        datatype = "hmi"
    elif detector == 'EUVI':
        datetype = "euvi"
    elif (detector == 'COR1') or (detector == 'COR2'):
        datatype = "cor"
    elif instrumu == 'EIT':
        datatype = "eit"
    elif instrumu == 'LASCO':
        datatype = "lasco"
    elif instrumu == 'MDI':
        datatype = "mdi"
        
    return _get_header_tags(fits, datatype)

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
    date_fmt2 = "%Y-%m-%dT%H:%M:%S.%fZ"
    
    if type_ == "aia":
        return {
            "date": datetime.strptime(
                getElementValue(fits, "DATE-OBS"), date_fmt1),
            "detector": "AIA",
            "instrument": "AIA",
            "measurement": getElementValue(fits, "WAVELNTH"),
            "observatory": "SDO"
        }
    elif type_ == "hmi":
        return {
            "date": datetime.strptime(
                getElementValue(fits, "DATE-OBS"), date_fmt1),
            "detector": "HMI",
            "instrument": "HMI",
            "measurement": getElementValue(fits, "CONTENT").lower(),
            "observatory": "SDO"
        }
    elif type_ == "euvi":
        return {
            "date": datetime.strptime(
                getElementValue(fits, "DATE_OBS"), date_fmt1),
            "detector": "EUVI",
            "instrument": "SECCHI",
            "measurement": getElementValue(fits, "WAVELNTH"),
            "observatory": getElementValue(fits, "OBSRVTRY)
        }
    elif type_ == "cor":
        return {
            "date": datetime.strptime(
                getElementValue(fits, "DATE_OBS"), date_fmt1),
            "detector": getElementValue(fits, "DETECTOR"),
            "instrument": "SECCHI",
            "measurement": getElementValue(fits, "WAVELNTH"),
            "observatory": getElementValue(fits, "OBSRVTRY)
        }
    elif type_ == "eit":
        return {
            "date": datetime.strptime(
                getElementValue(fits, "DATE-OBS"), date_fmt1),
            "detector": "EIT",
            "instrument": "EIT",
            "measurement": getElementValue(fits, "WAVELNTH"),
            "observatory": "SOHO"
        }
    elif type_ == "lasco":
        datestr = "%sT%s" % (getElementValue(fits, "DATE_OBS"), getElementValue(fits, "TIME_OBS"))
        return {
            "date": datetime.strptime(datestr, date_fmt1),
            "detector": getElementValue(fits, "DETECTOR"),
            "instrument": "LASCO",
            "measurement": getElementValue(fits, "WAVELNTH"),
            "observatory": "SOHO"
        }
    elif type_ == "mdi":
        datestr = getElementValue(fits, "DATE_OBS")
            
        # MDI sometimes has an "60" in seconds field
        if datestr[17:19] == "60":
            datestr = datestr[:17] + "30" + datestr[19:]
        
        # Measurement
        dpcobsr = getElementValue(fits, "DPC_OBSR")
        meas = "Magnetogram" if dpcobsr.find('Mag') != -1 else "Continuum"
        
        return {
            "date": datetime.strptime(datestr, date_fmt2),
            "det": "MDI",
            "instrument": "MDI",
            "measurement": meas,
            "observatory": "SOHO"
        }

def getElementValue(dom, name):
    ''' Retrieves the value of a unique dom-node element or returns false if element is not found/ more than one '''
    element = dom.getElementsByTagName(name)

    if element:
        return element[0].childNodes[0].nodeValue
    else:
        raise Exception("Element not found")

def getJP2XMLBox(file, root):
    ''' Given a filename and the name of the root node, extracts
        the XML header box from a JP2 image '''
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

def processJPEG2000Images (images, rootdir, cursor, mysql, stepFxn=None):
    ''' Processes a collection of JPEG2000 Images. '''
    
    if mysql:
        import MySQLdb
    else:
        import pgdb

    remainder = len(images) % __INSERTS_PER_QUERY__

    # Return tree of known data-sources
    sources = getDataSources(cursor)
    
    # Insert images into database, 500 at a time
    if len(images) >= __INSERTS_PER_QUERY__:
        for x in range(len(images) // __INSERTS_PER_QUERY__):
            insertNImages(images, __INSERTS_PER_QUERY__, sources, rootdir, cursor, mysql, stepFxn)
            
    # Update tree of known data-sources
    sources = getDataSources(cursor)
            
    # Process remaining images
    insertNImages(images, remainder, sources, rootdir, cursor, mysql, stepFxn)

    
def insertNImages(images, n, sources, rootdir, cursor, mysql, stepFxn=None):
    query = "INSERT INTO images VALUES "
    
    error = ""
    
    for y in range(n):
        # Grab next image
        img = images.pop()
    
        print "Processing image: " + img
        
        path, filename = os.path.split(img)
        
        # Remove static part of filepath
        if rootdir[-1] == "/":
            rootdir = rootdir[:-1]
        path = path[len(rootdir):]
        
        # Extract header meta information
        try:
            m = extractJP2MetaInfo(img)
        except:
            error += filename + "\n"
        else:
            # Data Source
            source = sources[m["observatory"]][m["instrument"]][m["detector"]][m["measurement"]]
            
            # Enable datasource if it has not already been
            if (not source['enabled']):
                sources[m["observatory"]][m["instrument"]][m["detector"]][m["measurement"]]["enabled"] = True
                enableDataSource(cursor, source['id'])
        
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
    
    except Exception, e:
        print "Error: " + e.args[1]
    
