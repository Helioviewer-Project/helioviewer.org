# -*- coding: utf-8 -*-
import os

def check_modules(modules):
    '''Checks for required modules
    
    Checks for module's existence and attempts to suggest a possible solution 
    for any mising module required
    '''
    missing = []

    for module in modules:
        try:
            exec "import %s" % module
            exec "del %s" % module
        except ImportError:
            missing.append(module)

    # If there are any missing modules, suggest a method for installation and exit
    if len(missing) > 0:
        # Error message
        print "[Error] Unable to find module(s):",
        for m in missing:
            print " " + m,
        print ""

        # Determine OS
        system = get_os()

        knownpackages = True

        # Fedora
        if (system == "fedora"):
            msg = "To install, use the following command:\n"
            msg += "    su -c \"yum check-update; yum install"

            for m in missing:
                if m == "MySQLdb":
                    msg += " MySQL-python"
                elif m == "qt":
                    msg += " PyQT"
                else:
                    knownpackages = False

            msg += "\"";

        # Ubuntu    
        elif (system == "ubuntu"):
            msg = "To install, use the following command:"
            msg += "    sudo apt-get update; sudo apt-get install"

            for m in missing:
                if m == "MySQLdb":
                    msg += " python-mysqldb"
                elif m == "qt":
                    msg += " python-qt3"
                else:
                    knownpackages = False

        else:
            msg = "Please install these modules before continuing."

        if not knownpackages:
            msg = "Please install these modules before continuing."

        print msg
        sys.exit(2)

def get_os():
    '''Attempt to determine OS in order to suggest module installation method'''
    if os.uname()[3].lower().find("ubuntu") != -1:
        return "ubuntu"
    elif os.uname()[2].find("fc") != -1:
        return "fedora"
    else:
        return "other"
