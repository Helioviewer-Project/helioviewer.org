#!/usr/bin/python

###############################################################################
# Helioviewer Database Installation Tool
# Last Updated: 2009/08/24
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
    else:
        from org.helioviewer.HelioviewerInstallWizard import loadGUIInstaller
        loadGUIInstaller(argv)
        
def getArguments():
    ''' Gets command-line arguments and handles validation '''
    parser = OptionParser("%prog [options]", formatter=IndentedHelpFormatter(4,80))
    parser.add_option("-t", "--text-install", dest="textinstall", help="launches the text-based installation tool", action="store_true")
    
    try:                                
        options, args = parser.parse_args()
                    
    except:
        sys.exit(2)

    return options

if __name__ == '__main__':
	main(sys.argv)
    