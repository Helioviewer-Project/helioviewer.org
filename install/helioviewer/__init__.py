"""Helioviewer Python utility mehtods"""
import os
import logging
import logging.handlers

def init_logger(filepath):
    """Initializes logging"""
    # Check for logging directory
    directory, filename = os.path.split(os.path.expanduser(filepath))
    
    if directory is not "":
        if not os.path.exists(directory):
            os.makedirs(directory)
            
        os.chdir(directory)
        
    logging.basicConfig(filename=filename, level=logging.INFO,
                        format='%(asctime)s.%(msecs)03d [%(levelname)s] %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')
    
    # Also log INFO or higher messages to STDOUT
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    logging.getLogger('').addHandler(console)
    
    # Enable log-rotation for root logger
    rotate = logging.handlers.RotatingFileHandler(filename, 
                                                  maxBytes=10000000, backupCount=10)
    logging.getLogger('').addHandler(rotate)