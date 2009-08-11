#!/usr/bin/python
# -*- coding: utf-8 -*-
import os, sys, MySQLdb, pgdb, timeit
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from optparse import OptionParser, OptionError, IndentedHelpFormatter
from random import randrange
from socket import gethostname
from numpy import std, median


def main(argv):
    printGreeting()
    args = getArguments()
    
    # open file and specify database to work with
    fp = open(args.filename, "w")
    
    print "Processing..."
    
    if (fp):
        addMetaInfo(fp, argv)
        queryDatabase(fp, args)
    
    fp.close()
    exit()


def getArguments():
    ''' Gets command-line arguments and handles validation '''
    parser = OptionParser("%prog [options] file", formatter=IndentedHelpFormatter(4,80))
    parser.add_option("-d", "--database-name", dest="dbname",      help="Database name.", default="helioviewer", metavar="DB_Name")
    parser.add_option("-u", "--database-user", dest="dbuser",      help="Database username.", default="helioviewer", metavar="Username")
    parser.add_option("-p", "--database-pw",   dest="dbpass",      help="Database password.", default="helioviewer", metavar="Password")
    parser.add_option("-t", "--table-name",    dest="tablename",   help="Table name.", default="image", metavar="Table_Name")
    parser.add_option("-n", "--num-queries",   dest="numqueries",  help="Number of queries to simulate.", default=1000)
    parser.add_option("-c", "--count",         dest="count",       help="Number of rows in the database (queried with COUNT if not specified, which is slow on transaction safe databases, e.g. postgres)")
    parser.add_option("", "--postgres",        dest="postgres",    help="Whether output should be formatted for use by a PostgreSQL database.", action="store_true")
    
    try:                                
        options, args = parser.parse_args()
                    
    except:
        sys.exit(2)
        x 
    # check for filename
    if len(args) != 1:
        usage(parser)
        print "Error: Output file not specified"
        sys.exit(2)
    else:
        options.filename = args[0]

    return options

def addMetaInfo(fp, argv):
    # Command
    cmd = ""
    for arg in argv:
        cmd += " " + arg
    
    # Execution time
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S") 

    comment = """###############################################################################
# Helioviewer Database Simulation:
#  Image Queries
#
# Command:
#  %s
#
# (Executed n %s)
###############################################################################
""" % (cmd, now)
    fp.write(comment)

def queryDatabase(fp, args):
    ''' Simulates a number of image queries, and records results to a file '''
    global cursor, tname, d
    
    # user input
    n         = int(args.numqueries)
    dbname    = args.dbname
    dbuser    = args.dbuser
    dbpass    = args.dbpass
    tname     = args.tablename
    postgres  = args.postgres
    count     = args.count
    
    # dbtype
    if postgres:
        dbtype = "PostgreSQL"
    else:
        dbtype = "MySQL"
    
    # connect to db
    if postgres:
        db = pgdb.connect(database = dbname, user = dbuser, password = dbpass)
    else:
        db = MySQLdb.connect(db = dbname, user = dbuser, passwd = dbpass)
    
    cursor = db.cursor()
    
    # get start and end times
    start, end = getDataRange(postgres)
    
    # total number of records
    numrecords = getNumRecords(count)
    
    # track quickest and slowest queries (None ~ negative infinity, () ~ positive infinity)
    min = {"time": (), "query": ""}
    max = {"time": None, "query": ""}

    # generate random list of dates to query
    dates = []
    for i in range(0, n):
        dates.append(randDate(start, end))
     
    times   = []
    results = []

    for d in dates:
        t = timeit.Timer("execQuery()", "from __main__ import execQuery")
        time = t.timeit(1)
        times.append(time)
        results.append({"time": time, "query": d})
        
        if time < min["time"]:
            min = {"time": time, "query": d}
        
        if time > max["time"]:
            max = {"time": time, "query": d}
    
    # mean, median, and standard deviation  
    avg   = sum(times) / len(times)
    med   = median(times)
    stdev = std(times)
    
    fp.write("""
[Summary]
Machine : %s
Database: %s (%s)
Table   : %s
Records Total: %d

[Query Statistics]
n: %d
mean: %.5fs
median: %.5fs
std dev: %.5fs

Fastest Query: %.5fs (%s)
Slowest Query: %.5fs (%s)
    """ % (gethostname(), dbname, dbtype, tname, numrecords, n, avg, med, stdev, min["time"], min["query"], max["time"], max["query"]))
    
    # plot histogram of times
    plotResults(times, avg, stdev, args.filename[0:-4] + "-plot.svg")

    print "Finished!"
    sys.exit(2)

def execQuery():
    cursor.execute("SELECT * FROM %s WHERE timestamp < '%s' ORDER BY timestamp ASC LIMIT 1;" % (tname, d))

def getNumRecords(count):
    if count == None:
        try:
            cursor.execute("SELECT COUNT(*) FROM %s;" % tname)
            total = int(cursor.fetchone()[0])
        except MySQLdb.Error, e:
            print "Error: " + e.args[1]
    else:
        total = int(count)
        
    return total        

def plotResults(x, mu, sigma, output):
    
    print "...Plotting results"
    
    # the histogram of the data
    n, bins, patches = plt.hist(x, bins=50, normed=False, facecolor='limegreen', alpha=0.75)
    
    plt.xlabel('Query Time')
    plt.ylabel('Number')
    plt.title(r'$\mathrm{Helioviewer\ Image\ Query\ Time:}\ n=%d,\ \mu=%.5fs,\ \sigma=%.5f$' % (len(x), mu, sigma))
    #plt.axis([0, 0.05, 0, 1])
    plt.grid(True)
    
    #plt.show()
    plt.savefig(output, format="svg")

def getDataRange(postgres):
    # get data range
    try:
        cursor.execute("SELECT timestamp FROM %s ORDER BY timestamp ASC LIMIT 1;" % tname)
        start = cursor.fetchone()[0]
        
        cursor.execute("SELECT timestamp FROM %s ORDER BY timestamp DESC LIMIT 1;" % tname)
        end = cursor.fetchone()[0]

    except MySQLdb.Error, e:
        print "Error: " + e.args[1]
    
    # Postgres
    if postgres: 
        start = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")
    
    return start, end

def randDate(start, end):
    '''
    This function will return a random datetime between two datetime objects.
    http://stackoverflow.com/questions/553303/generate-a-random-date-between-two-other-dates
    '''
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = randrange(int_delta)
    return (start + timedelta(seconds=random_second))


def printGreeting():
    ''' Prints a greeting to the user'''
    os.system("clear")

    print "===================================================================="
    print "= Helioviewer query simulation                                     ="
    print "= Last updated: 2009/08/10                                         ="
    print "=                                                                  ="
    print "= This script simulates a variable number of image queries, and    ="
    print "= records some summary information about the queries to a file.    ="
    print "=                                                                  ="
    print "= Required: python-mysqldb, python-pygresql, python-numpy,         ="
    print "=           matplotlib (0.99), python-tz, python-dateutil          ="
    print "===================================================================="
    
def usage(parser):
    ''' Prints program usage description '''
    print ""
    parser.print_help()
    print "\n Examples: \n"
    print "    \"query.py summary.txt\""
    print "    \"query.py -n100 -dhv -uusername -ppassword -timage summary.txt\""
    print "    \"query.py -n10000 -dhv -uusername -ppassword -timage --postgres summary.txt\"\n"    
    
if __name__ == '__main__':
    main(sys.argv)
