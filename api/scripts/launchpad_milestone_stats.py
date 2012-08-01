#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Helioviewer.org Launchpad Stats

keith.hughitt@nasa.gov
2012/04/25

Queries Helioviewer Launchpad Milestone and returns some basic statistics about
the bugs including the number of fixed bugs and the average time until they
were marked as committed.

Default behavior: display stats for the three most recent milestones. If a
number "n" is passed in as an argument, then the n most recent milestones
will be displayed. 

This script assumes that all bugs have been marked as released.

Example usage:
    python launchpad_milestone_stats.py
    python launchpad_milestone_stats.py 1

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
    # Print Greeting
    print_greeting()

    # Connect to Launchpad
    project = get_launchpad_project()

    # Get milestones in descending order
    milestones = project.all_milestones.entries
    milestones = sorted(milestones, key=lambda m: m['name'], reverse=True)
    
    # Display stats n most recent milestones
    if len(sys.argv) > 1:
        n = int(sys.argv[1])
    else:
        n = 3
        
    milestones = milestones[:n]
    milestones.reverse()
    
    # Display milestone stats
    for m in milestones:
        milestone = project.getMilestone(name=m['name'])
        print_milestone_stats(milestone)
    
def print_greeting():
    print("========================================")
    print("= Helioviewer.org Milestone Statistics")
    print("= " + str(datetime.datetime.now()))
    print("========================================\n")
    
def get_launchpad_project():
    cachedir = "/home/%s/.launchpadlib/cache/" % getpass.getuser()
    
    # Connect to Launchpad
    launchpad = Launchpad.login_anonymously('helioviewer', 'edge', cachedir)
    return launchpad.projects['helioviewer.org']
    
def print_milestone_stats(milestone):
    """Prints stats for a particular milestone"""
    print("#" * 40)
    print("#")
    print("# MILESTONE %s" % milestone.name)
    print("#")
    print("#" * 40)
    print("# Overview:")

    # Get tasks associated with milestone
    num_bugs = 0
    committed = []
    
    for status in ['New', 'Fix Committed', 'Fix Released']:
        bugs = milestone.searchTasks(status=status)
        num_bugs += bugs.total_size 
        print("#%14s: %2d" % (status, bugs.total_size))
        
        # Committed bugs
        if status != "New":
            committed += bugs

    print("#%14s: %2d" % ("TOTAL", num_bugs))
    print("#")
    
    print_commit_stats(committed)
    print("#" * 40)
    print("\n\n")
    
def print_commit_stats(bugs):
    """Prints stats for bugs that have been marked as having a fix comitted
    """
    print("# Commit statistics:")
    print("#")
    
    # Committed
    deltas = []
    
    for bug in bugs:
        dt = bug.date_fix_committed - bug.date_created
        deltas.append(dt.total_seconds() / (60 * 60 * 24))

    # Make sure at least some bugs have been commited
    if len(deltas) is 0:
        print ("#%14s" % "N/A")
    else:
        # Print min, max and average times to fix being committed
        print("#%20s: %0.2f days" % ("Avg commit time", numpy.average(deltas)))
        print("#%20s: %0.2f days" % ("Min", numpy.min(deltas)))
        print("#%20s: %0.2f days" % ("Max", numpy.max(deltas)))
        print("#")

if __name__ == '__main__':
    sys.exit(main())
