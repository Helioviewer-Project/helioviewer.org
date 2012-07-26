#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""Helioviewer.org Status Information Conky Script

This script queries Helioviewer.org to find how far behind data is for
each instrument, and generates a small conky snippet to display the
results. This can be used with the conky execp/execpi commands, e.g.:



The net result should be similar to the information obtained when visiting
the Helioviewer.org status page at http://www.helioviewer.org/status.
"""
from urllib2 import urlopen
import json

# Conky formatting parameters
CONKY_FONT = "DroidSansMono"
CONKY_FONT_SIZE = 7.6
CONKY_COLOR_NUM = 3
CONKY_VOFFSET = 0
CONKY_ALIGNC = 60

def main():
    """Main"""
    HV_QUERY_URL = "http://www.helioviewer.org/api/?action=getStatus"

    # Query Helioviewer.org
    response = urlopen(HV_QUERY_URL).read()
    instruments = json.loads(response)

    # Sort results by instrument

    
    # Generate conky snippet
    voffset = "${voffset %d}" % CONKY_VOFFSET
    font = "${font %s:size=%0.1f}" % (CONKY_FONT, CONKY_FONT_SIZE)
    color = "${color%d}" % CONKY_COLOR_NUM
    alignc = "${alignc %d}" % CONKY_ALIGNC

    for inst, status in instruments.items():
        # Ignore non-active datasets (30 days or more behind real-time)
        if status['secondsBehind'] > (30 * 24 * 60 * 60):
            continue

        #icon = "${font WingDings}${color green}n${font}"
        # Icon and time string
        icon = "${color green}O"
        time = "%d Minutes Behind" % (status['secondsBehind'] / 60)

        # Print snippet
        print (voffset + icon + font + color + alignc + inst + ": " +
               str(status['level']) + " - " + time  + "${font}")

if __name__ == '__main__':
    main()

