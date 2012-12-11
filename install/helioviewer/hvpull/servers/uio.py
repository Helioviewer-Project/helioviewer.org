"""UIO (University of Oslo) DataServer definition"""
import os
from helioviewer.hvpull.servers import DataServer

class UIODataServer(DataServer):
    """UIO Datasource definition."""
    def __init__(self):
        """Defines the root directory of where the data is kept at UIO."""
        DataServer.__init__(self, "http://sdc.uio.no/vol/jpeg2000/", "UIO")
        
    def compute_directories(self, start_date, end_date):
        """Computes a list of remote directories expected to contain files"""
        dirs = []
        # XRT has two independent filter wheels that can be combined
        # to produce different types of images.  We construct the full
        # possible list from each filter wheel setting
        xrt_filter1 = ["FW1_Al_med","FW1_Al_poly","FW1_Be_med",
                       "FW1_Be_thin","FW1_C_poly","FW1_Open"]
        xrt_filter2 = ["FW2_Open","FW2_Al_mesh","FW2_Al_thick",
                       "FW2_Be_thick","FW2_Gband","FW2_Ti_poly"]
        xrt_measurements = []
        for fw1 in xrt_filter1:
            for fw2 in xrt_filter2:
                xrt_measurements.append(fw1+'_'+fw2)
        
        for date in self.get_dates(start_date, end_date):
            # XRT
            for meas in xrt_measurements:
                dirs.append(os.path.join(self.uri, "XRT", date, str(meas)))
                
        return dirs
