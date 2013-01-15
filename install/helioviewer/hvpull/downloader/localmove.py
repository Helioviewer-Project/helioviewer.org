"""moves files from one location on the local file system to another"""
import os
import logging
import threading
import time
import shutil

class LocalFileMove(threading.Thread):
    def __init__(self, incoming, queue):
        """Creates a new LocalFileMover"""
        threading.Thread.__init__(self)
        
        self.shutdown_requested = False
        self.incoming = incoming
        self.queue = queue

    def stop(self):
        self.shutdown_requested = True
    
    def run(self):
        """Downloads the file at the specified URI"""
        while not self.shutdown_requested:
            #ValueError: too many values to unpack
            server, percent, uri = self.queue.get()
            
            # @TODO: compute path to download file to...
            
            # Location to save file to
            filepath = os.path.join(self.incoming, os.path.basename(uri))
            
            # Create sub-directory if it does not already exist
            if not os.path.exists(os.path.dirname(filepath)):
                try:
                    os.makedirs(os.path.dirname(filepath))
                except OSError:
                    pass
            #Attempt to move the file
            try:
                print(uri,filepath)
                t1 = time.time()
                shutil.move(uri, filepath)
                t2 = time.time()
                logging.info("(%s) locally moved %s to %s", server, uri, filepath)
            except IOError:
                # If download fails, add back into queue and try again later
                logging.warning("Failed to move %s. Adding to end of queue to retry later.", uri)
                self.queue.put([server, percent, uri])
            except:
                logging.warning("Failed to move %s.", uri)
            self.queue.task_done()
    