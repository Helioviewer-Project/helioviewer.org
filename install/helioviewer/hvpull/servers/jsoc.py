"""JSOC DataServer definition"""
import os
from helioviewer.downloader.servers import DataServer

class JSOCDataServer(DataServer):
    """JSOC Datasource at Stanford University"""
    def __init__(self):
        """Defines the root directory of where the data is kept at the JSOC."""
        DataServer.__init__(self, "http://jsoc.stanford.edu/data/aia/images", "JSOC")
        
    def compute_directories(self, start_date, end_date):
        """Computes a list of remote directories expected to contain files"""
        directories = []
        
        measurements = [94, 131, 171, 193, 211, 304, 335, 1600, 1700, 45000]
        
        for date in self.get_dates(start_date, end_date):
            for meas in measurements:
                directories.append(os.path.join(self.uri, date, str(meas)))
                
        return directories
