#!/usr/bin/env python
#-*- coding:utf-8 -*-

# Licensed under MOZILLA PUBLIC LICENSE Version 1.1
# Author: Keith Hughitt <keith.hughitt@nasa.gov>

"""Helioviewer.org Database Coverage Plotter"""

# Python imports
import sys
import os
import datetime
import getpass
import MySQLdb
from matplotlib import pyplot
from numpy import std, median

def main(argv):
    """Main application"""
    printGreeting()

    dbname, dbuser, dbpass = getDatabaseInfo()

    db = MySQLdb.connect(use_unicode=True, charset = "utf8", host="localhost", 
                         db=dbname, user=dbuser, passwd=dbpass)
    cursor = db.cursor()

    sources = getDataSources(cursor)
        
    # Setup directory structure to write graphs to
    try:
        createDirectories(sources)
    except:
        print("Unable to create directories.")
        sys.exit()
 
    numDays = int(raw_input("How many days per graph? "))
    timeIncrement = datetime.timedelta(days=numDays)
    
    now  = datetime.datetime.now()
    
    # For each data source
    for name,sourceId in sources.iteritems():
        print("Processing: " + name)
        date = getDataSourceStartDate(sourceId, cursor)
        
        # For each n day block from the start date until present
        while (date < now):
            startDate = date
            date = date + timeIncrement

            # Find and plot the number of images per day            
            dates,freqs = getFrequencies(cursor, sourceId, startDate, date)
            
            filename = "%s/%s_%s-%s.svg" % (name, name, 
                startDate.strftime("%Y%m%d"), date.strftime("%Y%m%d"))
            filename = filename.replace(" ", "_")

            plotFrequencies(name, filename, dates, freqs)
            
    print("Finished!")
    print("Cleaning up and exiting...")
        
def createDirectories(sources):
    """Creates a directory structure to use for storing the coverage graphs."""
    dir = "Helioviewer_Coverage_" + datetime.datetime.now().strftime("%Y%m%d")
    os.mkdir(dir)
    os.chdir(dir)
    
    for name,sourceId in sources.iteritems():
        os.mkdir(name.replace(" ", "_"))

def getDatabaseInfo():
    """Prompts the user for database information"""
    while True:
        print ("Please enter database information")
        dbname = raw_input("Database: ")
        dbuser = raw_input("User: ")
        dbpass = getpass.getpass("Password: ")
        
        if not checkDBInfo(dbname, dbuser, dbpass):
            print ("Unable to connect to the database. "
                   "Please check your login information and try again.")
        else:
            return dbname, dbuser,dbpass
                
def checkDBInfo(dbname, dbuser, dbpass):
    """Validates database login information"""
    try:
        db = MySQLdb.connect(db=dbname, user=dbuser, passwd=dbpass)
    except MySQLdb.Error, e:
        print e
        return False

    db.close()
    return True

def getDataSourceStartDate(sourceId, cursor):
    """Returns a datetime object for the beginning of the first day 
       where data was available for a given source id
    """
    cursor.execute("""SELECT date FROM images 
                      WHERE sourceId = %d 
                      ORDER BY date ASC LIMIT 1;""" % sourceId)
    
    return cursor.fetchone()[0].replace(hour=0,minute=0,second=0,microsecond=0)
         
def getDataSources(cursor):
    """Returns a list of datasources to query"""
    cursor.execute("SELECT name, id FROM datasources")
    datasources = {}
    
    # Get data sources
    for ds in cursor.fetchall():
        name = ds[0]
        sourceId   = int(ds[1])
        
        # Only include datasources which for images exist in the database
        cursor.execute("""SELECT COUNT(*) FROM images 
                          WHERE sourceId=%d""" % sourceId)
        count = cursor.fetchone()[0]
        
        if count > 0:
            datasources[name] = sourceId
       
    return datasources
        
def getFrequencies(cursor, sourceId, startDate, endDate):
    """Returns arrays containing the dates queried and the counts for 
       each of those days.
    """
    # Get counts for each day
    freqs = []
    dates = []
    day   = datetime.timedelta(days=1)
    
    date = startDate

    while date <= endDate:
        sql = """SELECT COUNT(*) FROM images
                 WHERE date BETWEEN '%s' AND '%s' 
                 AND sourceId = %d;""" % (date, date + day, sourceId)
        cursor.execute(sql)
        n = int(cursor.fetchone()[0])
        freqs.append(n)
        dates.append(date)
        date += day
        
    return dates,freqs
    
def plotFrequencies(name, filename, dates, freqs):
    """Creates a histogram representing the data counts for each day"""
    # Mean, median, and standard deviation  
    numDays = len(freqs)
    avg     = sum(freqs) / numDays
    med     = median(freqs)
    sigma   = std(freqs)
    
    # Plot results
    fig = pyplot.figure()
    ax = fig.add_subplot(111)
    ax.plot(dates, freqs, color='limegreen')
    fig.autofmt_xdate()
   
    pyplot.xlabel('Time')
    pyplot.ylabel('Number of Images (per day)')
    
    title = r'$\mathrm{%s\ Coverage:}\ n=%d,\ \bar{x}=%.5f,\ x_{1/2}=%.5f,\ \hat{\sigma}=%.5f$' % (name, numDays, avg, med, sigma)
    pyplot.title(title)
    #pyplot.axis([0, 0.05, 0, 1])
    pyplot.grid(True)

    #pyplot.show()
    pyplot.savefig(filename, format="svg")
    
def printGreeting():
    """Displays a greeting message"""
    print("""
        Helioviewer Database Coverage Plotter
        
        This script scans a Helioviewer image database and creates histograms
        depicting the data coverage across the different datasource lifetimes.
        Each column in the graph shows the number of images that were found for
        that day.
        
        Author : Keith Hughitt <keith.hughitt@nasa.gov>
        Last update: Feb 18, 2011
    """)
    
if __name__ == '__main__':
    sys.exit(main(sys.argv))


