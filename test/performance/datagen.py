#!/usr/bin/python
# -*- coding: utf-8 -*-
import os, sys, math
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


def getArguments():
	''' Gets command-line arguments and handles validation '''
	parser = OptionParser("%prog [options] file", formatter=IndentedHelpFormatter(4,80, 130))
	parser.add_option("-n", "--num-records",   dest="numrecords",  help="Number of records per table.", default=1000000)
	parser.add_option("-c", "--cadence",       dest="cadence",     help="Record cadence in seconds.",   default=10)
	parser.add_option("-d", "--database-name", dest="dbname",      help="Database name.", default="helioviewer")
	parser.add_option("-t", "--table-name",    dest="tablename",   help="Table name (If multiple tables are requested, a number will be affixed to each table).", default="image")
	parser.add_option("-i", "--insert-size",   dest="insertsize",  help="How many records should be included in each INSERT statement", default=10)
	parser.add_option("-u", "--num-tables",    dest="numtables",   help="The number of tables to create.", default=1)
	parser.add_option("-p", "--postgres",      dest="postgres",    help="Whether output should be formatted for use by a PostgreSQL database.", action="store_true")
	
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
			fp.write('INSERT INTO "%s"."%s" ("measurementId", "timestamp", centering, "centerX", "centerY", "lengthX", "lengthY", "imgScaleX", "imgScaleY", "solarRadius", width, height, "opacityGrp", uri) VALUES ' % (dbname, tname))
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
		return "(9,'%s',1,588,588,1158,1158,10.52,10.52,93.0784,1176,1176,2,'2003_11_11_180605_SOH_LAS_0C2_0WL.jp2')" % date
	else:
		return "(NULL,9,'%s',1,588,588,1158,1158,10.52,10.52,93.0784,1176,1176,2,'2003_11_11_180605_SOH_LAS_0C2_0WL.jp2')" % date

def getTableSQL(tname, postgres):
	# Postgres
	if postgres:
		return """CREATE TABLE %s
(
  id serial,
  "measurementId" integer NOT NULL DEFAULT 0,
  "timestamp" timestamp without time zone NOT NULL,
  centering smallint NOT NULL,
  "centerX" double precision NOT NULL,
  "centerY" double precision NOT NULL,
  "lengthX" double precision NOT NULL,
  "lengthY" double precision NOT NULL,
  "imgScaleX" double precision NOT NULL,
  "imgScaleY" double precision NOT NULL,
  "solarRadius" double precision NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  "opacityGrp" smallint NOT NULL,
  uri character varying(255) NOT NULL,
  CONSTRAINT %s_pkey PRIMARY KEY (id)
)
WITH (OIDS=FALSE);
ALTER TABLE %s OWNER TO postgres;

CREATE INDEX "timestamp"
  ON %s
  USING btree
  ("timestamp");
  
""" % (tname, tname, tname, tname)

        #MySQL
        else:
    	    return """
CREATE TABLE  `%s` (
  `id` int(10) unsigned NOT NULL auto_increment,
  `measurementId` int(10) unsigned NOT NULL default '0',
  `timestamp` datetime NOT NULL default '0000-00-00 00:00:00',
  `centering`    bool NOT NULL,
  `centerX`      float(6) NOT NULL,
  `centerY`      float(6) NOT NULL,
  `lengthX`      float(6) NOT NULL,
  `lengthY`      float(6) NOT NULL,  
  `imgScaleX`    float(6) NOT NULL,
  `imgScaleY`    float(6) NOT NULL,
  `solarRadius`  float(6) NOT NULL,
  `width`        int(10) NOT NULL,
  `height`       int(10) NOT NULL,
  `opacityGrp`   tinyint NOT NULL,
  `uri`          varchar(255) NOT NULL,
  PRIMARY KEY  (`id`), INDEX (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 AUTO_INCREMENT=0;

CREATE INDEX %s_index USING BTREE ON %s (timestamp);

""" % (tname, tname, tname)
	
def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= Helioviewer dummy SQL generator                                  ="
	print "= Last updated: 2009/08/05                                         ="
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
	print "    \"datagen.py -n100000 -c5 -dhv -timage Test.sql\""
	print "    \"datagen.py -n100000 -c5 -dhv -timage --postgres --numtables=5 Test.sql\"\n"	
	
if __name__ == '__main__':
	main(sys.argv[1:])
