"""Royal Observatory of Belgium DataServer definition"""
import os
import datetime
from helioviewer.hvpull.servers import DataServer

class ROBDataServer(DataServer):
    """LMSAL Datasource definition"""
    def __init__(self):
        """Defines the root directory of where the data is kept at ROB."""
        DataServer.__init__(self, "http://proba2.sidc.be/swap/data/qlk", "ROB")
        self.pause = datetime.timedelta(minutes=15)
        
    def compute_directories(self, start_date, end_date):
        """Computes a list of remote directories expected to contain files"""
        dirs = []
        
        for date in self.get_dates(start_date, end_date):
            dirs.append(os.path.join(self.uri, date))

        return dirs
