# -*- coding: utf-8 -*-
import sys
from PyQt4 import QtCore, QtGui
from org.helioviewer.InstallWizard import Ui_InstallWizard
from org.helioviewer.jp2 import *
from org.helioviewer.db  import *
from org.helioviewer.utils import *

__INTRO_PAGE__ = 0
__DBADMIN_PAGE__ = 1
__HVDB_PAGE__ = 2
__JP2DIR_PAGE__ = 3
__INSTALL_PAGE__ = 4
__FINISH_PAGE__ = 5

__STEP_FXN_THROTTLE__ = 50

#
# Main Application Window
#
# TODO (2009/08/21): Generate setup/Config.php and copy/move API files into proper location.
# TODO (2009/08/21): Add checks: 1. db exists, 2. no images found
#
class HelioviewerInstallWizard(QtGui.QWizard):

    def __init__(self, parent=None):
        QtGui.QWidget.__init__(self, parent)
        self.ui = Ui_InstallWizard()
        self.ui.setupUi(self)        
        
        self.logfile = open("error.log", "a")
        
        self.installComplete = False
        
        self.postSetup()
        self.initEvents()

    def postSetup(self):
        self.setPixmap(QtGui.QWizard.LogoPixmap, QtGui.QPixmap(":/Logos/color.png"))
        self.setupValidators()


    def setupValidators(self):
        # Mandatory fields
        self.ui.dbAdminPage.registerField("dbAdminUserName*", self.ui.dbAdminUserName)
        self.ui.dbAdminPage.registerField("dbAdminPassword*", self.ui.dbAdminPassword)
        self.ui.hvDatabaseSetupPage.registerField("hvUserName*", self.ui.hvUserName)
        self.ui.hvDatabaseSetupPage.registerField("hvPassword*", self.ui.hvPassword)

        alphanum = QtGui.QRegExpValidator(QtCore.QRegExp("[\w]*"), self)
        passwd   = QtGui.QRegExpValidator(QtCore.QRegExp("[\w!@#\$%\^&\*\(\)_\+\.,\?'\"]*"), self)

        # DB Admin Info
        self.ui.dbAdminUserName.setValidator(alphanum)
        self.ui.dbAdminPassword.setValidator(passwd)
        self.ui.hvUserName.setValidator(alphanum)
        self.ui.hvPassword.setValidator(passwd)


    def initializePage(self, page):
        if page is __INSTALL_PAGE__:
            jp2dir = str(self.ui.jp2RootDirInput.text())
            
            self.ui.statusMsg.setText("Searching for JPEG 2000 Images...")
            self.images = traverseDirectory(jp2dir)
            n = len(self.images)

            if n is 0:
                print "No JPEG 2000 images found. Exiting installation."
                sys.exit(2)
            else:
                self.ui.installProgress.setMaximum(n // __STEP_FXN_THROTTLE__)
                self.ui.statusMsg.setText("""\
Found %d JPEG2000 images.

If this is correct, please press "Start" to begin processing.
                """ % n)
            #self.processImages()

    def validateCurrentPage(self):
        ''' Validates information for a given page '''
        page = self.currentId()

        #print "Validating page %s" % str(page)

        # Database type & administrator information
        if page is __DBADMIN_PAGE__:
            canConnect = checkDBInfo(str(self.ui.dbAdminUserName.text()), str(self.ui.dbAdminPassword.text()), self.ui.mysqlRadioBtn.isChecked())
            if not canConnect:
                self.ui.dbAdminStatus.setText("<span style='color: red;'>Unable to connect to the database. Please check your login information and try again.</span>")
            else:
                self.ui.dbAdminStatus.clear()
            return canConnect

        # JP2 Archive location
        elif page is __JP2DIR_PAGE__:
            pathExists = checkPath(self.ui.jp2RootDirInput.text())
            if not pathExists:
                self.ui.jp2ArchiveStatus.setText("<span style='color: red;'>Not a valid location. Please check the filepath and permissions and try again.</span>")
            else:
                self.ui.jp2ArchiveStatus.clear()
            return pathExists
        
        # Install page
        elif page is __INSTALL_PAGE__:
            return self.installComplete

        # No validation required
        else:
            return True

    def processImages(self):
        ''' Process JPEG 2000 archive and enter information into the database '''
        admin, adminpass, hvuser, hvpass, jp2dir, mysql = self.getFormFields()

        self.ui.statusMsg.setText("Creating database schema")

        dbname = "helioviewer"

        cursor = setupDatabaseSchema(admin, adminpass, dbname, hvuser, hvpass, mysql)

        processJPEG2000Images(self.images, jp2dir, cursor, mysql, self.updateProgress)
    
        cursor.close()
        #self.ui.installProgress.setValue(len(images))
    
        self.ui.statusMsg.setText("Finished!")
        self.installComplete = True
    
    def updateProgress(self, img):
        value = self.ui.installProgress.value() + 1
        self.ui.installProgress.setValue(value)
        self.ui.statusMsg.setText("Processing image:\n    %s" % img)

    def getFormFields(self):
        ''' Grab form information '''
        mysql = self.ui.mysqlRadioBtn.isChecked()
        admin = str(self.ui.dbAdminUserName.text())
        adminpass = str(self.ui.dbAdminPassword.text())
        hvuser = str(self.ui.hvUserName.text())
        hvpass = str(self.ui.hvPassword.text())
        jp2dir = str(self.ui.jp2RootDirInput.text())

        return admin, adminpass, hvuser, hvpass, jp2dir, mysql

    def initEvents(self):
        QtCore.QObject.connect(self.ui.jp2BrowseBtn, QtCore.SIGNAL("clicked()"), self.openBrowseDialog)
        QtCore.QObject.connect(self.ui.startProcessingBtn, QtCore.SIGNAL("clicked()"), self.processImages)

    def openBrowseDialog(self):
        fd = QtGui.QFileDialog(self)
        directory = fd.getExistingDirectory()
        self.ui.jp2RootDirInput.setText(directory)

def loadGUIInstaller(args):
    ''' Load graphical installer '''
    app = QtGui.QApplication(sys.argv)
    win = HelioviewerInstallWizard()
    win.show()
    sys.exit(app.exec_())
