"""Local data browser"""
import os
from helioviewer.downloader.browser.basebrowser import BaseDataBrowser

class LocalDataBrowser(BaseDataBrowser):
    def __init__(self, uri):
        BaseDataBrowser.__init__(self, uri)

    def get_directories(self,uri):
        """Get a list of directories at the passed uri"""
        return self.get_files(uri, "jp2")
  
    def get_files(self, uri, extension):
        """Get all the files that end with specified extension at the uri"""
        # ensure the location has the correct suffix
        if os.path.exists(uri):
            return os.listdir(uri)
        else:
            return []
