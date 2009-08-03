#!/usr/bin/python
# -*- coding: utf-8 -*-
import os
from datetime import datetime, timedelta

def main():
	printGreeting()
	
	filename = raw_input("Save file as: ")
	
	# open file and specify database to work with
	fp = open(filename, "w")
	
	if (fp):
		generateSQL(fp)
	
	fp.close()
	exit()
			
def generateSQL(fp):

	# some more user input
	n = int(raw_input("Number of entries to generate: "))

	cadence = int(raw_input("Time between images (in seconds): "))
	dbname  = raw_input("Database name: ")
	
	# select database
	fp.write("use %s\n" % dbname)
		
	# cadence
	delta = timedelta(seconds= cadence)

	# start from 1990/01/01
	date = datetime(1990, 1, 1)
	
	# date format 2003-11-11 18:06:05
	for i in range(n):
		fp.write(createEntry(date.strftime("%Y-%m-%d %H:%M:%S")))
		date = date + delta
	
def createEntry(date):
	return "INSERT INTO \"image\" VALUES  (NULL,9,'%s',1,588,588,1158,1158,10.52,10.52,93.0784,1176,1176,2,'2003_11_11_180605_SOH_LAS_0C2_0WL.jp2');\n" % date

	
def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= Helioviewer dummy SQL generator                                  ="
	print "= Last updated: 2009/07/31                                         ="
	print "=                                                                  ="
	print "= This script generates a SQL file containing an arbitrary number  ="
	print "= of pseudo-image entries in order to test database performance.   ="
	print "= In order to more accurately represent the likely distibution of  ="
	print "= data that will be used, the entries generated began at some      ="
	print "= arbitrary date, and increase by a specified cadence. Eventually  ="
	print "= it may be more desirable to add some entropy to the dummy        ="
	print "= entries to more realistically simulate actual data.              ="
	print "=                                                                  ="
	print "= TODO: Provide option to connect directly to db, or dump to file  ="
	print "===================================================================="
	
if __name__ == '__main__':
	main()
