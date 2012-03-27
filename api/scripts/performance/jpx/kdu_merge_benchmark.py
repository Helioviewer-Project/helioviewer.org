#!/usr/bin/env python
"""
kdu_merge benchmarking script

Measures time required to generate variable-length JPX movies using AIA data.

To generate jpx on command-line, you can also use:

    kdu_merge -i `find /path/to/jp2s -type f | head -%d | tr "\\n" "," | \
    awk 'sub(",$", "")'` -links -o output.jpx

"""
import glob
import datetime
import subprocess
import numpy as np

# Settings
SIZES = [100, 200, 500, 1000]
WAVELENGTHS = [94, 131, 171, 193, 211, 304, 335, 1600, 1700, 4500]

# Lists to keep track of query times
times = {i:[] for i in SIZES}

# Generate JPX for each size at different wavelengths
for wavelength in WAVELENGTHS:
    for n in SIZES:
        # Get a list of JPEG 2000 images
        path = "/var/www/jp2/AIA/%d/2011/10/19/*.jp2" % wavelength
        
        files = glob.glob(path)[:n]        
 
        # Run kdu_merge
        args = ["kdu_merge", "-i", ",".join(files), "-links", "-o", "output.jpx"]
        process = subprocess.Popen(args, stdout=subprocess.PIPE)
        
        start = datetime.datetime.now()
        out, err = process.communicate()
        end = datetime.datetime.now()
        
        # Time difference
        delta = end - start
        t = delta.seconds + delta.microseconds / 1000000.0

        times[n].append(t)

# Print results
for query_size in times:
    subset = times[query_size]
    
    stats = (np.average(subset), np.median(subset), np.std(subset))
    
    print "[n=%d] " % query_size
    print " mean  : %0.4fs\n median: %0.4fs\n stdev : %0.4fs\n\n" % stats

