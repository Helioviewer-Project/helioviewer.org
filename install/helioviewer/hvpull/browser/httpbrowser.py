"""HTTP data browser"""
import os
import urllib
import socket
from sgmllib import SGMLParser
from helioviewer.hvpull.browser.basebrowser import BaseDataBrowser, NetworkError

class HTTPDataBrowser(BaseDataBrowser):
    def __init__(self, server):
        BaseDataBrowser.__init__(self, server)
        socket.setdefaulttimeout(60)
        
    def get_directories(self, start_date, end_date):
        """Generates a list of remote directories which may be queried
        for files corresponding to the requested range. Note that these
        directories do not necessarily exist on the remote server."""
        # filter(lambda url: url.endswith("/"), self._query(location))
        return self.server.compute_directories(start_date, end_date)

    def get_files(self, location, extension):
        """Get all the files that end with specified extension at the uri"""
        files = None
        num_retries = 0
        
        # Get a list of the files at the remote location, if it exists
        # To avoid spending too much time, we will timeout after a short time
        # and retry up to 10 times.
        while files is None and num_retries <= 10:
            try:
                files = filter(lambda url: url.endswith("." + extension), 
                               self._query(location))
            except IOError, e:
                if isinstance(e.strerror, socket.error):
                    # if server is unreachable, raise an exception
                    raise NetworkError()
                elif isinstance(e.strerror, socket.timeout):
                    # for socket timeouts, retry
                    num_retries += 1
                    continue
                else:
                    # 404 - no files are there
                    files = []

        return files
    
    def _query(self, location):
        """Get a list of files and folders at the specified remote location"""
        # query the remote location for the list of files and subdirectories 
        url_lister = URLLister()
        result = url_lister.read(location)
        url_lister.close()

        urls = filter(lambda url: url[0] != "/" and url[0] != "?", result)
        
        return [os.path.join(location, url) for url in urls]
    
class URLLister(SGMLParser):
    '''
    Created on Nov 1, 2011
    @author: Jack Ireland <jack.ireland@nasa.gov>
    copied from the original version of the download code.
    '''
    def __init__(self):
        """Create a new URLLister"""
        SGMLParser.__init__(self)
        self.urls = []

    def read(self, uri):
        """Read a URI and return a list of files/directories"""
        usock = urllib.urlopen(uri)
        self.feed(usock.read())
        usock.close()
        
        return self.urls
        
    def reset(self):
        """Reset state of URLLister"""
        SGMLParser.reset(self)
        self.urls = []

    def start_a(self, attrs):
        href = [v for k, v in attrs if k == 'href']
        if href:
            self.urls.extend(href)
