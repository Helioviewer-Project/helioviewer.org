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

def main():
    '''Main application access point'''
    try:
        import PyQt4
        import installer.gui
        installer.gui.install()
    except Exception as e:
        from installer.console import HelioviewerConsoleInstaller
        app = HelioviewerConsoleInstaller()

if __name__ == '__main__':
    sys.exit(main())
