# -*- coding: utf-8 -*-

# Form implementation generated from reading ui file 'InstallDialog.ui'
#
# Created: Wed Aug 19 16:27:04 2009
#      by: PyQt4 UI code generator 4.5.2
#
# WARNING! All changes made in this file will be lost!

from PyQt4 import QtCore, QtGui

class Ui_InstallDialog(object):
    def setupUi(self, InstallDialog):
        InstallDialog.setObjectName("InstallDialog")
        InstallDialog.resize(566, 407)
        icon = QtGui.QIcon()
        icon.addPixmap(QtGui.QPixmap("hv.ico"), QtGui.QIcon.Normal, QtGui.QIcon.Off)
        InstallDialog.setWindowIcon(icon)
        InstallDialog.setSizeGripEnabled(False)
        InstallDialog.setModal(False)
        self.verticalLayout = QtGui.QVBoxLayout(InstallDialog)
        self.verticalLayout.setObjectName("verticalLayout")
        self.greetingLbl = QtGui.QLabel(InstallDialog)
        self.greetingLbl.setWordWrap(True)
        self.greetingLbl.setObjectName("greetingLbl")
        self.verticalLayout.addWidget(self.greetingLbl)
        self.gridLayout = QtGui.QGridLayout()
        self.gridLayout.setVerticalSpacing(10)
        self.gridLayout.setObjectName("gridLayout")
        self.adminUsernameLbl = QtGui.QLabel(InstallDialog)
        self.adminUsernameLbl.setEnabled(True)
        sizePolicy = QtGui.QSizePolicy(QtGui.QSizePolicy.Fixed, QtGui.QSizePolicy.Preferred)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(self.adminUsernameLbl.sizePolicy().hasHeightForWidth())
        self.adminUsernameLbl.setSizePolicy(sizePolicy)
        self.adminUsernameLbl.setTextFormat(QtCore.Qt.AutoText)
        self.adminUsernameLbl.setAlignment(QtCore.Qt.AlignLeading|QtCore.Qt.AlignLeft|QtCore.Qt.AlignVCenter)
        self.adminUsernameLbl.setMargin(0)
        self.adminUsernameLbl.setObjectName("adminUsernameLbl")
        self.gridLayout.addWidget(self.adminUsernameLbl, 1, 0, 1, 1)
        self.hvPasswordLbl = QtGui.QLabel(InstallDialog)
        self.hvPasswordLbl.setObjectName("hvPasswordLbl")
        self.gridLayout.addWidget(self.hvPasswordLbl, 4, 0, 1, 1)
        self.hvUsernameLbl = QtGui.QLabel(InstallDialog)
        self.hvUsernameLbl.setObjectName("hvUsernameLbl")
        self.gridLayout.addWidget(self.hvUsernameLbl, 3, 0, 1, 1)
        self.adminPasswordLbl = QtGui.QLabel(InstallDialog)
        self.adminPasswordLbl.setObjectName("adminPasswordLbl")
        self.gridLayout.addWidget(self.adminPasswordLbl, 2, 0, 1, 1)
        self.adminUsernameInput = QtGui.QLineEdit(InstallDialog)
        sizePolicy = QtGui.QSizePolicy(QtGui.QSizePolicy.Fixed, QtGui.QSizePolicy.Fixed)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(self.adminUsernameInput.sizePolicy().hasHeightForWidth())
        self.adminUsernameInput.setSizePolicy(sizePolicy)
        self.adminUsernameInput.setObjectName("adminUsernameInput")
        self.gridLayout.addWidget(self.adminUsernameInput, 1, 1, 1, 1)
        self.adminPasswordInput = QtGui.QLineEdit(InstallDialog)
        sizePolicy = QtGui.QSizePolicy(QtGui.QSizePolicy.Fixed, QtGui.QSizePolicy.Fixed)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(self.adminPasswordInput.sizePolicy().hasHeightForWidth())
        self.adminPasswordInput.setSizePolicy(sizePolicy)
        self.adminPasswordInput.setEchoMode(QtGui.QLineEdit.Password)
        self.adminPasswordInput.setObjectName("adminPasswordInput")
        self.gridLayout.addWidget(self.adminPasswordInput, 2, 1, 1, 1)
        self.hvUsernamePassword = QtGui.QLineEdit(InstallDialog)
        sizePolicy = QtGui.QSizePolicy(QtGui.QSizePolicy.Fixed, QtGui.QSizePolicy.Fixed)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(self.hvUsernamePassword.sizePolicy().hasHeightForWidth())
        self.hvUsernamePassword.setSizePolicy(sizePolicy)
        self.hvUsernamePassword.setObjectName("hvUsernamePassword")
        self.gridLayout.addWidget(self.hvUsernamePassword, 4, 1, 1, 1)
        self.hvUsernameInput = QtGui.QLineEdit(InstallDialog)
        sizePolicy = QtGui.QSizePolicy(QtGui.QSizePolicy.Fixed, QtGui.QSizePolicy.Fixed)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(self.hvUsernameInput.sizePolicy().hasHeightForWidth())
        self.hvUsernameInput.setSizePolicy(sizePolicy)
        self.hvUsernameInput.setObjectName("hvUsernameInput")
        self.gridLayout.addWidget(self.hvUsernameInput, 3, 1, 1, 1)
        self.jp2RootDirLbl = QtGui.QLabel(InstallDialog)
        self.jp2RootDirLbl.setObjectName("jp2RootDirLbl")
        self.gridLayout.addWidget(self.jp2RootDirLbl, 0, 0, 1, 1)
        self.jp2RootDirInput = QtGui.QLineEdit(InstallDialog)
        self.jp2RootDirInput.setObjectName("jp2RootDirInput")
        self.gridLayout.addWidget(self.jp2RootDirInput, 0, 1, 1, 1)
        self.jp2BrowseBtn = QtGui.QPushButton(InstallDialog)
        sizePolicy = QtGui.QSizePolicy(QtGui.QSizePolicy.Minimum, QtGui.QSizePolicy.Fixed)
        sizePolicy.setHorizontalStretch(0)
        sizePolicy.setVerticalStretch(0)
        sizePolicy.setHeightForWidth(self.jp2BrowseBtn.sizePolicy().hasHeightForWidth())
        self.jp2BrowseBtn.setSizePolicy(sizePolicy)
        self.jp2BrowseBtn.setObjectName("jp2BrowseBtn")
        self.gridLayout.addWidget(self.jp2BrowseBtn, 0, 2, 1, 1)
        self.verticalLayout.addLayout(self.gridLayout)
        self.label = QtGui.QLabel(InstallDialog)
        self.label.setTextFormat(QtCore.Qt.RichText)
        self.label.setObjectName("label")
        self.verticalLayout.addWidget(self.label)
        self.progressBar = QtGui.QProgressBar(InstallDialog)
        self.progressBar.setEnabled(True)
        self.progressBar.setProperty("value", QtCore.QVariant(0))
        self.progressBar.setObjectName("progressBar")
        self.verticalLayout.addWidget(self.progressBar)
        self.horizontalLayout_2 = QtGui.QHBoxLayout()
        self.horizontalLayout_2.setObjectName("horizontalLayout_2")
        self.buttonBox = QtGui.QDialogButtonBox(InstallDialog)
        self.buttonBox.setOrientation(QtCore.Qt.Horizontal)
        self.buttonBox.setStandardButtons(QtGui.QDialogButtonBox.Cancel)
        self.buttonBox.setObjectName("buttonBox")
        self.horizontalLayout_2.addWidget(self.buttonBox)
        self.startBtn = QtGui.QPushButton(InstallDialog)
        self.startBtn.setFlat(False)
        self.startBtn.setObjectName("startBtn")
        self.horizontalLayout_2.addWidget(self.startBtn)
        self.verticalLayout.addLayout(self.horizontalLayout_2)

        self.retranslateUi(InstallDialog)
        QtCore.QObject.connect(self.buttonBox, QtCore.SIGNAL("accepted()"), InstallDialog.accept)
        QtCore.QObject.connect(self.buttonBox, QtCore.SIGNAL("rejected()"), InstallDialog.reject)
        QtCore.QMetaObject.connectSlotsByName(InstallDialog)

    def retranslateUi(self, InstallDialog):
        InstallDialog.setWindowTitle(QtGui.QApplication.translate("InstallDialog", "Helioviewer Database Installation", None, QtGui.QApplication.UnicodeUTF8))
        self.greetingLbl.setText(QtGui.QApplication.translate("InstallDialog", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:\'Sans\'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-weight:600;\">Helioviewer Database Population Script 0.99.5</span></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-style:italic;\">Last updated: 2009/08/19</span></p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px; font-style:italic;\"></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">This script processes JP2 images, extracts their associated meta-information and stores it away in a database.</p></body></html>", None, QtGui.QApplication.UnicodeUTF8))
        self.adminUsernameLbl.setText(QtGui.QApplication.translate("InstallDialog", "Database Administrator Username", None, QtGui.QApplication.UnicodeUTF8))
        self.hvPasswordLbl.setText(QtGui.QApplication.translate("InstallDialog", "New Database User Password", None, QtGui.QApplication.UnicodeUTF8))
        self.hvUsernameLbl.setText(QtGui.QApplication.translate("InstallDialog", "New Database Username", None, QtGui.QApplication.UnicodeUTF8))
        self.adminPasswordLbl.setText(QtGui.QApplication.translate("InstallDialog", "Database Administrator Password", None, QtGui.QApplication.UnicodeUTF8))
        self.adminUsernameInput.setToolTip(QtGui.QApplication.translate("InstallDialog", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:\'Sans\'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-weight:600;\">Database Administrator Username</span></p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px; font-weight:600;\"></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Please enter a username which has administrative priveleges to the database. This will be used in order to create the Helioviewer database schema and users with access to the schema.</p></body></html>", None, QtGui.QApplication.UnicodeUTF8))
        self.adminUsernameInput.setText(QtGui.QApplication.translate("InstallDialog", "root", None, QtGui.QApplication.UnicodeUTF8))
        self.adminPasswordInput.setToolTip(QtGui.QApplication.translate("InstallDialog", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:\'Sans\'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-weight:600;\">Database Administrator Password</span></p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px; font-weight:600;\"></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">Password for the above database administrator.</p></body></html>", None, QtGui.QApplication.UnicodeUTF8))
        self.hvUsernamePassword.setToolTip(QtGui.QApplication.translate("InstallDialog", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:\'Sans\'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-weight:600;\">New Database User Password</span></p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px; font-weight:600;\"></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">The password to use for the new database user.</p></body></html>", None, QtGui.QApplication.UnicodeUTF8))
        self.hvUsernamePassword.setText(QtGui.QApplication.translate("InstallDialog", "helioviewer", None, QtGui.QApplication.UnicodeUTF8))
        self.hvUsernameInput.setToolTip(QtGui.QApplication.translate("InstallDialog", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:\'Sans\'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-weight:600;\">New Database Username</span></p>\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px; font-weight:600;\"></p>\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\">This is the username you want to use to access the Helioviewer back-end. It used by the query API\'s to interact with the database.</p></body></html>", None, QtGui.QApplication.UnicodeUTF8))
        self.hvUsernameInput.setText(QtGui.QApplication.translate("InstallDialog", "helioviewer", None, QtGui.QApplication.UnicodeUTF8))
        self.jp2RootDirLbl.setText(QtGui.QApplication.translate("InstallDialog", "JPEG 2000 Archive Root", None, QtGui.QApplication.UnicodeUTF8))
        self.jp2RootDirInput.setText(QtGui.QApplication.translate("InstallDialog", "/var/www/jp2", None, QtGui.QApplication.UnicodeUTF8))
        self.jp2BrowseBtn.setText(QtGui.QApplication.translate("InstallDialog", "Browse", None, QtGui.QApplication.UnicodeUTF8))
        self.label.setText(QtGui.QApplication.translate("InstallDialog", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:\'Sans\'; font-size:10pt; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-style:italic;\">Fill out above items and press \"OK\" to begin.</span></p></body></html>", None, QtGui.QApplication.UnicodeUTF8))
        self.startBtn.setText(QtGui.QApplication.translate("InstallDialog", "Start", None, QtGui.QApplication.UnicodeUTF8))

