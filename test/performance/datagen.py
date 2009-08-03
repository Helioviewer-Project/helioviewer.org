#!/usr/bin/python
# -*- coding: utf-8 -*-
import os, sys
from datetime import datetime, timedelta
from optparse import OptionParser, OptionError, IndentedHelpFormatter

def main(argv):
	printGreeting()
	args = getArguments()
	
	# open file and specify database to work with
	fp = open(args.filename, "w")
	
	if (fp):
		generateSQL(fp, args)
	
	fp.close()
	exit()


# TODO  http://docs.python.org/library/optparse.html#handling-boolean-flag-options
#		http://docs.python.org/library/optparse.html#default-values
def getArguments():
	''' Gets command-line arguments and handles validation '''
	parser = OptionParser("%prog [options]", formatter=IndentedHelpFormatter(4,80, 130))
	parser.add_option("-n", "--num-records",   dest="numrecords",  help="Number of records to add.")
	parser.add_option("-c", "--cadence",       dest="cadence",     help="Record cadence in seconds.")
	parser.add_option("-o", "--output-file",   dest="filename",    help="File to output SQL to.")
	parser.add_option("-d", "--database-name", dest="dbname",      help="Database name.")
	parser.add_option("-p", "--postgres",      dest="postgres",    help="[Optional] Whether output should be formatted for use by a PostgreSQL database.")
	parser.add_option("-s", "--insert-size",   dest="insertsize",  help="[Optional] How many records should be included in each INSERT statement")
	parser.add_option("-t", "--num-tables",    dest="numtables",   help="[Optional] The number of tables to distribute records over")
	
	try:                                
		options, args = parser.parse_args()
					
	except:
		sys.exit(2)

	ok = True

	# Required parameters
	if options.filename == None:
		print "Filename not specified!"
		ok = False
		
	if options.numrecords == None:
		print "Number of re not specified!"
		ok = False
		
	if options.cadence == None:
		print "Record cadence not specified!"
		ok = False
		
	if options.dbname == None:
		print "Database name not specified!"
		ok = False
		
	if not ok:
		usage(parser)
		sys.exit(2)
		
	# Optional parameters
	if (options.postgres != None) and (options.postgres.lower() == "true"):
		options.postgres = True
	else:
		options.postgres = False
		
	if options.insertsize == None:
		options.insertsize = 5

	return options
			
def generateSQL(fp, args):

	# some more user input
	n        = int(args.numrecords)
	cadence  = int(args.cadence)
	dbname   = args.dbname
	postgres = args.postgres
	inserts  = int(args.insertsize)
	
	# if using MySQL, add "use" line
	if not postgres:
		fp.write("use %s\n" % dbname)
	
	# cadence
	delta = timedelta(seconds= cadence)

	# start from 1990/01/01
	date = datetime(1990, 1, 1)
	
	# let user know about progress
	p = 0
	print "Generating SQL...\n0%"
	
	# date format 2003-11-11 18:06:05

	for i in range(0, n):
		fp.write(createEntry(date.strftime("%Y-%m-%d %H:%M:%S"), args.dbname, args.postgres))
		date = date + delta
		if (i % (n/100) == 0):
			p += 1
			print "%d%%" % p

			
	print "\nDone!"
	
def createEntry(date, dbname, postgres):
	if postgres:
		sql = "INSERT INTO \"%s\".\"image\" VALUES (NULL,9,'%s',1,588,588,1158,1158,10.52,10.52,93.0784,1176,1176,2,'2003_11_11_180605_SOH_LAS_0C2_0WL.jp2');\n"
	else:
		sql = "INSERT INTO %s.image VALUES (NULL,9,'%s',1,588,588,1158,1158,10.52,10.52,93.0784,1176,1176,2,'2003_11_11_180605_SOH_LAS_0C2_0WL.jp2');\n"
	return sql % (dbname, date)

	
def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= Helioviewer dummy SQL generator                                  ="
	print "= Last updated: 2009/08/03                                         ="
	print "=                                                                  ="
	print "= This script generates a SQL file containing an arbitrary number  ="
	print "= of pseudo-image entries in order to test database performance.   ="
	print "= In order to more accurately represent the likely distibution of  ="
	print "= data that will be used, the entries generated began at some      ="
	print "= arbitrary date, and increase by a specified cadence. Eventually  ="
	print "= it may be more desirable to add some entropy to the dummy        ="
	print "= entries to more realistically simulate actual data.              ="
	print "===================================================================="
	
def usage(parser):
	''' Prints program usage description '''
	print ""
	parser.print_help()
	print "\n Examples: \n"
	print "    \"datagen.py -n100000 -c5 -oTest.sql -dhv\""
	print "    \"datagen.py -n100000 -c5 -oTest.sql -dhv --postgres=true\"\n"	
	
if __name__ == '__main__':
	main(sys.argv[1:])
