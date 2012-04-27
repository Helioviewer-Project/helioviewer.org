"""urllib2-based file downloader"""
import os
import logging
import threading
from urllib2 import urlopen, Request # URLError, HTTPError

class URLLibDownloader(threading.Thread):
    def __init__(self, image_archive, working_dir, queue):
        """Creates a new URLLibDownloader"""
        threading.Thread.__init__(self)
        
        self.shutdown_requested = False
        
        self.image_archive = image_archive
        self.working_dir = working_dir
        self.queue = queue
        self.quarantine = os.path.join(self.working_dir, 'quarantine')
        
        if not os.path.exists(self.quarantine):
            os.makedirs(self.quarantine)
            
    def stop(self):
        self.shutdown_requested = True
    
    def run(self):
        """Downloads the file at the specified URL"""
        while not self.shutdown_requested:
            url = self.queue.get()
            
            # @TODO: compute path to download file to...
            
            # Location to save file to
            filepath = os.path.join(self.image_archive, os.path.basename(url))
            
            # Create sub-directory if it does not already exist
            if not os.path.exists(os.path.dirname(filepath)):
                try:
                    os.makedirs(os.path.dirname(filepath))
                except OSError:
                    pass
    
            # TODO: should urlretrieve be used instead?
            remote_file = urlopen(Request(url))
            
            logging.info("Downloading " + os.path.basename(filepath))
            
            # Open our local file for writing
            local_file = open(filepath, "wb")
            
            #Write to our local file
            local_file.write(remote_file.read())
            local_file.close()
            
            self.queue.task_done()
    