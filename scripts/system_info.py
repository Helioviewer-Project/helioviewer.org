#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Helioviewer.org System Information

Author: Keith Hughitt <keith.hughitt@nasa.gov>

Displays relevant system information that may be useful during installation
and trouble-shooting.
"""
import sys
import os
import re
import platform
import datetime
import subprocess

def main():
    """Helioviewer.org System Diagnostics"""
    print_greeting()
    check_platform()
    check_apache()
    check_mysql()
    check_php()
    check_python()
    check_kakadu()
    #check_ffmpeg
    
def check_platform():
    """Checks platform"""
    print("###########")
    print(" Platform")
    print("###########")
    
    system = platform.system()
    proc = platform.processor()
    
    # OS and architecture information
    if system == "Linux":
        distro = " ".join(platform.linux_distribution())
        print("OS: %s (Linux %s %s)" %  (distro, platform.release(), proc))
    elif system == "Darwin":
        print("OS: Mac OS X %s (%s)" %  (platform.mac_ver()[0], proc))
    elif system == "Windows":
        print("OS: Windows %s %s (%s)" %  (platform.release(), 
                                        platform.version(), proc))
    else:
        print ("Unknown OS (%s)" % proc)

    print ""
        
def check_apache():
    """Checks Apache version"""
    print("###########")
    print(" Apache")
    print("###########")
    
    if which("apache2") is not None:
        apache_name = "apache2"
    elif which("httpd") is not None:
        apache_name = "httpd"
    else:
        print "Apache: NOT FOUND\n"
        return
    
    p = subprocess.Popen([apache_name, "-v"], stdout=subprocess.PIPE)
    out, err = p.communicate()
    print out.split("\n")[0] + "\n"
    
def check_mysql():
    """Checks MySQL version"""
    print("###########")
    print(" MySQL")
    print("###########")
    p = subprocess.Popen(["mysql", "--version"], stdout=subprocess.PIPE)
    out, err = p.communicate()
    print out
        
def check_php():
    """Prints PHP support information"""
    print("###########")
    print(" PHP")
    print("###########")
    
    p = subprocess.Popen(["php", "-version"], stdout=subprocess.PIPE)
    out, err = p.communicate()
    print out.split("\n")[0]
    
    p = subprocess.Popen(["php", "-i"], stdout=subprocess.PIPE)
    phpinfo, err = p.communicate()
    
    pattern = re.compile("imagick module version => ([\d\.]*)")
    print ("Imagick: %s" % pattern.search(phpinfo).group(1))
    
    pattern = re.compile("GD Version => ([\d\.]*)")
    print ("GD: %s" % pattern.search(phpinfo).group(1))
    
    if phpinfo.find('mysqli') != -1:
        print("MySQLi: supported")
    else:
        print("MySQLi: NOT FOUND")
    
    # Zend Gdata?
    
def check_python():
    """Checks Python support"""
    print("###########")
    print(" Python")
    print("###########")
        
    # Python version
    arch = platform.architecture()[0]
    print("Python %s (%s)" % (platform.python_version(), arch))
    
    try:
        from MySQLdb import __version__ as mysqldb_version
    except ImportError:
        mysqldb_version = "NOT INSTALLED"
        
    try:
        from numpy import __version__ as numpy_version
    except ImportError:
        numpy_version = "NOT INSTALLED"

    try:
        from scipy import __version__ as scipy_version
    except ImportError:
        scipy_version = "NOT INSTALLED"
        
    try:
        from matplotlib import __version__ as matplotlib_version
    except ImportError:
        matplotlib_version = "NOT INSTALLED"
        
    try:
        from PyQt4.QtCore import PYQT_VERSION_STR as pyqt_version
    except ImportError:
        pyqt_version = "NOT INSTALLED"
        
    print("MySQLdb: %s" % mysqldb_version)
    print("NumPy: %s" % numpy_version)
    print("SciPy: %s" % scipy_version)
    print("Matplotlib: %s" % matplotlib_version)
    print("PyQt: %s\n" % pyqt_version)

def check_kakadu():
    """Checks Kakadu support"""
    print("###########")
    print(" Kakadu")
    print("###########")
    
    if os.name is "nt":
        kdu_expand = "kdu_expand.exe"
        kdu_merge = "kdu_merge.exe"
    else:
        kdu_expand = "kdu_expand"
        kdu_merge = "kdu_merge"
        
    pattern = re.compile("v[\d\.]+")

    if which(kdu_expand) is None:
        kdu_expand_version = "NOT FOUND"
    else:
        p = subprocess.Popen([kdu_expand, "-version"], stdout=subprocess.PIPE)
        out, err = p.communicate()
        kdu_expand_version = pattern.search(out).group(0)
    
    if which(kdu_merge) is None:
        kdu_merge_version = "NOT FOUND"
    else:
        p = subprocess.Popen([kdu_merge, "-version"], stdout=subprocess.PIPE)
        out, err = p.communicate()
        kdu_merge_version = pattern.search(out).group(0)

    print("kdu_expand: %s" % kdu_expand_version)
    print("kdu_merge: %s\n" % kdu_merge_version)
    
def print_greeting():
    """Prints greeting banner"""
    print("==========================================================")
    print(" Helioviewer.org System Information\n")
    print(" " + datetime.datetime.utcnow().strftime("%A, %d. %B %Y %I:%M%p UT"))
    print("==========================================================\n")
    
def which(program):
    """Checks for existence of executable
    
    Source: http://stackoverflow.com/questions/377017/test-if-executable-exists-in-python/377028#377028
    """
    def is_exe(fpath):
        return os.path.exists(fpath) and os.access(fpath, os.X_OK)

    fpath, fname = os.path.split(program) #pylint: disable=W0612

    if fpath:
        if is_exe(program):
            return program
    else:
        for path in os.environ["PATH"].split(os.pathsep):
            exe_file = os.path.join(path, program)
            if is_exe(exe_file):
                return exe_file

    return None
    
    
if __name__ == "__main__":
    sys.exit(main());