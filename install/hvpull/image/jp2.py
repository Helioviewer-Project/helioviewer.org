'''
Created on Nov 15, 2011

@author: ireland
'''
import os
import re
from datetime import datetime

class JPEG2000Image:
    """A JPEG 2000 Image"""
    def __init__(self, filename, filename_regex):
        """JPEG2000Image constructor"""
        self.filename = filename
        self.filename_regex = filename_regex
        
        # First check to see if the filename follows the
        # convention.  If not, use other methods to determine if the file is
        # allowable.
        
        # Parse filename
        m = re.match(self.filename_regex, self.filename)
        
        if m is None:
            raise UnrecognizedFilename
        
        self.observatory = m.group('obs')
        self.instrument = m.group('inst')
        self.detector = m.group('det')
        self.measurement = m.group('meas')
    
        self.datetime = datetime(
            int(m.group('year')), int(m.group('month')), int(m.group('day')),
            int(m.group('hour')), int(m.group('min')), int(m.group('sec')),
            int(m.group('microsec'))
        )
        
class UnrecognizedFilename(NameError):
    """Filename encountered does not follow any known convention"""
    pass
