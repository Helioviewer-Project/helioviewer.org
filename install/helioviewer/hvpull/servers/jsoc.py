"""JSOC DataServer definition"""
import os
from helioviewer.hvpull.servers import DataServer

class JSOCDataServer(DataServer):
    """JSOC Datasource at Stanford University"""
    def __init__(self):
        """Defines the root directory of where the data is kept at the JSOC."""
        DataServer.__init__(self, "http://jsoc.stanford.edu/data/aia/images", "JSOC")
        
    def compute_directories(self, start_date, end_date):
        """Computes a list of remote directories expected to contain files"""
        dirs = []
        
        aia_wavelengths = [4500, 304, 171, 1600, 193, 211, 335, 131, 94, 1700]
        
        for date in self.get_dates(start_date, end_date):
            for meas in aia_wavelengths:
                dirs.append(os.path.join(self.uri, date, str(meas)))
                
        return dirs
