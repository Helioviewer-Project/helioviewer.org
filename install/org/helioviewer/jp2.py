# -*- coding: utf-8 -*-
import os
from datetime import datetime
from xml.dom.minidom import parseString
from org.helioviewer.db import getDataSources

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

def extractJP2MetaInfo (img, sources):
    ''' Extracts useful meta-information from a given JP2 image and
        returns a dictionary of that information.'''
    meta = {}

    # TODO: (2009/08/18)
    # Create a method to try and sniff the dataSource type before processing? Or do lazily?
    
    # Get XMLBox as DOM
    dom = parseString(getJP2XMLBox(img, "meta"))

    # Observatory
    try:
        obs = getElementValue(dom, "TELESCOP")
    except:
        print "Try next obs..."

    # Date
    try:
        date = getElementValue(dom, "DATE_OBS") #EIT
        datestring = eitdate[0:-1] + "000Z" # Python uses microseconds (See: http://bugs.python.org/issue1982)
        date = datetime.strptime(datestring, "%Y-%m-%dT%H:%M:%S.%fZ")
    except e:
        print "(Try next date type...)"

    meta["date"] = date
    return meta

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
    
    return xml

def processJPEG2000Images (images, cursor):
    ''' Processes a collection of JPEG2000 Images. '''
    INSERTS_PER_QUERY = 500
    
    remainder = len(images) % INSERTS_PER_QUERY
    
    dataSources = getDataSources(cursor)
    
    if len(images) >= INSERTS_PER_QUERY:
        for x in range(len(images) / INSERTS_PER_QUERY):
            for y in range(INSERTS_PER_QUERY):
                img = images.pop()
                path, uri = os.path.split(img)
                meta = extractJP2MetaInfo(img, dataSources)
        
                # Format date (> Python 2.5 Method)
                # date = datetime.strptime(meta["date"][0:19], "%Y:%m:%d %H:%M:%S")
        
                print "Processing image: " + img
        
                # Format date
                d = meta["date"]
        
                # Temporary work-around
                if d[17:19] == "60":
                    secs = "30"
                else:
                    secs = d[17:19]
        
                date = datetime(int(d[0:4]), int(d[5:7]), int(d[8:10]), int(d[11:13]), int(d[14:16]), int(secs))
        
                # insert into database
                query = "INSERT INTO image VALUES(NULL, %d, '%s', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, '%s')" % (
                    measurementIds[meta["det"] + meta["meas"]],
                    date,
                    meta["centering"],
                    meta["centerX"],
                    meta["centerY"],
                    meta["lengthX"],
                    meta["lengthY"],
                    meta["scaleX"],
                    meta["scaleY"],
                    meta["radius"],
                    meta["width"],
                    meta["height"],
                    meta["opacityGrp"],
                    uri)
                print query
        
                try:
                    cursor.execute(query)
        
                except MySQLdb.Error, e:
                    print "Error: " + e.args[1]