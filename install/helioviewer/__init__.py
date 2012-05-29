"""Helioviewer Python utility mehtods"""
import os
import logging

def init_logger(filepath):
    """Initializes logging"""
    # Check for logging directory
    directory, filename = os.path.split(os.path.expanduser(filepath))
    
    if directory is not "":
        if not os.path.exists(directory):
            os.makedirs(directory)
            
        os.chdir(directory)
        
    # TODO: Rotate logs
    # e.g. Move previous log to hvpull.log.1, hvpull.log.1 to hvpull.log.2, etc
    # and delete any logs greater than 10.    
    logging.basicConfig(filename=filename, level=logging.INFO,
                        format='%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')
    
    # Also log INFO or higher messages to STDOUT
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    logging.getLogger('').addHandler(console)