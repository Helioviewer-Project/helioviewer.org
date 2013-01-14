"""Local data browser"""
import os
from helioviewer.hvpull.browser.basebrowser import BaseDataBrowser

class LocalDataBrowser(BaseDataBrowser):
    """Methods for finding lists of directories and files on a local file
    system."""
    def __init__(self, server):
        BaseDataBrowser.__init__(self, server)

    def get_directories(self,start_date, end_date):
        """Get a list of directories at the passed uri"""
        return self.server.compute_directories(start_date, end_date)

    def get_files(self, location, extension):
        """Get all the files that end with specified extension at the uri"""

        # ensure the location exists
        full_path = os.path.expanduser(location)
        if os.path.exists(full_path):
            filenames = filter(lambda f: f.endswith("." + extension), 
                           os.listdir(full_path))
            files = [os.path.join(full_path,f) for f in filenames]

        files = filter(lambda location: location.endswith("." + extension),
                       self._query(location))
        return files
    
    def _query(self, location):
        """Get a list of files and folders at the specified remote location"""
        # query the local location for the list of files and subdirectories 
        if os.path.exists(location):
            return [os.path.join(location,f) for f in os.listdir(location)]
        else:
            return []
