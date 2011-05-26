#!/usr/bin/python                                                                                                
import os
import datetime
from numpy import std, median

# JPX lengths to create
lengths = [100,200,500,1000]

# month to run tests in (make sure there are no large gaps for interval that will be tested)
month   = 10

# Command template
cmd = 'kdu_merge -i `find %s -type f | head -%d | tr "\\n" "," | awk \'sub(",$", "")\'` -links -o output.jpx'

# Lists to keep track of query times
times = {}
for i in lengths:
    times[i] = []

# Run tests
for channel in [94,131,171,193,211,304,335,1600,1700,4500]:
    for day in xrange(1, 2 * len(lengths)):
        n = lengths[day % len(lengths)]

        dir = "/var/www/jp2/LATEST/AIA/%d/2010/%0.2d/%0.2d" % (channel, month, day)
 
        # run kdu_merge
        start = datetime.datetime.now()
        os.system(cmd % (dir, n))
        end = datetime.datetime.now()
        
        # time difference
        delta = end - start
        t = delta.seconds + delta.microseconds / 1000000.0

        times[n].append(t)

# print results
for querySize in times:
    l = times[querySize]
    avg   = sum(l) / len(l)
    med   = median(l)
    stdev = std(l)

    print "[n=%d] " % querySize
    print " mean  : %0.4fs\n median: %0.4fs\n stdev : %0.4fs\n\n" % (avg, med, stdev)


