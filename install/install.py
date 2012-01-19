#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Helioviewer Database Installation Tool

Last Updated: 2012/01/19

TODO 01/17/2010:
* Let user specify dbname
* Add clarification regarding which username is expected and what it's used for
* Udpate graphical installer to reflect changes to text installer
"""
import sys
from optparse import OptionParser, OptionError, IndentedHelpFormatter

def main(argv):
    '''Main application access point'''
    options = get_arguments()
    
    # Installation method
    if options.textinstall:
        import helioviewer.installer.console
        helioviewer.installer.console.install(options)
    elif options.update:
        import helioviewer.installer.console
        helioviewer.installer.console.update(options)
    else:
        # Look for Qt support
        try:
            import PyQt4
        except:
            import helioviewer.installer.console
            helioviewer.installer.console.install(options)
        else:
            import helioviewer.installer.gui
            helioviewer.installer.gui.install(options)
        
def get_arguments():
    ''' Gets command-line arguments and handles validation '''
    parser = OptionParser("%prog [options] [file1 file2 file3...]",
                          formatter=IndentedHelpFormatter(4,100))
    
    parser.add_option("-t", "--text-install", dest="textinstall", 
                      help="Text-based installation", action="store_true")
    parser.add_option("-m", "--database-type", dest="dbtype",
                      help="Database [mysql|postgres]", default="mysql")
    parser.add_option("-d", "--database-name", dest="dbname",
                      help="Database to insert images into")
    parser.add_option("-u", "--database-user", dest="dbuser",
                      help="Helioviewer.org database user")
    parser.add_option("-p", "--database-pass", dest="dbpass",
                      help="Helioviewer.org database password")
    parser.add_option("-b", "--base-dir", dest="basedir",
                      help="Base directory containing files to process")
    parser.add_option("--update", dest="update",
                      help="adds images to an existing database",
                      action="store_true")
    
    try:                                
        options, args = parser.parse_args()
                    
    except:
        sys.exit(2)
        
    # Updates only deal with processing new images
    if options.update:
        if len(args) == 0:
            print("No files to process. Exiting installer.")
            sys.exit(2)
        else:
            options.files = args
    return options

if __name__ == '__main__':
	main(sys.argv)
