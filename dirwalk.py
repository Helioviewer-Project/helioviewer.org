import os, re, MySQLdb, datetime
from os.path import join, getsize

Database = MySQLdb.connect(host = "localhost", user = "root", passwd = "password", db = "esahelio_svdb0")

Cursor = Database.cursor()


DirStructure = ('year', 'month', 'day', 'hour', 'observatory', 'instrument', 'detector', 'measurement', 'map')

RootDir = '/var/www/hvdb' # This is where the directory tree for the images starts.
RootDir_Length = len(RootDir)


# Returns where we are in the directory strucuture based off of the length of the root dir.
def ReturnPosition(root):
	Size = len(root) - RootDir_Length
	
	if Size == 0:
		return 0
		
	elif Size == 5:
		return 1
		
	elif Size == 8:
		return 2
		
	elif Size == 11:
		return 3
		
	elif Size == 16:
		return 4
		
	elif Size == 20:
		return 5
		
	elif Size == 24:
		return 6
		
	elif Size == 28:
		return 7
		
	else:
		 return 8

# Returns true if the child is the correct length for the position in the directory structure.
def Verify(Root, File):
	Position = ReturnPosition(Root)
	
	if Position == 0 and len(File) == 4:
		return True
		
	elif Position == 1 and len(File) == 2:
		return True
		
	elif Position == 2 and len(File) == 2:
		return True
		
	elif Position == 3 and len(File) == 2:
		return True
		
	elif Position == 4 and len(File) == 4:
		return True
		
	elif Position == 5 and len(File) == 3:
		return True
		
	elif Position == 6 and len(File) == 3:
		return True
		
	elif Position == 7 and len(File) == 3:
		return True
		
	elif Position == 8 and (len(File) == 67 or len(File) == 68):
		return True
		
	else:
		return False

# This returns what length a directories sub-directories should be..
def ReturnChildLength(root):
	Position = ReturnPosition(root)
	
	if Position == 0:	#We're in root, adding years
		return 4
		
	elif Position == 1: # In Years, adding months
		return 2
		
	elif Position == 2: # In Months, adding days
		return 2
		
	elif Position == 3: # In Days, adding hours
		return 2
		
	elif Position == 4: # In Hours, adding observatories
		return 4
		
	elif Position == 5: # In Obsevatories, adding instruments
		return 3
		
	elif Position == 6: # In Instruments, adding detectors
		return 3
		
	elif Position == 7: # In Detectors, adding measurements
		return 3

	else:
		return 666

	

for root, dirs, files in os.walk(RootDir):

	# Here, we are testing to see where we are in the directory structure.
	# If we are not at the end where we keep the image files, we test to see if
	# the sub-directories are the correct length. If they aren't, we remove them from
	# the dirwalk.
	if ReturnPosition(root) < 8:
		for Iterator in dirs:
				
			if len(Iterator) != ReturnChildLength(root):
				print "REMOVING " + root + "/" + Iterator + " Child Length: " + str(ReturnChildLength(root)) + " Position: " + str(ReturnPosition(root))
				dirs.remove(Iterator)
	
	# We are now at the end of the directory structure where the images are.
	# Here, we test to see if the files are the correct length. If they aren't,
	# we remove them. If they are the correct length we send them to the database.
	elif ReturnPosition(root) == 8:
		StatusNumber = 0 # Just a number to show that things are still moving since walking the directories and insertion might take a while.
		for Iterator in files:
			StatusNumber = StatusNumber + 1
			print "INSERTING %s" % StatusNumber
			print len(Iterator)
			#if len(Iterator) != 67 and len(Iterator) != 68:
			#	print "REMOVING " + Iterator
			#	dirs.remove(Iterator)
			
			if Verify(root, Iterator):
				INSValue = root[RootDir_Length:]	# Cut off the root directory.
				Year = INSValue[1:5]
				Month = INSValue[6:8]
				Day = INSValue[9:11]
				Hour = Iterator[11:13]
				Minute = Iterator[13:15]
				Second = Iterator[15:17]
				print Iterator
				print Hour
				print Minute
				print Second
				Observatory = Iterator[18:22]
				Instrument = Iterator[23:26]
				Detector = Iterator[27:30]
				Measurement = Iterator[31:34]
				Extension = Iterator[64:]
				Timestamp = "%s%s%s%s%s%s" % (Year, Month, Day, Hour, Minute, Second)
				Map = "%s_%s_%s_%s%s%s_%s_%s_%s_%s" % (Year, Month, Day, Hour, Minute, Second, Observatory, Instrument, Detector, Measurement)
	
				sqlquery = "INSERT INTO maps (map, timestamp, year, month, day, hour, minute, second, observatory, instrument, detector, measurement, extension) VALUES('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')" % (Map, Timestamp, Year, Month, Day, Hour, Minute, Second, Observatory, Instrument, Detector, Measurement, Extension)
				try:
					Cursor.execute(sqlquery)
					
				except MySQLdb.Error, e:
					if e.args[0] == 1146:	# We got an error that the table does not exist. Create the table and insert the data.
						sqlquery = "CREATE TABLE maps (map CHAR(34) NOT NULL, timestamp DATETIME NOT NULL, year INT(4) NOT NULL , month INT(2) NOT NULL , day INT(2) NOT NULL , hour INT(2) NOT NULL , minute CHAR(2) NOT NULL , second INT(2) NOT NULL , observatory CHAR(4) NOT NULL , instrument CHAR(3) NOT NULL , detector CHAR(3) NOT NULL , measurement CHAR(3) NOT NULL , extension VARCHAR(4) NOT NULL , PRIMARY KEY (map))"
						Cursor.execute(sqlquery)
						sqlquery = "INSERT INTO maps (map, timestamp, year, month, day, hour, minute, second, observatory, instrument, detector, measurement, extension) VALUES('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')" % (Map, Timestamp, Year, Month, Day, Hour, Minute, Second, Observatory, Instrument, Detector, Measurement, Extension)
						Cursor.execute(sqlquery)
					#else:
					#	print e.args[1]		

Cursor.close()
