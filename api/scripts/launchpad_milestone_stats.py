#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Helioviewer.org Launchpad Stats

keith.hughitt@nasa.gov
2012/04/25

Queries Helioviewer Launchpad Milestone and returns some basic statistics about
the bugs including the number of fixed bugs and the average time until they
were marked as committed.

This script assumes that all bugs have been marked as released.

Resources:
 * https://launchpad.net/+apidoc/beta.html
 * https://help.launchpad.net/API/launchpadlib
"""
import sys
import numpy
import getpass
import datetime
from launchpadlib.launchpad import Launchpad

def main():
    # Check for milestone in input
    if len(sys.argv) > 1:
        milestone = sys.argv[1]
    
    cachedir = "/home/%s/.launchpadlib/cache/" % getpass.getuser()
    
    # Connect to Launchpad
    launchpad = Launchpad.login_anonymously('helioviewer', 'edge', cachedir)
    hv = launchpad.projects['helioviewer.org']

    # Get Milestone
    milestones = hv.all_milestones.entries

    print("Helioviewer.org Milestones:")
    for i, x in enumerate(milestones):
        print("%2d) %s" % (i + 1, x['name']))
    selection = int(raw_input("Select a milestone: "))
    
    milestone_name = milestones[selection - 1]['name']
    milestone = hv.getMilestone(name=milestone_name)
    
    # Print Greeting
    print("==========================================")
    print("Helioviewer.org Milestone %s Statistics" % milestone_name)
    print(str(datetime.datetime.now()))
    print("==========================================\n")
    print("BUGS:")

    # Get tasks associated with milestone
    num_bugs = 0
    committed = []
    
    for status in ['New', 'Fix Committed', 'Fix Released']:
        bugs = milestone.searchTasks(status=status)
        num_bugs += bugs.total_size 
        print("  %s: %d" % (status, bugs.total_size))
        
        # Committed bugs
        if status != "New":
            committed += bugs

    print("-----------------")
    print("Total: %d\n" % num_bugs)
    
    print("STATISTICS FOR COMMITTED BUGS:")
    print_commit_stats(committed)

    # To show a histogram...
    # import matplotlib.pyplot as plt
    # plt.hist(committed_deltas, 30)
    # plt.show()
    
def print_commit_stats(bugs):
    """Prints stats for bugs that have been marked as having a fix comitted
    """
    # Committed
    deltas = []
    
    for bug in bugs:
        dt = bug.date_fix_committed - bug.date_created
        deltas.append(dt.total_seconds() / (60 * 60 * 24))

    # Print min, max and average times to fix being committed
    print("  Average time to commit fix: %f days" % numpy.average(deltas))
    print("  Min: %f days" % numpy.min(deltas))
    print("  Max: %f days" % numpy.max(deltas))

if __name__ == '__main__':
    sys.exit(main())
