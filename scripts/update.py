#!/usr/bin/env python
#-*- coding:utf-8 -*-

###############################################################################
# Helioviewer.org JPEG 2000 Ingestion Tool
# Last Updated: 2009/07/16
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
    destination = "/var/www/jp2/v0.8"
    dbname="hvdb"
    dbuser="helioviewer"
    dbpass="helioviewer"
    dbtype="mysql"

    dirs = ["/home/user/incoming/v0.8/jp2"]
    
    for dir in dirs:
        processIncomingImages(installer, destination, dir, dbname, dbuser, dbpass, dbtype)
        
    print "Done!"

def processIncomingImages(installer, destination, dir, dbname, dbuser, dbpass, dbtype):
    ''' Checks for new images and process/move to the JP2 archive specified '''
        
    # Get a list of files to process
    allImages = traverseDirectory(dir)
    
    numImages = len(allImages)
    print "Found %d images in %s." % (numImages, dir)
    
    if numImages is 0:
        return
        
    destFiles = []
        
    # Determine how long base directory is in order to get a relative path
    lenDir = len(dir)
    
    if dir[-1] != "/":
         lenDir += 1    
    
    # Move files to main archive
    for file in allImages:
        dest = os.path.join(destination, file[lenDir:])
        destFiles.append(dest)

        d = os.path.dirname(dest)
        
        if not os.path.isdir(d):
            os.makedirs(d)

        shutil.move(file, dest)
    
    print "Adding images to database."
    
    # If a large number of files are to be processed break-up to avoid exceeding command-line character limit
    images = chunks(destFiles, 500)        
        
    '''
    for imageArr in images:
        from subprocess import Popen, PIPE
        cmd = ["python ", installer, "--update", "-d", dbname, "-u", dbuser, "-p", dbpass, "-m", dbtype, "-b", destination]
        cmd.extend(imageArr)
        proc   = Popen(cmd, stdout=PIPE, shell=False)
        output = proc.communicate()
    '''
        
    # Add to database
    for imageArr in images:
        imageStr = " ".join(imageArr)
        cmd = "python %s --update -d %s -u %s -p %s -m %s -b %s %s" % (installer, dbname, dbuser, dbpass.replace("$", "\$"), dbtype, destination, imageStr)
        status, output = commands.getstatusoutput(cmd)

def traverseDirectory(path):
    ''' Traverses file-tree starting with the specified path and builds a
        list of the available images '''
    images = []

    for child in os.listdir(path):
        node = os.path.join(path, child)
        if os.path.isdir(node):
            newImgs = traverseDirectory(node)
            images.extend(newImgs)
        else:
            if node[-3:] == "jp2":
                images.append(node)

    return images

def chunks(l, n):
    """ http://stackoverflow.com/questions/312443/how-do-you-split-a-list-into-evenly-sized-chunks-in-python """
    for i in xrange(0, len(l), n):
        yield l[i:i+n]

if __name__ == '__main__':
    main(sys.argv)