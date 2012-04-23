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
import redis
import sunpy
import Queue
from helioviewer.jp2 import process_jp2_images
from helioviewer.db  import get_db_cursor

class ImageRetrievalDaemon:
    """Retrieves images from the server as specified"""
    def __init__(self, server, browse_method, download_method, conf):
        """Explain."""
        self._db = None
        
        # Redis info
        self.redis_host = conf.get('redis', 'host')
        self.redis_port = int(conf.get('redis', 'port'))
        self.redis_dbnum = conf.get('redis', 'database')
        
        # MySQL/Postgres info
        self.dbname = conf.get('database', 'dbname')
        self.dbuser = conf.get('database', 'user')
        self.dbpass = conf.get('database', 'pass')
        
        # Maximum number of simultaneous downloads
        self.queue = Queue.Queue()
        self.max_downloads = conf.get('net', 'max_downloads')
        
        # Filepaths
        self.working_dir = os.path.expanduser(conf.get('directories',
                                                       'working_dir'))
        self.image_archive = os.path.expanduser(conf.get('directories',
                                                         'image_archive'))
        # Check directory permission
        self._check_permissions() 
        
        # Load data server, browser, and downloader
        self.server = self._load_server(server)
        self.browser = self._load_browser(browse_method, self.server.get_uri())
        
        # Start downloaders
        self.downloaders = []
        
        for i in range(self.max_downloads):
            self.downloaders.append(self._load_downloader(download_method))

        # Shutdown switch
        self.shutdown_requested = False
        
        # Initialize database
        self._init_db()

    def _init_db(self):
        """Initialise the database"""
        try:
            self._db = redis.StrictRedis(host=self.redis_host, 
                                         port=self.redis_port, 
                                         db=self.redis_dbnum)
            self._db.ping()
        except redis.ConnectionError:
            logging.error('Unable to connect to Redis. Is redis running?')
            print("Please start redis and try again...")
            sys.exit()

    def _check_permissions(self):
        """Checks to make sure we have write permissions to directories"""
        for d in [self.working_dir, self.image_archive]:
            if not (os.path.isdir(d) and os.access(d, os.W_OK)):
                print("Unable to write to specified directories. "
                      "Please check permissions for locations listed in "
                      "settings.cfg and try again...")
                sys.exit()

    def _load_server(self, server):
        """Loads a data server"""
        cls = self._load_class('downloader.servers', 
                               server, self.get_servers().get(server))
        return cls()
            
    def _load_browser(self, browse_method, uri):
        """Loads a data browser"""
        cls = self._load_class('downloader.browser', browse_method, 
                               self.get_browsers().get(browse_method))
        return cls(uri)
    
    def _load_downloader(self, download_method):
        """Loads a data downloader"""
        cls = self._load_class('downloader.downloader', download_method, 
                               self.get_downloaders().get(download_method))
        downloader = cls(self.image_archive, self.working_dir, 
                         self.server.get_uri(), self.queue)
        
        downloader.setDaemon(True)
        downloader.start()

        return downloader
        
    def start(self, starttime=None, endtime=None):
        """Start daemon operation."""
        logging.info("Initializing HVPull")
        
        date_fmt = "%Y-%m-%d %H:%M:%S"
        
        # Connect to database
        
        # @NOTE: Should db cursor be recreated with each loop?
        cursor = get_db_cursor(self.dbname, self.dbuser, self.dbpass)
        
        # @TODO: Process urls in batches of ~1-500.. this way images start
        # appearing more quickly when filling in large gaps, etc.
        
        # Determine starttime to use
        if starttime is not None:
            starttime = datetime.datetime.strptime(starttime, date_fmt)
        else:
            starttime = self.server.get_starttime()
            
        # If end time is specified, fill in data from start to end
        if endtime is not None:
            endtime = datetime.datetime.strptime(endtime, date_fmt)
            urls = self.query(starttime, endtime)
            self.acquire(urls)
            self.ingest(cursor, urls)
            return None
        else:
        # Otherwise, first query from start -> now
            now = datetime.datetime.utcnow()
            urls = self.query(starttime, now)
            self.acquire(urls)
            self.ingest(cursor, urls)
        
        # Begin main loop
        while not self.shutdown_requested:
            now = datetime.datetime.utcnow()
            starttime = self.server.get_starttime()
            
            # get a list of files available
            urls = self.query(starttime, now)
            
            # acquire the data files
            self.acquire(urls)
            self.ingest(cursor, urls)
            
            #time.sleep(self.server.pause.seconds)
            time.sleep(self.server.pause.seconds)
        
        # Shutdown
        self.stop()
        
    def stop(self):
        logging.info("Exiting HVPull")
        sys.exit()
        
    def ingest(self, cursor, urls):
        """
        Add images to helioviewer images db.
          (1) Make sure the file exists
          (2) Make sure the file is 'good', and quarantine if it is not.
          (3) Apply the ESA JPIP encoding.
          (4) Ingest
          (5) Update database to say that the file has been successfully 
              'ingested'.
              
        """
        base_url = self.server.get_uri()
        
        # Get filepaths
        filepaths = []
        images = []
        
        for url in urls:
            p = os.path.join(self.image_archive, url.replace(base_url, ""))
            if os.path.isfile(p):
                filepaths.append(p)
            
        # Add to hvpull/Helioviewer.org databases
        for filepath in filepaths:
            info = sunpy.read_header(filepath)
            
            img_counter = self._db.incr('counter:img_id')
            img_id = 'img:%s' % os.path.basename(filepath)
            
            # Add to Redis
            params_redis = {
                "id": img_counter,
                "timestamp": datetime.datetime.utcnow(),
                "observatory": info['observatory'],
                "instrument": info['instrument'],
                "detector": info['detector'],
                "measurement": info['measurement'],
                "date_obs": info['date']
            }
            self._db.hmset(img_id, params_redis)
            
            params_mysql = {
                "observatory": info['observatory'],
                "instrument": info['instrument'],
                "detector": info['detector'],
                "measurement": info['measurement'],
                "date_obs": info['date']
            }
            images.append[params_mysql]
            
        # Add valid images to main Database
        process_jp2_images(images, self.image_archive, cursor)

    def acquire(self, urls):
        """Acquires all the available files."""
        # If no new files are available do nothing
        if not urls:
            return
        
        print("Found %d new files" % len(urls))
        
        # Download files
        while len(urls) > 0:
            # Download files 20 at a time to avoid blocking shutdown requests
            for i in range(20): #pylint: disable=W0612
                if len(urls) > 0:
                    url = urls.pop()
                    self.queue.put(url)
                
            self.queue.join()
            
            if self.shutdown_requested:
                self.stop()

    def shutdown(self):
        print("Stopping HVPull...")
        self.shutdown_requested = True
        
        for downloader in self.downloaders:
            downloader.stop()
        
    def query(self, starttime, endtime):
        """Query and retrieve data within the specified range.
        
        Checks for data in the specified range and retrieves any new files.
        After execution is completed, the same range is checked again to see
        if any new files have appeared since the first execution. This continues
        until no new files are found (for xxx minutes?)
        """
        # Get the nickname subdirectory list present at the server
        root_url = self.server.get_uri()
        nicknames = self.browser.get_directories(root_url)

        # No nicknames found.
        if nicknames == []:
            return None
        
        logging.info("Querying time range %s - %s", starttime, endtime)
                
        # Get the list of dates
        fmt = "%Y/%m/%d"
        dates = [starttime.strftime(fmt)]

        date = starttime.date()
        while date < endtime.date():
            date = date + datetime.timedelta(days=1)
            dates.append(date.strftime(fmt))
        
        # Ensure the dates are most recent first
        dates.sort()
        dates.reverse()
        
        # Get the measurement subdirectories present at the server        
        measurements = []
        for nickname in nicknames:
            for date in dates:
                location = os.path.join(nickname, date)
                measurement = self.browser.get_directories(location)
                measurements.extend(measurement)

        # No measurements found
        if measurements == []:
            return None

        # Get all the unique measurements
        measurements = list(set(measurements))

        # Get a sorted list of available JP2 files via browser
        files = []
        
        # TESTING>>>>>>
        # measurements = [measurements[1]]

        # Check each remote directory for new files
        for measurement in measurements:
            if self.shutdown_requested:
                return            
            logging.info('Scanning ' + measurement)
            matches = self.browser.get_files(measurement, "jp2")
            files.extend(matches)

        # Remove any duplicates
        files = list(set(files))
        
        return filter(self._filter_new, files) or None
    
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
        return not self._db.exists("img:%s" % filename)
    
    @classmethod
    def get_servers(cls):
        """Returns a list of valid servers to interact with"""
        return {
            "lmsal": "LMSALDataServer",
            "soho": "SOHODataServer",
            "stereo": "STEREODataServer"
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
