"""Base data browser definition"""
class BaseDataBrowser:
    """BaseDataBrowser"""
    def __init__(self, server):
        self.server = server

    def get_directories(self, uri):
        """Get a list of directories at the root of the dataprovider.  We
        assume that these directories are in fact a list of instrument
        nicknames."""
        return None
    
    def get_files(self, uri, extension):
        """Get all the files that end with specified extension at the uri"""
        return None