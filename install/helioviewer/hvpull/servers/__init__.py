"""Classes for working with known data servers"""
import os
import datetime

class DataServer:
    """Class for interacting with data servers."""
    def __init__(self, uri, name, pause=3):
        self.uri = uri
        self.name = name
        self.pause = datetime.timedelta(minutes=pause)
        
        # Example: 2011_11_17__08_13_08_13__SDO_AIA_AIA_304.jp2
        self.filename_regex = (
            "^(?P<year>\d{4})_(?P<month>\d{2})_(?P<day>\d{2})__" +
            "(?P<hour>\d{2})_(?P<min>\d{2})_(?P<sec>\d{2})_" + 
            "(?P<microsec>\d{2,3})__" +
            "(?P<obs>[a-zA-Z0-9]{3})_(?P<inst>[a-zA-Z0-9]{3})_" +
            "(?P<det>[a-zA-Z0-9]{3})_(?P<meas>[a-zA-Z0-9]{2,11})\.jp2$")
        
    def compute_directories(self, start_date, end_date):
        """Creates a list of possible directories containing new files"""
        return []

    def get_starttime(self):
        """Default start time to use when retrieving data"""
        return datetime.datetime.utcnow() - datetime.timedelta(hours=6)
   
    def get_dates(self, starttime, endtime):
        """Get a complete list of dates between the start and the end time"""
        fmt = "%Y/%m/%d"
        dates = [starttime.strftime(fmt)]

        date = starttime.date()
        while date < endtime.date():
            date = date + datetime.timedelta(days=1)
            dates.append(date.strftime(fmt))
        
        # Ensure the dates are most recent first
        dates.sort()
        dates.reverse()
        
        return dates
    
    def get_file_regex(self):
        """Returns a regex which described the expected format of filenames on
        the server"""
        return self.filename_regex

    def get_measurements(self, nicknames, dates):
        """Get a list of all the URIs down to the measurement"""
        return None
    
    def get_uri(self):
        """Return the server URI"""
        return self.uri
