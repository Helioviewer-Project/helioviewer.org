#!/usr/bin/python
# -*- coding: utf-8 -*-
import os, sys, math
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
		generateSQL(fp, args)
	
	fp.close()
	exit()


def getArguments():
	''' Gets command-line arguments and handles validation '''
	parser = OptionParser("%prog [options] file", formatter=IndentedHelpFormatter(4,80, 130))
	parser.add_option("-n", "--num-records",   dest="numrecords",  help="Number of records per table.", default=1000000)
	parser.add_option("-c", "--cadence",       dest="cadence",     help="Record cadence in seconds.",   default=10)
	parser.add_option("-d", "--database-name", dest="dbname",      help="Database name.", default="helioviewer")
	parser.add_option("-t", "--table-name",    dest="tablename",   help="Table name (If multiple tables are requested, a number will be affixed to each table).", default="images")
	parser.add_option("-i", "--insert-size",   dest="insertsize",  help="How many records should be included in each INSERT statement", default=10)
	parser.add_option("-u", "--num-tables",    dest="numtables",   help="The number of tables to create.", default=1)
	parser.add_option("", "--postgres",      dest="postgres",    help="Whether output should be formatted for use by a PostgreSQL database.", action="store_true")
	
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

	comment = """--
-- Helioviewer Database Simulation:
--  Image Table Generation
--
-- Command:
--  %s
--
-- (Executed n %s)
--
""" % (cmd, now)
        fp.write(comment)
			
def generateSQL(fp, args):
	''' Generates a pseudo-SQL dump of a image database. '''
	# user input
	n         = int(args.numrecords)
	cadence   = int(args.cadence)
	dbname    = args.dbname
	tname     = args.tablename
	postgres  = args.postgres
	inserts   = int(args.insertsize)
	numTables = int(args.numtables)
	
	# if using MySQL, add "use" line
	if not postgres:
		fp.write("use %s\n" % dbname)
		
	# Generate tables
	for i in range(0, numTables):
		print "Generating Table %d SQL...\n0%%" % (i + 1)
		if i > 0:
			tname = tname + str(i + 1)
		createTable(fp, n, cadence, dbname, tname, postgres, inserts)
	
def createTable(fp, n, cadence, dbname, tname, postgres, inserts):
	# cadence
	delta = timedelta(seconds= cadence)

	# start from 1990/01/01
	date = datetime(1990, 1, 1)
	
	# let user know about progress
	p = 0

	# Table generation & index statements
	fp.write(getTableSQL(tname, postgres))
	
	# Create INSERT statements
	for i in range(0, int(math.ceil(n / inserts))):
		# chose syntax
		if postgres:
			fp.write('INSERT INTO "%s"."%s" (filepath, filename, date, sourceId) VALUES ' % (dbname, tname))
		else:
			fp.write('INSERT INTO %s.%s VALUES ' % (dbname, tname))
		
		# For each entry, add to INSERT statement (Note: Currently, will add extra rows if n % insertsize != 0)
		for j in range(0, inserts):
			fp.write(getEntrySQL(date.strftime("%Y-%m-%d %H:%M:%S"), postgres))
			date = date + delta
			
			# divider
			if j == (inserts - 1):
				fp.write(";\n")
			else:
				fp.write(",\n")

			if (i % max(1, (n/100)) == 0):
				p += 1
				print "%d%%" % p

	fp.write('\n')
	print "\nDone!"


def getEntrySQL(date, postgres):
	''' Returns the SQL statement for a single image record '''
	if postgres:
		return "('/1996/07/17/SOH/EIT/EIT/195', '1996_07_17_164310_SOH_EIT_EIT_195.jp2', '%s', %d)" % (date, randrange(0,7))
	else:
		return "(NULL, '/1996/07/17/SOH/EIT/EIT/195', '1996_07_17_164310_SOH_EIT_EIT_195.jp2', '%s', %d)" % (date, randrange(0,7))

def getTableSQL(tname, postgres):
	# Postgres
	if postgres:
		return """CREATE TABLE %s
(
  id serial,
  filepath character varying(255) NOT NULL,
  filename character varying(255) NOT NULL,
  date timestamp with time zone NOT NULL,
  sourceId smallint NOT NULL,
  CONSTRAINT %s_pkey PRIMARY KEY (id)
)
WITH (OIDS=FALSE);
ALTER TABLE %s OWNER TO postgres;

CREATE INDEX "date_index"
  ON %s
  USING btree
  ("date");
  
""" % (tname, tname, tname, tname)

        #MySQL
        else:
    	    return """
	CREATE TABLE `%s` (
		`id`            INT unsigned NOT NULL auto_increment,
		`filepath`      VARCHAR(255) NOT NULL,
		`filename`      VARCHAR(255) NOT NULL,
		`date`			datetime NOT NULL default '0000-00-00 00:00:00',
		`sourceId`		SMALLINT unsigned NOT NULL,
		PRIMARY KEY  (`id`), INDEX (`id`)
	) DEFAULT CHARSET=utf8;
	
	CREATE INDEX %s_index USING BTREE ON %s (date);
		""" % (tname, tname, tname)
	
def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= Helioviewer dummy SQL generator                                  ="
	print "= Last updated: 2009/08/31                                        ="
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
	print "    \"datagen.py Test.sql"
	print "    \"datagen.py -n100000 -c5 -dhv -timages Test.sql\""
	print "    \"datagen.py -n100000 -c5 -dhv -timages --postgres --numtables=5 Test.sql\"\n"	
	
if __name__ == '__main__':
	main(sys.argv)
