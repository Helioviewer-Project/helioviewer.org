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
        
    # %(asctime)s.%(msecs)03d
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s',
                                  datefmt='%Y-%m-%d %H:%M:%S')
    
    logger = logging.getLogger('')
    logger.setLevel(logging.INFO)
    
    # STDOUT logger
    console = logging.StreamHandler()

    # File logger
    rotate = logging.handlers.RotatingFileHandler(filename, 
                                                  maxBytes=10000000, backupCount=10)
    rotate.setFormatter(formatter)
    
    logger.addHandler(console)
    logger.addHandler(rotate)