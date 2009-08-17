# -*- coding: utf-8 -*-
import threading
import MySQLdb
import pgdb
import timeit
from datetime import datetime, timedelta
from time import clock

class QueryThread ( threading.Thread ):

    def __init__ ( self, dbname, dbuser, dbpass, postgres, timingmethod, multipleconnections, tname, dates, times, results ):
        self.dates   = dates
        self.times   = times
        self.results = results
        self.tmethod = timingmethod
        self.dbname  = dbname
        self.dbuser  = dbuser
        self.dbpass  = dbpass
        self.tname   = tname
        self.postgres= postgres

        self.multiconnect = multipleconnections
        
        # connect to db
        if postgres:
            db = pgdb.connect(database = dbname, user = dbuser, password = dbpass)
        else:
            db = MySQLdb.connect(db = dbname, user = dbuser, passwd = dbpass)
        
        self.cursor = db.cursor()

        # initialize parent constructor
        threading.Thread.__init__ ( self )
    
    def run ( self ):
        global cursor, tname, postgres, multipleconnections, dbname, dbuser, dbpass, d
        
        cursor   = self.cursor
        dbname   = self.dbname
        dbuser   = self.dbuser
        dbpass   = self.dbpass
        tname    = self.tname
        postgres = self.postgres
        multipleconnections = self.multiconnect
        
        while len(self.dates) > 0:
            d = self.dates.pop()
           
            print len(self.dates)
           
            # Timing method #1: now
            if self.tmethod == "now":
                start = datetime.now()
                self.query()
                end = datetime.now()
                delta = end - start
                executiontime = delta.seconds + delta.microseconds / 1000000.0
                
            # Timing method #2: now
            elif self.tmethod == "clock":
                start = clock()
                self.query()
                end = clock()
                executiontime = end - start
                
            # Timing method #3 timeit
            else:
                t = timeit.Timer("QueryThread.query()", "from querythread import QueryThread")
                executiontime = t.timeit(1)
                
            self.times.append(executiontime)
            self.results.append({"time": executiontime, "query": d})

    @classmethod
    def query ( self ):
        if multipleconnections:
            if postgres:
                db = pgdb.connect(database = dbname, user = dbuser, password = dbpass)
            else:
                db = MySQLdb.connect(db = dbname, user = dbuser, passwd = dbpass)
            querycursor = db.cursor()
        else:
            querycursor = cursor
            
        querycursor.execute("SELECT * FROM %s WHERE timestamp < '%s' ORDER BY timestamp DESC LIMIT 1;" % (tname, d))
        