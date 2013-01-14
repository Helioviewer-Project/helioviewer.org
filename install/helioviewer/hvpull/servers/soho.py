"""SOHO DataServer"""
from helioviewer.hvpull.servers import DataServer
import datetime

class SOHODataServer(DataServer):
    def __init__(self):
        """This assumes that SOHO jp2 files are calculated locally.  They are 
        then copied over to a directory on the main Helioviewer server, from 
        which it can be picked up by the ingestion services.  Note that
        a full path is required to specify the location of the data."""
        DataServer.__init__(self, "/home/ireland/incoming/soho_incoming/v0.8/jp2", "SOHO")
        self.pause = datetime.timedelta(minutes=30)
        
    def compute_directories(self, start_date, end_date):
        """Computes a list of remote directories expected to contain files"""
        dirs = []
        
        eit_wavelengths = [171, 195, 284, 304]
        mdi_measurements = ["continuum", "magnetogram"]
        lasco_detectors = ["C2", "C3"]
        
        for date in self.get_dates(start_date, end_date):
            # EIT
            for meas in eit_wavelengths:
                dirs.append(os.path.join(self.uri, "EIT", date, str(meas)))
            
            # MDI
            #for meas in mdi_measurements:
            #    dirs.append(os.path.join(self.uri, "MDI", date, meas))
                
            # LASCO
            for detector in lasco_detectors:
                dirs.append(os.path.join(self.uri, "LASCO-"+detector, date, "white-light"))
                
        return dirs
    
    def get_starttime(self):
        """Default start time to use when retrieving data"""
        return datetime.datetime.utcnow() - datetime.timedelta(days=3)