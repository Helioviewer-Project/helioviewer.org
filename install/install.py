#!/usr/bin/python
# -*- coding: utf-8 -*-

import os, glob, math, MySQLdb, datetime

def main():
	printGreeting()
	path, dbname, dbuser, dbpass = getInput()
	db = MySQLdb.connect(host = "localhost", db = dbname, user = dbuser, passwd = dbpass)
	cursor = db.cursor()
	traverseTiles(path, cursor)
	#traverseDirectory(path)

def traverseDirectory (path):
	''' Traverses file-tree starting with the specified path'''
	for child in os.listdir(path):
		node = os.path.join(path, child)
		if os.path.isdir(node):
			traverseDirectory(node)
		else:
			processTile(os.path.split(node)[1]);

def traverseTiles (path, cursor):
	''' Travels to the each of the lowest-level child directories and
		processes tiles found there.'''

	#Find lowest-level directories. Assumes that search is starting at the
	#root directory (one containing year directories).
	leafDirs = glob.glob (os.path.join(path, '*/*/*/*/*/*/*/*'))

	for dir in leafDirs:
		processImages(dir, cursor)
		#processTiles(dir)

def processImages (dir, cursor):
	''' populate images table with images from a single directory '''
	times = []

	#get times of observations in current directory
	for file in os.listdir(dir):
		times.append(file[13:17])

	#get rid of redudant entries
	times = compact(times)

	#shared params
	params = dir.split('/')[-8:-1]
	print params

	#TODO: get last image id
	id = 1;

	#populate images table
	for time in times:
		date = datetime.datetime(int(params[0]), int(params[1]), int(params[2]), int(params[3]), int(time[0:1]), int(time[2:3]))
		query = "INSERT INTO image VALUES(%d, %d, UNIX_TIMESTAMP(%s), '%s')" % (id, 21, date, 'jpg')

		try:
			cursor.execute(query)
			print "SQL Query: " + query;

		except MySQLdb.Error, e:
			if e.args[0] == 1146:	# We got an error that the table does not exist. Create the table and insert the data.
				print "Error: Table does not exist"
			else:
				print "Error: " + e.args[1]

		id += 1

	#print "times"
	#for i in times:
	#	print i

#old
def processTile (tile):
	time =	  tile[11:17]
	zoomLevel = tile[35:37]
	#print zoomLevel + ', ' + time

def printGreeting():
	''' Prints a greeting to the user'''
	os.system("clear")

	print "===================================================================="
	print "= HelioViewer Database Population Script 0.1                       ="
	print "= By: Keith Hughitt, July 08, 2008                                 ="
	print "=                                                                  ="
	print "= This script processes raw tile images, and inserts them into a   ="
	print "= database, along with their relevent information.                 ="
	print "=                                                                  ="
	print "= The script requires several pieces of information to function:   ="
	print "=   (1) The location of the root directory where tiles are stored. ="
	print "=       This is the directory whose sub-directories are years:     ="
	print "=       2003, 2004, etc.                                           ="
	print "=   (2) The name of the database schema to populate.               ="
	print "=   (3) The name of the database user with appropriate access.     ="
	print "=   (4) The password for the specified database user.              ="
	print "===================================================================="

def getInput():
	''' Prompts the user for required information '''

	path = raw_input("Root directory: ")
	while not os.path.isdir(path):
		print "That is not a valid directory! Please try again."
		path = raw_input("Root directory: ")

	dbname = raw_input("Database name: ")
	dbuser = raw_input("Database user: ")
	dbpass = raw_input("Database password: ")
	return path, dbname, dbuser, dbpass


def getNumTiles (zoomLevel):
	''' Returns the number of tiles expected for a given zoom-level '''

	#Each image above zoom-level 11 consists of 4 tiles, for zoom Levels
	#below that, the number of tiles is 3^2, 4^2, etc.
	return int(4 if zoomLevel >= 12 else math.pow((14 - zoomLevel), 2))


def compact(seq):
	'''Removes duplicate entries from a list.
	   From http://www.peterbe.com/plog/uniqifiers-benchmark'''
	seen = set()
	return [ x for x in seq if x not in seen and not seen.add(x)]


if __name__ == '__main__':
	main()
