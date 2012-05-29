"""Base data browser definition"""
class BaseDataBrowser:
    """BaseDataBrowser"""
    def __init__(self, server):
        self.server = server

    def get_directories(self, start_time, end_time):
        """Gets a list of directories to be queried for the given time range"""
        return None
    
    def get_files(self, uri, extension):
        """Get all the files that end with specified extension at the uri"""
        return None