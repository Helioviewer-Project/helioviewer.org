"""Local data browser"""
import os
from helioviewer.hvpull.browser.basebrowser import BaseDataBrowser

class LocalDataBrowser(BaseDataBrowser):
    def __init__(self, server):
        BaseDataBrowser.__init__(self, server)

    def get_directories(self,uri):
        """Get a list of directories at the passed uri"""
        return self.server.compute_directories(start_date, end_date)
  
    def get_files(self, uri, extension):
        """Get all the files that end with specified extension at the uri"""
        # ensure the location has the correct suffix
        if os.path.exists(uri):
            return [os.path.join(uri,f) for f in os.listdir(uri)]
        else:
            return []
