# -*- coding: utf-8 -*-
import sys
import math
import getpass
import sunpy
from PyQt4 import QtCore, QtGui
from helioviewer.installer.installwizard import Ui_InstallWizard
from helioviewer.jp2 import *
from helioviewer.db  import *

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
        
        self.setPixmap(QtGui.QWizard.LogoPixmap, QtGui.QPixmap(":/Logos/color.png"))
        
        self.logfile = open("failed.log", "a")
        self.install_finished = False
        
        self.setup_validators()
        self.init_events()

    def setup_validators(self):
        # Mandatory fields
        self.ui.dbAdminPage.registerField("dbAdminUserName*", self.ui.dbAdminUserName)
        self.ui.dbAdminPage.registerField("dbAdminPassword*", self.ui.dbAdminPassword)
        self.ui.hvDatabaseSetupPage.registerField("hvDatabaseName*", self.ui.hvDatabaseName)
        self.ui.hvDatabaseSetupPage.registerField("hvUserName*", self.ui.hvUserName)
        self.ui.hvDatabaseSetupPage.registerField("hvPassword*", self.ui.hvPassword)

        alphanum = QtGui.QRegExpValidator(QtCore.QRegExp("[\w$]*"), self)
        passwd = QtGui.QRegExpValidator(QtCore.QRegExp("[\w!@#\$%\^&\*\(\)_\+\.,\?'\"]*"), self)

        # DB Admin Info
        self.ui.dbAdminUserName.setValidator(alphanum)
        self.ui.dbAdminPassword.setValidator(passwd)
        self.ui.hvDatabaseName.setValidator(alphanum)
        self.ui.hvUserName.setValidator(alphanum)
        self.ui.hvPassword.setValidator(passwd)


    def initializePage(self, page):
        if page is __INSTALL_PAGE__:
            jp2dir = str(self.ui.jp2RootDirInput.text())
            
            self.ui.statusMsg.setText("Searching for JPEG 2000 Images...")
            
            # Locate jp2 images in specified filepath
            filepaths = find_images(jp2dir)
        
            # Extract image parameters
            self.images = []
            
            for filepath in filepaths:
                try:
                    image = sunpy.read_header(filepath)
                    image['filepath'] = filepath
                    self.images.append(image)
                except:
                    #raise BadImage("HEADER")
                    print("Skipping corrupt image: %s", 
                          os.path.basename(filepath))
                    continue

            n = len(self.images)

            if n == 0:
                print("No JPEG 2000 images found. Exiting installation.")
                sys.exit(2)
            else:
                self.ui.installProgress.setMaximum(n // __STEP_FXN_THROTTLE__)
                self.ui.statusMsg.setText("""\
Found %d JPEG2000 images.

If this is correct, please press "Start" to begin processing.
                """ % n)
            #self.process_images()

    def validateCurrentPage(self):
        ''' Validates information for a given page '''
        page = self.currentId()

        #print "Validating page %s" % str(page)

        # Database type & administrator information
        if page is __DBADMIN_PAGE__:
            canConnect = check_db_info(str(self.ui.dbAdminUserName.text()), str(self.ui.dbAdminPassword.text()), self.ui.mysqlRadioBtn.isChecked())
            if not canConnect:
                self.ui.dbAdminStatus.setText("<span style='color: red;'>Unable to connect to the database. Please check your login information and try again.</span>")
            else:
                self.ui.dbAdminStatus.clear()
            return canConnect

        # JP2 Archive location
        elif page is __JP2DIR_PAGE__:
            pathExists = os.path.isdir(self.ui.jp2RootDirInput.text())
            if not pathExists:
                self.ui.jp2ArchiveStatus.setText("<span style='color: red;'>Not a valid location. Please check the filepath and permissions and try again.</span>")
            else:
                self.ui.jp2ArchiveStatus.clear()
            return pathExists
        
        # Install page
        elif page is __INSTALL_PAGE__:
            return self.install_finished

        # No validation required
        else:
            return True

    def process_images(self):
        ''' Process JPEG 2000 archive and enter information into the database '''
        admin, adminpass, hvdb, hvuser, hvpass, jp2dir, mysql = self.get_form_fields()

        self.ui.startProcessingBtn.setEnabled(False)

        self.ui.statusMsg.setText("Creating database schema")

        cursor = setup_database_schema(admin, adminpass, hvdb, hvuser, hvpass, mysql)

        process_jp2_images(self.images, jp2dir, cursor, mysql, self.update_progress)
    
        cursor.close()
        #self.ui.installProgress.setValue(len(images))
    
        self.ui.statusMsg.setText("Finished!")
        self.install_finished = True
    
    def update_progress(self, img):
        value = self.ui.installProgress.value() + 1
        self.ui.installProgress.setValue(value)
        self.ui.statusMsg.setText("Processing image:\n    %s" % img)

    def get_form_fields(self):
        ''' Grab form information '''
        mysql = self.ui.mysqlRadioBtn.isChecked()
        admin = str(self.ui.dbAdminUserName.text())
        adminpass = str(self.ui.dbAdminPassword.text())
        hvdb   = str(self.ui.hvDatabaseName.text())
        hvuser = str(self.ui.hvUserName.text())
        hvpass = str(self.ui.hvPassword.text())
        jp2dir = str(self.ui.jp2RootDirInput.text())

        return admin, adminpass, hvdb, hvuser, hvpass, jp2dir, mysql

    def init_events(self):
        QtCore.QObject.connect(self.ui.jp2BrowseBtn, QtCore.SIGNAL("clicked()"), self.open_browse_dialog)
        QtCore.QObject.connect(self.ui.startProcessingBtn, QtCore.SIGNAL("clicked()"), self.process_images)

    def open_browse_dialog(self):
        fd = QtGui.QFileDialog(self)
        directory = fd.getExistingDirectory()
        self.ui.jp2RootDirInput.setText(directory)

def install():
    ''' Load graphical installer '''
    app = QtGui.QApplication(sys.argv)
    win = HelioviewerInstallWizard()
    win.show()
    sys.exit(app.exec_())
