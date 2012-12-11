"""Local data browser"""
import os
from helioviewer.hvpull.browser.basebrowser import BaseDataBrowser

class LocalDataBrowser(BaseDataBrowser):
    """Methods for acquiring data on a local file system."""
    def __init__(self, server):
        BaseDataBrowser.__init__(self, server)

    def get_directories(self,uri):
        """Get a list of directories at the passed uri"""
        return self.server.compute_directories(start_date, end_date)
  
    def get_files(self, uri, extension):
        """Get all the files that end with specified extension at the uri"""
        # ensure the location exists
        full_path = os.path.expanduser(uri)
        if os.path.exists(full_path):
            filenames = filter(lambda f: f.endswith("." + extension), 
                           os.listdir(full_path))
            files = [os.path.join(full_path,f) for f in filenames]
        else:
            files = []
        
        return files
