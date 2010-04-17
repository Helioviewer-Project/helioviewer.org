#!/usr/bin/env python
#-*- coding:utf-8 -*-

###############################################################################
# Helioviewer.org JPEG 2000 Ingestion Tool
# Last Updated: 2009/04/17
#
# This script is intended to help with the automated processing of new images
# for Helioviewer.org. The updater tool works by scanning a directory or set 
# of directories for jp2 images. Those images are then moved to the main
# archive and ingested into the database.
#
# In order for the script to function properly, the user executing the script
# must have read and write access to incoming files and also the directories
# in which they are stored. Since it's possible that images may be ingested
# from multiple sources, one strategy to accomplish this is to create a common
# group (e.g. "helioviewer") shared by both the user running update.py, and 
# by all users uploading new data.
#
# For example, as root:
#
#    groupadd helioviewer
#    usermod -a -G helioviewer user1
#    usermod -a -G helioviewer user2
#    
#    chown -R user1:helioviewer /home/user1/incoming
#    chown -R user2:helioviewer /home/user2/incoming
#
#    chmod -R 775  /home/user1/incoming /home/user2/incoming
#
# Note that the script currently does not check to see if the images to be
# processed already exist in the database. As such its important to make sure
# that only new images are placed in the directories to be processed.
###############################################################################
import sys,os,commands,shutil,time

def main(argv):
    ''' Processes incoming JP2 files and moves them to proper location '''
    installer   = "/var/www/install/install.py"
    destination = "/var/www/jp2/LATEST"
    dbname="hvdb"
    dbuser="helioviewer"
    dbpass="helioviewer"
    dbtype="mysql"

    dirs = ["/var/www/jp2/incoming/v0.8"]
    
    processIncomingImages(installer, destination, dirs, dbname, dbuser, dbpass, dbtype)

def processIncomingImages(installer, destination, dirs, dbname, dbuser, dbpass, dbtype):
    ''' Checks for new images and process/move to the JP2 archive specified '''
    
    # Temporary directory
    tmpdir = "/tmp/%d" % time.time()
    os.mkdir(tmpdir)
    
    # Move images to a temporary working directory
    for dir in dirs:
        getNewImages(dir, tmpdir)
        
    # Create a list of files to process
    allImages = traverseDirectory(tmpdir).replace(tmpdir, destination)
    
    numImages = len(allImages.split(" "))
    print "Found %d images." % numImages
    
    # Move files to main archive (shutil.move will not merge directories)
    status, output = commands.getstatusoutput("cp -r %s/* %s/" % (tmpdir, destination))
    
    print "Adding images to database."
    
    # If a large number of files are to be processed break-up to avoid exceeding command-line character limit
    if (numImages > 1000):
        images = chunks(allImages.split(" "), 1000)        
    else:
        images = [allImages]
        
    # Add to database
    for imageStr in images:
        cmd = "python %s --update -d %s -u %s -p %s -m %s -b %s %s" % (installer, dbname, dbuser, dbpass, dbtype, destination, imageStr)
        status, output = commands.getstatusoutput(cmd)

    # Remove tmpdir
    shutil.rmtree(tmpdir)
    
    print "Done!"

def getNewImages(incoming, tmpdir):
    ''' Finds any new images and move them to a specified working directory to be processed '''
    subdirs = os.listdir(incoming)
    
    # Don't do anything unless there are files to process
    if len(subdirs) is 0:
        return
    
    for subdir in subdirs:
        shutil.move(incoming + "/" + subdir, tmpdir + "/" + subdir)
    
def traverseDirectory(path):
    ''' Traverses file-tree starting with the specified path and builds  
        space-separated string containing the list of files matched '''
    images = ""

    for child in os.listdir(path):
        node = os.path.join(path, child)
        if os.path.isdir(node):
            newImgs = traverseDirectory(node)
            images += newImgs
        else:
            if node[-3:] == "jp2":
                images += node + " "

    return images

def chunks(l, n):
    """ http://stackoverflow.com/questions/312443/how-do-you-split-a-list-into-evenly-sized-chunks-in-python """
    for i in xrange(0, len(l), n):
        yield l[i:i+n]

if __name__ == '__main__':
    main(sys.argv)