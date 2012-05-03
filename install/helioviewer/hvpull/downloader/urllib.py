"""urllib2-based file downloader"""
import os
import logging
import threading
import time
from urllib2 import urlopen, Request, URLError, HTTPError

class URLLibDownloader(threading.Thread):
    def __init__(self, incoming, queue):
        """Creates a new URLLibDownloader"""
        threading.Thread.__init__(self)
        
        self.shutdown_requested = False
        self.incoming = incoming
        self.queue = queue

    def stop(self):
        self.shutdown_requested = True
    
    def run(self):
        """Downloads the file at the specified URL"""
        while not self.shutdown_requested:
            server, url = self.queue.get()
            
            # @TODO: compute path to download file to...
            
            # Location to save file to
            filepath = os.path.join(self.incoming, os.path.basename(url))
            
            # Create sub-directory if it does not already exist
            if not os.path.exists(os.path.dirname(filepath)):
                try:
                    os.makedirs(os.path.dirname(filepath))
                except OSError:
                    pass
    
            #Write to our local file
            try:
                # TODO: should urlretrieve be used instead?
                t1 = time.time()
                
                remote_file = urlopen(Request(url))
                
                file_contents = remote_file.read()
                
                t2 = time.time()
                logging.info("(%s) Downloaded %s (%0.3fs)", server, url, t2 - t1)
                
            except URLError:
                # If download fails, add back into queue and try again later
                print("failed for file %s " % url)
                self.queue.put(url)
            except:
                print("failed for file %s " % url) 
            else:
                # Open our local file for writing
                local_file = open(filepath, "wb")
                local_file.write(file_contents)
                local_file.close()            
            
            self.queue.task_done()
    