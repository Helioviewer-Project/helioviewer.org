"""Classes for working with known data servers"""
import os
import datetime

class DataServer:
    """Class for interacting with data servers."""
    def __init__(self, uri):
        self.uri = uri
        self.pause = datetime.timedelta(minutes=3)
        
        # Example: 2011_11_17__08_13_08_13__SDO_AIA_AIA_304.jp2
        self.filename_regex = (
            "^(?P<year>\d{4})_(?P<month>\d{2})_(?P<day>\d{2})__" +
            "(?P<hour>\d{2})_(?P<min>\d{2})_(?P<sec>\d{2})_" + 
            "(?P<microsec>\d{2,3})__" +
            "(?P<obs>[a-zA-Z0-9]{3})_(?P<inst>[a-zA-Z0-9]{3})_" +
            "(?P<det>[a-zA-Z0-9]{3})_(?P<meas>[a-zA-Z0-9]{2,11})\.jp2$")

    def get_starttime(self):
        """Default start time to use when retrieving data"""
        return datetime.datetime.utcnow() - datetime.timedelta(days=1)
   
    def get_dates(self, start, end):
        """Get a complete list of dates between the start and the end time"""
        return None
    
    def get_file_regex(self):
        """Returns a regex which described the expected format of filenames on
        the server"""
        return self.filename_regex
    
    def get_nicknames(self):
        """Get a list of nicknames at the root of the data server"""
        pass

    def get_measurements(self, nicknames, dates):
        """Get a list of all the URIs down to the measurement"""
        return None
    
    def get_uri(self):
        """Return the server URI"""
        return self.uri

    def get_locations(self, start, end):
        """This scans the URI and finds all the possible nicknames, then adds in the requested
        dates, then scans for all the measurements.
        """
        nicknames = self.get_nicknames()
        #dates = self.get_dates(self,start,end)
        #measurements = self.get_measurements(self,nicknames,dates)
        #return measurements
