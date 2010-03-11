#!/usr/bin/env python
#-*- coding:utf-8 -*-
import sys,os,commands,shutil,time

def main(argv):
    ''' Processes incomning JP2 files and moves them to proper location '''
    archive = "/var/www/jp2/v0.8"
    dbname="hvdb"
    dbuser="helioviewer"
    dbpass="helioviewer"
    dbtype="mysql"

    dirs = ["/var/www/jp2/v0.8/inc"]
    
    processIncomingImages(archive, dirs, dbname, dbuser, dbpass, dbtype)

def processIncomingImages(archive, dirs, dbname, dbuser, dbpass, dbtype):
    ''' Checks for new images and process/move to the JP2 archive specified '''
    
    # Temporary directory
    tmpdir = "/tmp/%d" % time.time()
    os.mkdir(tmpdir)
    
    # Move images to a temporary working directory
    for dir in dirs:
        getNewImages(dir, tmpdir)
        
    # Create a list of files to process
    images = traverseDirectory(tmpdir).replace(tmpdir, archive)
    
    # Move files to main archive
    for subdir in os.listdir(tmpdir):
        shutil.move(tmpdir + "/" + subdir, archive + "/" + subdir)
    
    # Process
    cmd = "python ../install/install.py --update -d %s -u %s -p %s -m %s -b %s %s" % (dbname, dbuser, dbpass, dbtype, archive, images)
    status, output = commands.getstatusoutput(cmd)

    # Remove tmpdir
    os.rmdir(tmpdir)

def getNewImages(incoming, tmpdir):
    ''' Finds any new images and move them to a specified working directory to be processed '''
    subdirs = os.listdir(incoming)
    
    # Don't do anything unless there are files to pro
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

if __name__ == '__main__':
    main(sys.argv)