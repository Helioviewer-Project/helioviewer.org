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
        import helioviewer.installer.gui
        helioviewer.installer.gui.install()
    except:
        import helioviewer.installer.console
        helioviewer.installer.console.install()

if __name__ == '__main__':
    sys.exit(main())
