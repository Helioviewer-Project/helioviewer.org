"""ImageRetreivalDaemon"""
# Licensed under MOZILLA PUBLIC LICENSE Version 1.1
# Author: Keith Hughitt <keith.hughitt@nasa.gov>
# Author: Jack Ireland <jack.ireland@nasa.gov>
# pylint: disable=E1121
import sys
import datetime
import time
import logging
import os
import sunpy
import Queue
from random import shuffle
from helioviewer.jp2 import process_jp2_images
from helioviewer.db  import get_db_cursor

class ImageRetrievalDaemon:
    """Retrieves images from the server as specified"""
    def __init__(self, servers, browse_method, download_method, conf):
        """Explain."""
        # MySQL/Postgres info
        self.dbname = conf.get('database', 'dbname')
        self.dbuser = conf.get('database', 'user')
        self.dbpass = conf.get('database', 'pass')
        
        self._db = get_db_cursor(self.dbname, self.dbuser, self.dbpass)
        
        # Maximum number of simultaneous downloads
        self.queue = Queue.Queue()
        self.max_downloads = conf.getint('network', 'max_downloads')
        
        # Filepaths
        self.working_dir = os.path.expanduser(conf.get('directories',
                                                       'working_dir'))
        self.image_archive = os.path.expanduser(conf.get('directories',
                                                         'image_archive'))
        # Check directory permission
        self._check_permissions() 
        
        # Load data server, browser, and downloader
        self.servers = self._load_servers(servers)
        
        self.browsers = []
        for server in self.servers:
            self.browsers.append(self._load_browser(browse_method, server))

        # Start downloaders
        self.downloaders = []
        
        for i in range(self.max_downloads):
            self.downloaders.append(self._load_downloader(download_method))

        # Shutdown switch
        self.shutdown_requested = False

    def start(self, starttime=None, endtime=None):
        """Start daemon operation."""
        logging.info("Initializing HVPull")
        
        date_fmt = "%Y-%m-%d %H:%M:%S"
        
        # @NOTE: Should db cursor be recreated with each loop?
        
        
        # @TODO: Process urls in batches of ~1-500.. this way images start
        # appearing more quickly when filling in large gaps, etc.
        
        # @TODO: Redo handling of server-specific start time and pause
        # time
        
        # Determine starttime to use
        if starttime is not None:
            starttime = datetime.datetime.strptime(starttime, date_fmt)
        else:
            starttime = self.servers[0].get_starttime()
            
        # If end time is specified, fill in data from start to end
        if endtime is not None:
            endtime = datetime.datetime.strptime(endtime, date_fmt)
            urls = self.query(starttime, endtime)
            self.acquire(urls)
            
            return None
        else:
        # Otherwise, first query from start -> now
            now = datetime.datetime.utcnow()
            urls = self.query(starttime, now)
            self.acquire(urls)
        
        # Begin main loop
        while not self.shutdown_requested:
            now = datetime.datetime.utcnow()
            starttime = self.servers[0].get_starttime()
            
            # get a list of files available
            urls = self.query(starttime, now)
            
            # acquire the data files
            self.acquire(urls)
            
            #time.sleep(self.server.pause.seconds)
            logging.info("Sleeping for %d seconds." % self.servers[0].pause.total_seconds())
            time.sleep(self.servers[0].pause.total_seconds())
        
        # Shutdown
        self.stop()
        
    def stop(self):
        logging.info("Exiting HVPull")
        sys.exit()
        
    def query(self, starttime, endtime):
        """Query and retrieve data within the specified range.
        
        Checks for data in the specified range and retrieves any new files.
        After execution is completed, the same range is checked again to see
        if any new files have appeared since the first execution. This continues
        until no new files are found (for xxx minutes?)
        """
        files = []
        
        for browser in self.browsers:
            logging.info("(%s) Querying time range %s - %s", browser.server.name, 
                                                             starttime, endtime)
            files += self.query_server(browser, starttime, endtime)
        
        # Remove duplicate files, randomizing to spread load across servers
        if len(self.servers) > 1:
            shuffle(files)
            
            filenames = [os.path.basename(x) for x in files]
            
            for i, filepath in enumerate(files):
                if os.path.basename(filepath) in filenames[i + 1:]:
                    files.pop(i)
                    
        # Filter out files that are already in the database
        files = filter(self._filter_new, files)

        # Ensure the dates are most recent first
        files.sort()
        files.reverse()

        return files
    
    def query_server(self, browser, starttime, endtime):
        """Queries a single server for new files"""
        # Get the nickname subdirectory list present at the server
        directories = browser.get_directories(starttime, endtime)

        # Get a sorted list of available JP2 files via browser
        files = []
        
        # TESTING>>>>>>
        directories = [directories[3]]

        # Check each remote directory for new files
        for directory in directories:
            if self.shutdown_requested:
                return []
            logging.info('(%s) Scanning %s' % (browser.server.name, directory))
            matches = browser.get_files(directory, "jp2")
            files.extend(matches)

        # TESTING>>>>>>
        files = files[:50]
        
        return files
        
    def acquire(self, urls):
        """Acquires all the available files."""
        # If no new files are available do nothing
        if not urls:
            return
        
        print("Found %d new files" % len(urls))
        
        finished = []
        
        # Download files
        while len(urls) > 0:
            # Download files 20 at a time to avoid blocking shutdown requests
            for i in range(20): #pylint: disable=W0612
                if len(urls) > 0:
                    url = urls.pop()
                    finished.append(url)
                    self.queue.put(url)
                
            self.queue.join()
            
            if self.shutdown_requested:
                break
            
        self.ingest(finished)
        
    def ingest(self, urls):
        """
        Add images to helioviewer images db.
          (1) Make sure the file exists
          (2) Make sure the file is 'good', and quarantine if it is not.
          (3) Apply the ESA JPIP encoding.
          (4) Ingest
          (5) Update database to say that the file has been successfully 
              'ingested'.
        """
        # Get filepaths
        filepaths = []
        images = []
        
        for url in urls:
            p = os.path.join(self.image_archive, os.path.basename(url)) # @TODO: Better path computation
            if os.path.isfile(p):
                filepaths.append(p)
            
        # Add to hvpull/Helioviewer.org databases
        for filepath in filepaths:
            image_params = sunpy.read_header(filepath)
            image_params['filepath'] = filepath

            # Add to list to send to main database
            images.append(image_params)
            
        # Add valid images to main Database
        process_jp2_images(images, self.image_archive, self._db)

    def shutdown(self):
        print("Stopping HVPull...")
        self.shutdown_requested = True
        
        for downloader in self.downloaders:
            downloader.stop()
            
    def _check_permissions(self):
        """Checks to make sure we have write permissions to directories"""
        for d in [self.working_dir, self.image_archive]:
            if not (os.path.isdir(d) and os.access(d, os.W_OK)):
                print("Unable to write to specified directories. "
                      "Please check permissions for locations listed in "
                      "settings.cfg and try again...")
                sys.exit()

    def _load_servers(self, names):
        """Loads a data server"""
        servers = []
        
        for name in names:
            server = self._load_class('helioviewer.downloader.servers', 
                                      name, self.get_servers().get(name))
            servers.append(server())
        
        return servers
            
    def _load_browser(self, browse_method, uri):
        """Loads a data browser"""
        cls = self._load_class('helioviewer.downloader.browser', browse_method, 
                               self.get_browsers().get(browse_method))
        return cls(uri)
    
    def _load_downloader(self, download_method):
        """Loads a data downloader"""
        cls = self._load_class('helioviewer.downloader.downloader', download_method, 
                               self.get_downloaders().get(download_method))
        downloader = cls(self.image_archive, self.working_dir, self.queue)
        
        downloader.setDaemon(True)
        downloader.start()

        return downloader
    
    def _load_class(self, base_package, packagename, classname):
        """Dynamically loads a class given a set of strings indicating its 
        location"""
        # Import module
        modname = "%s.%s" % (base_package, packagename)
        __import__(modname)
    
        # Instantiate class and return
        return getattr(sys.modules[modname], classname)
    
    def _filter_new(self, url):
        """For a given list of remote files determines which ones have not
        yet been acquired."""
        filename = os.path.basename(url)
        self._db.execute("SELECT COUNT(*) FROM images WHERE filename='%s'" % 
                         filename)
        return self._db.fetchone()[0] == 0
    
    @classmethod
    def get_servers(cls):
        """Returns a list of valid servers to interact with"""
        return {
            "lmsal": "LMSALDataServer",
            "soho": "SOHODataServer",
            "stereo": "STEREODataServer",
            "jsoc": "JSOCDataServer"
        }
        
    @classmethod
    def get_browsers(cls):
        """Returns a list of valid data browsers to interact with"""
        return {
        "httpbrowser": "HTTPDataBrowser",
        "localbrowser": "LocalDataBrowser"
        }

    @classmethod
    def get_downloaders(cls):
        """Returns a list of valid data downloaders to interact with"""
        return {
            "urllib": "URLLibDownloader"
        }
