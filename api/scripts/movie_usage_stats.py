#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
Helioviewer.org Movie database usage analysis
Feb 6, 2012
"""
import sys
import math
import random
import MySQLdb
import numpy as np
from scipy import constants
from scipy import polyfit
from scipy.interpolate import interp1d
from matplotlib import pyplot as plt
from matplotlib import colors
from matplotlib import mlab

def main(dbname, dbtable, dbuser, dbpass):
    """Main script execution"""
    # Query database
    result = query_database(dbname, dbtable, dbuser, dbpass, 1, 900)
    
    # Break result up into separate columns
    frame_counts, image_scales, widths, heights, proc_times = zip(*result)
    
    # Movie area in square pixels and arcseconds
    area_px = np.array(widths) * np.array(heights)
    area_as = area_px * np.array(image_scales) ** 2
    
    # Limit outlier influence from server downtime, etc
    times = np.array(proc_times)   
    
    # Determine linear fit for number of frames and area
    (m1, b1) = polyfit(frame_counts, times, 1)
    (m2, b2) = polyfit(np.sqrt(area_px), times, 1)
    
    print "Linear fit for num frames: y = %fx + %f" % (m1, b1)
    print "Linear fit for movie size: y = %fx + %f" % (m2, b2)
    
    # Basic time estimation
    w1 = 0.8
    w2 = 1 - w1
    basic_est = lambda x, y: w1 * (m1 * x + b1) + w2 * (m2 * y + b2)
    evaluate_estimation_fn(basic_est, frame_counts, np.sqrt(area_px), times)
    
    #estimate_interp1d(frame_counts, area_px, times, w1=1, w2=0, 
    #                  frame_kind='cubic', area_kind='cubic')
    
    # Create a figure
    #fig = plt.figure()

    #plot_aspect_ratio(fig, widths, heights)
    #plot_frames_vs_time(fig, frame_counts, times, log_time=True)
    #plot_pixel_dimensions_vs_time(fig, area_px, times, norm=True)
    #plot_times_for_set_framecount(fig, frame_counts, times, 300, log_time=True)
    #plot_times_for_set_length(fig, area_px, proc_times, 175, log_time=True)
    #plot_physical_dimensions(fig, area_as, times, log=True)
    #plot_image_scale_vs_dimensions(fig, area_as, image_scales)
    
    #plt.savefig('output.png')
    #plt.show()
    
    #return 0
    
def plot_aspect_ratio(fig, widths, heights, subplot=111):
    """Plots the frequency of movie aspect ratios"""
    ratios = np.array(widths, dtype='float') / np.array(heights, dtype='float')
    
    ax = fig.add_subplot(subplot)
    ax.set_title("Helioviewer.org Movie Aspect Ratios")
    ax.set_xlabel("Aspect Ratio (width/height)")
    ax.set_ylabel("Frequence")
    
    ax.hist(ratios.clip(0, 3), 100)
    ax.axvline(16 / 9., color='r', label="16:9")
    ax.axvline(4 / 3., color='g', label="4:3")
    ax.axvline(constants.golden_ratio, color='gold', label=r"$\phi$")
    ax.legend()
    
    return ax
        
def plot_frames_vs_time(fig, frame_counts, times, log_time=False, subplot=111):
    """2d Hisogram: Frames vs. Time"""
    if log_time:
        times = np.log10(np.array(times))
    hist, xedges, yedges = np.histogram2d(times, frame_counts, bins=(100, 100))
    extent = [yedges[0], yedges[-1], xedges[0], xedges[-1]]
    
    ax = fig.add_subplot(subplot)
    ax.set_title("Processing Time vs. Number of Frames")
    ax.set_ylabel("Log Time (s)" if log_time else "Time (s)")
    ax.set_xlabel("Number of frames")
    im = ax.imshow(hist.clip(0.1), extent=extent, interpolation='nearest', 
                   aspect='auto', norm=colors.LogNorm(), origin='bottomleft')
    fig.colorbar(im)
    
def plot_times_for_set_framecount(fig, frame_counts, times, frame_num, 
                                  log_time=False, subplot=111):
    """1d Histogram: Variability in processing time for a set framecount"""
    ax = fig.add_subplot(subplot)
    ax.set_xlabel("Log Time (s)" if log_time else "Time (s)")
    ax.set_ylabel("Frequency (n)")
    
    # restrict histograms to times where num frames = frame_num
    times_new = []
    for i, n in enumerate(frame_counts):
        if n == frame_num:
            times_new.append(times[i])
    times_new = np.array(times_new)
    
    # mean and standard deviation
    mu = np.mean(times_new)
    sigma = np.std(times_new)
    
    # add title
    ax.set_title(r"$\mathrm{Processing\ Time\ for\ %d-Frame Movies:}\ \mu=%f,\ \sigma=%f$" % (
                   frame_num, mu, sigma))

    # log time?
    if log_time:
        times_new = np.log10(times_new)
        mu = np.mean(times_new)
        sigma = np.std(times_new)
    
    # must have normed=1 for fit to work
    n, bins, patches = ax.hist(times_new, 50, normed=1)
    
    # http://stackoverflow.com/questions/7805552/fitting-a-histogram-with-python
    y = mlab.normpdf( bins, mu, sigma)
    l = ax.plot(bins, y, 'r--', linewidth=2)
    
    return ax
        
def plot_times_for_set_length(fig, area_px, times, length, margin=20, 
                              log_time=False, subplot=111):
    """1d Histogram: Variability in processing time for a set length"""
    ax = fig.add_subplot(subplot)
    ax.set_xlabel("%sTime (s)" % ("Log " if log_time else ""))
    ax.set_ylabel("Frequency (n)")
    
    times_new = []
    for i, n in enumerate(np.sqrt(area_px)):
        if n >= length - margin and n <= length + margin:
            times_new.append(times[i])
    times_new = np.array(times_new)
    
    # Mode
    mode_fn = lambda x: max([(x.count(y),y) for y in x])[1]
    mode = mode_fn(list(times_new))
    
    title = r"$\mathrm{Processing\ Time\ for\ %dx%dpx\ Movies:}\ \mu=%f,\ mode=%f,\ \sigma=%f$"
    ax.set_title(title % (length, length, times_new.mean(), mode, times_new.std()))
    
    # Use log times if requested
    if log_time:
        times_new = np.log10(np.array(times_new))
    
    # must have normed=1 for fit to work
    n, bins, patches = ax.hist(times_new, 50, normed=1)
    
    # http://stackoverflow.com/questions/7805552/fitting-a-histogram-with-python
    mu = np.mean(times_new)
    sigma = np.std(times_new)
    y = mlab.normpdf( bins, mu, sigma)
    l = ax.plot(bins, y, 'r--', linewidth=2)    
        
def plot_pixel_dimensions_vs_time(fig, area_px, times, log_time=False, 
                                  norm=False, subplot=111):
    """2d Hisogram: Pixel Area vs. Time"""
    if log_time:
        times = np.log10(times)
    hist, xedges, yedges = np.histogram2d(times, np.sqrt(area_px), bins=(100, 100))
    
    min_clip = 0.1
    
    # Normalize columns with respect to frequency
    if norm:
        for i, col in enumerate(hist.T):
            hist.T[i] = hist.T[i] / col.sum()
        xedges / xedges.sum()
        min_clip = 0.0001
        
    extent = [yedges[0], yedges[-1], xedges[0], xedges[-1]]
    
    ax = fig.add_subplot(subplot)
    ax.set_title("Processing Time vs. Average Movie Dimension")
    ax.set_xlabel("Average Movie Dimension (px)")
    ax.set_ylabel("Log Time (s)" if log_time else "Time (s)")
    im = ax.imshow(hist.clip(min_clip), extent=extent, interpolation='nearest', 
                   aspect='auto', norm=colors.LogNorm(), origin='bottomleft')
    fig.colorbar(im)
    
def plot_physical_dimensions(fig, area_as, times, log=False, subplot=111):
    """Hisogram: Average physical dimensions"""
    lengths = np.sqrt(area_as)

    legend={
        "LASCO C3": 58000,
        "LASCO C2": 12100,
        "Solar Diameter": 1926,
        "Active Region": 350            
    }
    colors=["red", "green", "purple", "orange"]
    
    if log:
        lengths = np.log10(lengths)
        legend = {k: np.log10(v) for k,v in legend.items()}

    ax = fig.add_subplot(subplot)
    ax.set_title("Frequency of average physical dimensions requested")
    ax.set_xlabel("Average Physical Dimension (arcseconds)")
    
    ax.hist(lengths, 50)
    i = 0
    for l, x in legend.items():
        ax.axvline(x, label=l, color=colors[i])
        i += 1
    ax.legend()

    return ax
    
def plot_image_scale_vs_dimensions(fig, area_as, image_scales, subplot=111):
    """2d Hisogram: Image Scale vs. Average Side in Arc-seconds"""
    log_physdim = np.log10(np.sqrt(area_as))
    hist, xedges, yedges = np.histogram2d(log_physdim, np.log2(image_scales), bins=(100, 100))
    extent = [yedges[0], yedges[-1], xedges[-1], xedges[0]]
    
    ax = fig.add_subplot(subplot)
    ax.set_title("Image Scale vs. Average Side in Arc-seconds")
    ax.set_xlabel("Log2 Image Scale (arcseconds/px)")
    ax.set_ylabel("Log10 Average Side(arcseconds)")
    im = ax.imshow(hist.clip(1), extent=extent, interpolation='nearest', 
                   aspect='auto', norm=colors.LogNorm())
    fig.colorbar(im)
        
def query_database(dbname, dbtable, dbuser, dbpass, min_time, max_time):
    """Queries the database and returns an ndarray for some of the
    interesting parameters.
    """
    db = MySQLdb.connect(user=dbuser, passwd=dbpass, db=dbname)
    cur = db.cursor()
    
    # Get movie build data
    sql = '''SELECT numFrames, imageScale, width, height, 
             buildTimeEnd - buildTimeStart as procTime 
             FROM %s
             WHERE buildTimeEnd - buildTimeStart >= %d 
             AND buildTimeEnd - buildTimeStart <= %d''' % (dbtable, 
                                                           min_time, max_time)
    cur.execute(sql)

    # Convert result to an ndarray
    dtypes = [('num_frames', int), ('image_scale', float), 
              ('width', int), ('height', int), ('proc_time', int)]              
    
    return np.fromiter((tuple(row) for row in cur), 
                        dtype=dtypes, count=cur.rowcount)
    
def get_mean_time_for_frame_num(frame_counts, times, frame_num):
    """Returns the mean processing time required for movies with a specified
    frame number"""
    matches = filter(lambda x: x[0] == frame_num, zip(frame_counts, times))
    
    t, filtered_times = zip(*matches)
    
    return np.mean(filtered_times)

def get_mean_time_for_average_side(sides, times, side, margin=5):
    """Returns the mean processing time required for movies with a specified
    pixel dimension"""
    filter_fn = lambda x: x[0] >= (side - margin) and x[0] <= (side + margin)
    matches = filter(filter_fn, zip(sides, times))
    
    t, filtered_times = zip(*matches)
    
    return np.mean(filtered_times)
    
def estimate_interp1d(frame_counts, area_px, times, w1=0.5, w2=0.5, 
                      frame_kind='linear', area_kind='linear'):
    """Uses SciPy's 1d interpolation method to estimate the contributions
    from the number of frames and the pixel area in determining the processing
    time for a movie."""
    # Choose interpolation points for movie frames influence
    frames_x = range(5, 301, 5)
    frames_y = [get_mean_time_for_frame_num(frame_counts, times, x) for x in frames_x]
    frame_est = interp1d([0] + frames_x, [0] + frames_y, kind=frame_kind)
    
    xnew = np.linspace(0, 300, 60)
    plt.plot(frames_x, frames_y, 'o', xnew, frame_est(xnew),'-')
    plt.show()
    
    # Choose interpolation points for movie dimensions influence
    sides = np.sqrt(area_px)
    area_x = range(int(math.floor(sides.min())), int(math.ceil(sides.max())), 30) + [int(math.ceil(sides.max()))]
    area_y = [get_mean_time_for_average_side(sides, times, x) for x in area_x]
    area_est = interp1d(area_x, area_y, kind=area_kind)
    
    combined_est = lambda x, y: w1 * frame_est(x) + w2 * area_est(y)
    
    evaluate_estimation_fn(combined_est, frame_counts, np.sqrt(area_px), times)
    
    
def evaluate_estimation_fn(fn, frame_counts, area_px, times, n=1000):
    """Evaluates the performance of a function for estimating the time required
    to build a movie compared with data from actual movies."""
    # Measure difference between estimates and actual times
    offsets = []
    
    for i in random.sample(range(len(frame_counts)), n):
        estimate = fn(frame_counts[i], area_px[i])
        offsets.append(estimate - times[i])
        
    # Print summary of results
    print "SUMMARY:"
    print "Average movie processing time (s): %f" % np.mean(times)
    print "Sample size: %d" % n
    print "Mean est. error (s): %f" % np.mean(offsets)
    print "Mean est. absolute error (s): %f" % np.mean(np.abs(offsets))
    print "Standard deviation est. (s): %f" % np.std(offsets)

if __name__ == '__main__':
    sys.exit(main("helioviewer", "movies_dump", "helioviewer", "helioviewer"))
