"""STEREO DataServer"""
from helioviewer.downloader.servers import DataServer
import datetime

class STEREODataServer(DataServer):
    def __init__(self):
        """EXPLAIN"""
        DataServer.__init__(self, "/home/ireland/download_test/v0.8/jp2", "STEREO")
        self.pause = datetime.timedelta(hours=3)
        
    def get_starttime(self):
        """Default start time to use when retrieving data"""
        return datetime.datetime.utcnow() - datetime.timedelta(days=400)