"""JSOC DataServer definition"""
from helioviewer.downloader.servers import DataServer

class JSOCDataServer(DataServer):
    """JSOC Datasource at Stanford University"""
    def __init__(self):
        """Defines the root directory of where the data is kept at the JSOC."""
        DataServer.__init__(self, "http://jsoc.stanford.edu/data/aia/images", "JSOC")
