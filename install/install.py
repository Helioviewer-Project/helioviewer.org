#!/usr/bin/python
# -*- coding: utf-8 -*-

###############################################################################
# Helioviewer Database Installation Tool
# Last Updated: 2009/12/16
#
# TODO 01/17/2010:
#    Let user specify dbname
#    Add clarification regarding which username is expected and what it's used for
#    Udpate graphical installer to reflect changes to text installer
#
###############################################################################
import sys
from optparse import OptionParser, OptionError, IndentedHelpFormatter

def main(argv):
    ''' Main application access point '''
    options = getArguments()
    
    # Installation method
    if options.textinstall:
        from org.helioviewer.HelioviewerConsoleInstaller import loadTextInstaller
        loadTextInstaller(options)
    elif options.update:
        #from org.helioviewer.HelioviewerConsoleInstaller import loadUpdater
        print options.files
    else:
        try:
            import PyQt4
        except:
            from org.helioviewer.HelioviewerConsoleInstaller import loadTextInstaller
            loadTextInstaller(options)
        else:
            from org.helioviewer.HelioviewerInstallWizard import loadGUIInstaller
            loadGUIInstaller(argv, options.debug)
        
def getArguments():
    ''' Gets command-line arguments and handles validation '''
    parser = OptionParser("%prog [options] [file1 file2 file3...]", formatter=IndentedHelpFormatter(4,80))
    parser.add_option("-t", "--text-install", dest="textinstall", help="launches the text-based installation tool", action="store_true")
    parser.add_option("--update", dest="update", help="adds images to an existing database", action="store_true")
    parser.add_option("-d", "--database-name", dest="dbname", help="Database to insert images into")
    parser.add_option("-u", "--database-user", dest="dbuser", help="Helioviewer.org database user")
    parser.add_option("-p", "--database-pass", dest="dbpass", help="Helioviewer.org database password")
    parser.add_option("--debug", dest="debug", help="enables logging of errors to a file", action="store_true")
    
    try:                                
        options, args = parser.parse_args()
                    
    except:
        sys.exit(2)
        
    # update-mode
    if options.update:
        if len(args) == 0:
            print "No files to process. Exiting installer."
            sys.exit(2)
        else:
            options.files = args

    return options

if __name__ == '__main__':
	main(sys.argv)
    