#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""Helioviewer.org Status Information Conky Script

This script queries Helioviewer.org to find how far behind data is for
each instrument, and generates a small conky snippet to display the
results. This can be used with the conky execp/execpi commands, e.g.:

The net result should be similar to the information obtained when visiting
the Helioviewer.org status page at http://www.helioviewer.org/status.

Example usage:

  text_buffer_size 1024
  ${voffset 4}${execpi 5 ~/.conky/helioviewer_status.py}

"""
from urllib2 import urlopen
import json

# Conky formatting parameters'
# Better: allow user to specify as command-line arguments
CONKY_FONT = "DroidSansMono"
CONKY_FONT_SIZE = 7.6
CONKY_COLOR_NUM = 3
CONKY_VOFFSET = 0
CONKY_ALIGNC = 60

def main():
    """Main"""
    HV_QUERY_URL = "http://www.helioviewer.org/api/?action=getStatus"
    
    # Status icon colors
    colors = {
        1: "green",
        2: "yellow",
        3: "orange",
        4: "red",
        5: "gray"
    }

    # Query Helioviewer.org
    response = urlopen(HV_QUERY_URL).read()
    instruments = json.loads(response)
    
    # Generate conky snippet
    voffset = "${voffset %d}" % CONKY_VOFFSET
    font = "${font %s:size=%0.1f}" % (CONKY_FONT, CONKY_FONT_SIZE)
    color = "${color%d}" % CONKY_COLOR_NUM
    alignc = "${alignc %d}" % CONKY_ALIGNC

    # Iterate through instruments in sorted order
    iterator = iter(sorted(instruments.iteritems()))

    for inst, status in iterator:
        # Ignore non-active datasets (30 days or more behind real-time)
        if status['secondsBehind'] > (30 * 24 * 60 * 60):
            continue

        # Status icon
        icon = "${offset 3}${font Webdings:size=%0.1f}${color %s}n${font}  " % (CONKY_FONT_SIZE * 0.85, colors[status['level']])
        
        # Time
        if status['secondsBehind'] < (60 * 60):
            time = "%d minutes" % (status['secondsBehind'] / 60)
        elif status['secondsBehind'] < (24 * 60 * 60):
            time = "%0.1f hours" % (status['secondsBehind'] / (60 * 60.))
        else:
            time = "%0.1f days" % (status['secondsBehind'] / (24 * 60 * 60.))

        # Print snippet
        print (voffset + icon + font + color + alignc + inst + "${alignr}" + time  + "${font}")

if __name__ == '__main__':
    main()

