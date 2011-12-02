#!/usr/bin/env python
#-*- coding:utf-8 -*-
"""
YouTube View Count Statistics

Queries YouTube and determines the total number of views of Helioviewer.org
videos.
"""
import os
import sys
import argparse
import gdata.youtube
import gdata.youtube.service
import numpy as np

def main():
    """Main"""
    args = get_args()
    
    # Connect to YouTube
    yt_service = gdata.youtube.service.YouTubeService()
    yt_service.ssl = True
    
    # Read list of ids
    ids = open(args.file).read().splitlines()
    
    counts = []
    retries = {i:0 for i in ids} # Limit number of retries due to network failures

    for video_id in ids:
        try:
            entry = yt_service.GetYouTubeVideoEntry(video_id=video_id)
            counts.append(int(entry.statistics.view_count))
        except gdata.service.RequestError:
            retries[video_id] += 1
            
            if retries[video_id] > 1:
                print("Retrying %s (try #%d)" % (video_id, retries[video_id]))
            
            #For request errors, append back to end of the queue
            if retries[video_id] <= 20:
                ids.append(video_id)

        except AttributeError:
            # If entry.statistics is None, stats are unavailable (hidden by user?)
            print("Skipping %s (Statistics Unavailable)" % video_id)
            
    counts = np.array(counts)
    
    print("===========")
    print(" Summary")
    print("===========")
    print("Total views: %d" % counts.sum())
    print("Min: %d" % counts.min())
    print("Max: %d" % counts.max())

def get_args():
    """Get command-line arguments"""
    parser = argparse.ArgumentParser(description='Collects statistics on videos uploaded to YouTube from Helioviewer.org.')
    parser.add_argument('file', metavar='FILE', 
                        help='File containing a newline-delimited list of YouTube movie ids.')
    args = parser.parse_args()
    
    if not os.path.isfile(args.file):
        sys.exit("Invalid file specified: %s" % args.file)
    
    return args

if __name__ == '__main__':
    sys.exit(main())
