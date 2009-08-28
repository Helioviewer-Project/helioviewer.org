# -*- coding: utf-8 -*-
import os
from datetime import datetime
from xml.dom.minidom import parseString
from org.helioviewer.db import getDataSources

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
    # TODO: (2009/08/18)
    # Create a method to try and sniff the dataSource type before processing? Or do lazily?

    # Get XMLBox as DOM
    dom = parseString(getJP2XMLBox(img, "meta"))
    fits = dom.getElementsByTagName("fits")[0]
    
    # Meta info (TODO 2009/08/25: support requests to both XML-Box & FITS header, e.g. using pyfits)
    meta = {
        "date"       : getObservationDate(fits),
        "observatory": getObservatory(fits),
        "instrument" : getInstrument(fits),
        "detector"   : getDetector(fits),
        "measurement": getMeasurement(fits)
    }
    
    return meta

def getObservationDate(dom):
    ''' Attempts to retrieve the observation date from the image meta-information '''
    try:
        # LASCO (yyyy-mm-dd + hh:mm:ss.mmm)
        t = getElementValue(dom, "TIME_OBS")
    except:
        try:
            # EIT/MDI (yyyy-mm-ddThh:mm:ss.mmmZ)
            d = getElementValue(dom, "DATE_OBS")
        except:
            print "Try next date type... (Not EIT,MDI, or LASCO)"
        else:
            datestring = d[0:-1] + "000Z" # Python uses microseconds (See: http://bugs.python.org/issue1982)
            date = datetime.strptime(datestring, "%Y-%m-%dT%H:%M:%S.%fZ")
    else:
        d = getElementValue(dom, "DATE_OBS")
        datestring = "%sT%s000Z" % (d, t)
        date = datetime.strptime(datestring, "%Y/%m/%dT%H:%M:%S.%fZ")
        
    return date        
    
def getObservatory(dom):
    ''' Attempts to retrieve the observatory name from the image meta-information '''
    try:
        # SOHO
        obs = getElementValue(dom, "TELESCOP")
    except:
        print "Observatory not found."
        
    return obs
    
def getInstrument(dom):
    ''' Attempts to retrieve the instrument name from the image meta-information '''
    try:
        #SOHO
        inst = getElementValue(dom, "INSTRUME")
    except:
        print "Instrument not found."
    
    return inst
    
def getDetector(dom):
    ''' Attempts to retrieve the detector name from the image meta-information '''
    try:
        #LASCO
        det = getElementValue(dom, "DETECTOR")
    except:
        try:
            # EIT,MDI
            trash = getElementValue(dom, "INSTRUME")
            det = ""
        except:
            print "Try next inst..."
    
    return det
    
def getMeasurement(dom):
    ''' Attempts to retrieve the measurement name from the image meta-information '''
    try:
        #EIT
        meas = getElementValue(dom, "WAVELNTH")
    except:
        try:
            inst = getElementValue(dom, "INSTRUME")

            #LASCO
            if inst == "LASCO":
                meas = "white light"
            #MDI
            elif inst == "MDI":
                dpcobsr = getElementValue(dom, "DPC_OBSR")
                if dpcobsr.find("Magnetogram") is not -1:
                    meas = "magnetogram"
                else:
                    meas = "continuum"
            else:
                print "Try next measurement detector method..."                
        except:
            print "Try next measurement detection method..."

    return meas

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

    return xml

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
            
    # Process remaining images
    insertNImages(images, remainder, sources, rootdir, cursor, mysql, stepFxn)
    
def insertNImages(images, n, sources, rootdir, cursor, mysql, stepFxn=None):
    query = "INSERT INTO image VALUES "
    
    for y in range(n):
        # Grab next image
        img = images.pop()
    
        #print "Processing image: " + img
        
        path, filename = os.path.split(img)
        
        # Remove static part of filepath
        if rootdir[-1] == "/":
            rootdir = rootdir[:-1]
        path = path[len(rootdir):]
        
        # Extract header information
        meta = extractJP2MetaInfo(img)
    
        # Source id
        id = sources[meta["observatory"]][meta["instrument"]][meta["detector"]][meta["measurement"]]
        
        # Date
        date = meta["date"]
    
        # insert into database
        query += "(NULL, '%s', '%s', '%s', %d)," % (path, filename, date, id)
        
        # Progressbar
        if stepFxn and (y + 1) % __STEP_FXN_THROTTLE__ is 0:
            stepFxn(filename)
    
    # Remove trailing comma
    query = query[:-1] + ";"
        
    # print query
        
    # Execute query
    try:
        cursor.execute(query)
    
    except Exception, e:
        print "Error: " + e.args[1]
    