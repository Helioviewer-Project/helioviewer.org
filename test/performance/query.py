#!/usr/bin/python
# -*- coding: utf-8 -*-
import os, sys, math, time, MySQLdb, pg, timeit
from datetime import datetime, timedelta
from optparse import OptionParser, OptionError, IndentedHelpFormatter
from random import randrange

def main(argv):
    printGreeting()
    args = getArguments()
    
    # open file and specify database to work with
    fp = open(args.filename, "w")
    
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
    parser.add_option("", "--postgres",        dest="postgres",    help="Whether output should be formatted for use by a PostgreSQL database.", action="store_true")
    
    try:                                
        options, args = parser.parse_args()
                    
    except:
        sys.exit(2)
        
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
    
    # connect to db
    if postgres:
        db = pg.connect(dbname = dbname, user = dbuser, passwd = dbpass)
    else:
        db = MySQLdb.connect(db = dbname, user = dbuser, passwd = dbpass)
    
    cursor = db.cursor()
    
    # get start and end times
    start, end = getDataRange()

    # generate random list of dates to query
    #t = timeit.Timer("print randDate()", "from __main__ import randDate")
    dates = []
    for i in range(0, n):
        dates.append(randDate(start, end))
        
    for d in dates:
        t = timeit.Timer("execQuery()", "from __main__ import execQuery")
        print t.timeit(1)

    sys.exit(2)

def execQuery():
    cursor.execute("SELECT * FROM %s WHERE timestamp < '%s' ORDER BY timestamp ASC LIMIT 1;" % (tname, d))

def getDataRange():
    # get data range
    try:
        cursor.execute("SELECT timestamp FROM %s ORDER BY timestamp ASC LIMIT 1;" % tname)
        start = cursor.fetchone()[0]
        
        cursor.execute("SELECT timestamp FROM %s ORDER BY timestamp DESC LIMIT 1;" % tname)
        end = cursor.fetchone()[0]

    except MySQLdb.Error, e:
        print "Error: " + e.args[1]
        
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
    print "= Last updated: 2009/08/07                                         ="
    print "=                                                                  ="
    print "= This script simulates a variable number of image queries, and    ="
    print "= records some summary information about the queries to a file.    ="
    print "=                                                                  ="
    print "= Required: python-mysqldb, python-pygresql                        ="
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
