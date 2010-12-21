#!/usr/bin/env python
#-*- coding:utf-8 -*-
import sys, os, datetime, MySQLdb
from numpy import std, median
import matplotlib.pyplot as plt

def main(argv):
    if len(argv) != 4:
        print "Incorrect number of arguments. Please specify the database name, user, and password, e.g.: "
        print "python coverage.py dbname dbuser dbpass"
        exit()
    
    db = MySQLdb.connect(use_unicode=True, charset = "utf8", host="localhost", db=argv[1], user=argv[2], passwd=argv[3])
    cursor = db.cursor()

    sources = getDataSources(cursor)
    
    results = {}
    
    # For each data source
    for name, id in sources.iteritems():
        dates,freqs = getFrequencies(cursor, name, id)
        
        plotFrequencies(name, dates, freqs)
         
def getDataSources(cursor):
    ''' Returns a list of datasources to query '''
    cursor.execute("SELECT name, id FROM datasources")
    datasources = {}
    
    # Get data sources
    for ds in cursor.fetchall():
        name = ds[0]
        id   = int(ds[1])
        
        # Only include datasources which for images exist in the database
        cursor.execute("SELECT COUNT(*) FROM images WHERE sourceId=%d" % id)
        count = cursor.fetchone()[0]
        
        if count > 0:
            datasources[name] = id
       
    return datasources
        
def getFrequencies(cursor, name, id):
    ''' Returns arrays containing the dates queried and the counts for each of those days '''

    # Find the start and end dates of available data (set time portion to 00:00:00.000)
    cursor.execute("SELECT date FROM images WHERE sourceId = %d ORDER BY date ASC LIMIT 1;" % id)
    startDate = cursor.fetchone()[0].replace(hour=0,minute=0,second=0,microsecond=0)
    cursor.execute("SELECT date FROM images WHERE sourceId = %d ORDER BY date DESC LIMIT 1;" % id)
    endDate   = cursor.fetchone()[0].replace(hour=0,minute=0,second=0,microsecond=0)

    date = startDate

    # Get counts for each day
    freqs = []
    dates = []
    day   = datetime.timedelta(days=1)
    ms    = datetime.timedelta(microseconds = 1)

    while date <= endDate:
        sql = "SELECT COUNT(*) FROM images WHERE date BETWEEN '%s' AND '%s' AND sourceId = %d;" % (date, date + day - ms, id)
        cursor.execute(sql)
        n = int(cursor.fetchone()[0])
        freqs.append(n)
        dates.append(date)
        date += day
        
    return dates,freqs
    
def plotFrequencies(name, dates, freqs):
    # mean, median, and standard deviation  
    avg   = sum(freqs) / len(freqs)
    med   = median(freqs)
    sigma = std(freqs)

    # plot results
    fig = plt.figure()
    ax = fig.add_subplot(111)
    ax.plot(dates, freqs, color='limegreen')
    fig.autofmt_xdate()
   
    plt.xlabel('Time')
    plt.ylabel('Number of Images (per day)')
    plt.title(r'$\mathrm{%s\ Coverage:}\ n=%d,\ \bar{x}=%.5f,\ x_{1/2}=%.5f,\ \hat{\sigma}=%.5f$' % (name, len(freqs), avg, med, sigma))
    #plt.axis([0, 0.05, 0, 1])
    plt.grid(True)

    #plt.show()
    plt.savefig(name + ".svg", format="svg")
    
  
if __name__ == '__main__':
    sys.exit(main(sys.argv))


