<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie_FFMPEGEncoder Class Definition
 * 
 * Detecting problems with FFmpeg encoding:
 *  When using exec to call FFmpeg from the command line no useful return code or output
 *  information is returned. In order to the detect problems then the simplest way is to
 *  check and make sure the filesize is reasonable.
 *
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Calls FFMpeg commands
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_FFMPEGEncoder
{
    
    private $_directory;
    private $_filename;
    private $_format;
    private $_frameRate;
    private $_width;
    private $_height;
    private $_macFlags;
    
    /**
     * Constructor
     * 
     * @param {int} $frameRate The number of frames per second in the movie
     * 
     * @return void
     */
    public function __construct($directory, $filename, $format, $frameRate, $width, $height)
    {
        $this->_directory = $directory;
        $this->_filename  = $filename;
        $this->_format    = $format;
        $this->_frameRate = $frameRate;
        $this->_width     = $width;
        $this->_height    = $height;

        $this->_macFlags = "-flags +loop -cmp +chroma -vcodec libx264 -me_method 'hex' -me_range 16 "
                    . "-keyint_min 25 -sc_threshold 40 -i_qfactor 0.71 -b_strategy 1 -qcomp 0.6 -qmin 10 "
                    . "-qmax 51 -qdiff 4 -bf 3 -directpred 1 -trellis 1 -wpredp 2 -an -y";
    }
    
    /**
     * Creates a medium quality video
     */
    public function createVideo()
    {
        $file = sprintf("%s/%s.%s", $this->_directory, $this->_filename, $this->_format);

        if ($this->_format == "mp4") {
            $this->_createH264Video($file);
        } else if ($this->_format == "webm") {
            $this->_createWebMVideo($file);
        }
        
        // If FFmpeg segfaults, an empty movie container may still be produced,
        if (filesize($file) < 1000)
            throw new Exception("FFmpeg error encountered.");

        return $file;
    }
    
    /**
     * Creates a high quality vidoe
     */
    public function createHQVideo()
    {
        $file = sprintf("%s/%s-hq.%s", $this->_directory, $this->_filename, $this->_format);
        
        if ($this->_format == "mp4") {
            $this->_createH264Video($file, "ultrafast", 15);
        } else if ($this->_format == "webm") {
            $this->_createWebMVideo($file, 1);
        }
        
        // If FFmpeg segfaults, an empty movie container may still be produced
        if (filesize($file) < 1000)
            throw new Exception("FFmpeg error encountered.");

        return $file;
    }
    
    /**
     * Creates a WebM + VP8 video
     */
    public function createWebMVideo($file, $qmax=10)
    {
        $cmd = HV_FFMPEG . " -r " . $this->_frameRate . " -i " . $this->_directory . "/frames/frame%d.bmp"
            . " -r " . $outputRate . " -f webm -vcodec libvpx -qmax $qmax -threads " . HV_FFMPEG_MAX_THREADS 
            . " -s " . $this->_width . "x" . $this->_height . " -an -y $file";
        exec(escapeshellcmd($cmd));
    }
    
    /**
     * Creates a video in whatever format is given in $filename
     * 
     * NOTE: Frame rate MUST be specified twice in the command, before and after the input file, or ffmpeg will start
     *       cutting off frames to adjust for what it thinks is the right frameRate. 
     *
     * @param int    $width       the width of the video
     * @param int    $height      the height of the video
     * 
     * @return String the filename of the video
     */
    private function _createH264Video($file, $preset="lossless_fast", $crf=18)
    {
        // MCMedia player can't play videos with < 1 fps and 1 fps plays oddly. So ensure
        // fps >= 2
        //$outputRate = substr($this->_filename, -3) === "flv" ? max($this->_frameRate, 2) : $this->_frameRate;
        $cmd = HV_FFMPEG . " -r " . $this->_frameRate . " -i " . $this->_directory . "/frames/frame%d.bmp"
            . " -r " . $outputRate . " -vcodec libx264 -vpre $preset -threads " . HV_FFMPEG_MAX_THREADS 
            . " -crf $crf -s " . $this->_width . "x" . $this->_height . " -an -y $file";
        exec(escapeshellcmd($cmd));
    }
    
    /**
     * Creates a flash video by converting it from the high quality file
     *
     * @param string $directory  The directory where both files are stored
     * @param string $filename   Base filename of the video
     * @param string $origFormat The original container format
     * @param string $newFormat  The new container format
     * 
     * @return void
     */
    public function createFlashVideo()
    {
        $file = $this->_directory . "/" . $this->_filename;
        
        $cmd = HV_FFMPEG . " -i $file.mp4 -vcodec copy -threads " . HV_FFMPEG_MAX_THREADS . " $file.flv";
    
        exec(escapeshellcmd($cmd));

        // Check to ensure that movie size is valid
        if (filesize($new) < 1000)
            throw new Exception("FFmpeg error encountered: Unable to create flv.");
    }
    
    
    /**
     * Creates an ipod-compatible mp4 video

     * @param int    $width      The width of the video
     * @param int    $height     The height of the video
     * 
     * @return String the filename of the ipod video
     */
    public function createIpodVideo($format, $width, $height) 
    {
        $ipodVideoName = $this->_directory . "/ipod-" . $this->_filename . "." . $format;
        
        $cmd = HV_FFMPEG . " -i " . $this->_directory . "/frames/frame%d.bmp -r " . $this->_frameRate
            . " -f mp4 -b 800k -coder 0 -bt 200k -maxrate 96k -bufsize 96k -rc_eq 'blurCplx^(1-qComp)' -level 30 "
            . "-refs 1 -subq 5 -g 30 -s " . $width . "x" . $height . " " 
            . $this->_macFlags . " " . $ipodVideoName;
            
        exec(escapeshellcmd($cmd));

        // Check to ensure that movie size is valid
        if (filesize($ipodVideoName) < 1000)
            throw new Exception("FFmpeg error encountered: Unable to create iPod video.");

        return $ipodVideoName;
    }
}
?>
