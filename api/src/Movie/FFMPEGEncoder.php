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
    private $_title;
    private $_description;
    private $_comment;    
    
    /**
     * Constructor
     * 
     * @param {int} $frameRate The number of frames per second in the movie
     * 
     * @return void
     */
    public function __construct($directory, $filename, $frameRate, $width, $height, $title, $description, $comment)
    {
        $info = pathinfo($filename);
        
        $this->_directory   = $directory;
        $this->_filename    = $filename;
        $this->_frameRate   = $frameRate;
        $this->_width       = $width;
        $this->_height      = $height;
        $this->_title       = $title;
        $this->_description = $description;
        $this->_comment     = $comment;
        $this->_format      = $info['extension'];
        
        $this->_log = fopen($directory . 'ffmpeg.log', 'a');
    }
    
    /**
     * Creates a medium quality video
     */
    public function createVideo()
    {
        $outputFile = $this->_directory . $this->_filename;

        if ($this->_format == "mp4") {
            $this->_createH264Video($outputFile);
        } else if ($this->_format == "webm") {
            $this->_createWebMVideo($outputFile);
        }
        
        // If FFmpeg segfaults, an empty movie container may still be produced,
        if (!file_exists($outputFile) || filesize($outputFile) < 1000)
            throw new Exception("FFmpeg error encountered.", 43);

        return $outputFile;
    }
    
    /**
     * Creates a high quality video
     */
    public function createHQVideo()
    {
        $baseFilename = substr($this->_filename, 0, -strlen($this->_format) - 1);
        $outputFile = sprintf("%s%s-hq.%s", $this->_directory, $baseFilename, $this->_format);
        
        if ($this->_format == "mp4") {
            $this->_createH264Video($outputFile, HV_X264_HQ_PRESET, 15);
        } else if ($this->_format == "webm") {
            $this->_createWebMVideo($outputFile, 1);
        }
        
        // If FFmpeg segfaults, an empty movie container may still be produced
        if (!file_exists($outputFile) || filesize($outputFile) < 1000)
            throw new Exception("FFmpeg error encountered.", 43);

        return $outputFile;
    }
    
    /**
     * Creates a WebM/VP8 video
     */
    private function _createWebMVideo($outputFile, $qmax=40)
    {
        //$cmd = HV_FFMPEG . " -r " . $this->_frameRate . " -i " . $this->_directory . "/frames/frame%d.bmp"
        //    . " -r " . $this->_frameRate . " -f webm -vcodec libvpx -qmax $qmax -threads " . HV_FFMPEG_MAX_THREADS 
        //    . " -s " . $this->_width . "x" . $this->_height . " -an -y $outputFile";
        $cmd = sprintf(
            "%s -r %f -i %sframes/frame%%d.bmp -r %f -f webm -vcodec libvpx -qmin 1 -qmax %d %s -threads %d -s %dx%d -an -y %s 2>/dev/null",
            HV_FFMPEG,
            $this->_frameRate,
            $this->_directory,
            $this->_frameRate,
            $qmax,
            $this->_getMetaDataString(),
            HV_FFMPEG_MAX_THREADS,
            $this->_width,
            $this->_height,
            $outputFile
        );
        
        $this->_logCommand($cmd);

        // Run FFmpeg        
        $output = shell_exec($cmd);
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
    private function _createH264Video($outputFile, $preset=HV_X264_PRESET, $crf=18)
    {
        // Include x264 FFpreset if specified
        if ($preset) {
            $ffpreset = "-vpre $preset ";
        } else {
            $ffpreset = "";
        }
        $cmd = HV_FFMPEG . " -r " . $this->_frameRate . " -i " . $this->_directory . "frames/frame%d.bmp"
            . " -r " . $this->_frameRate . " -vcodec libx264 " . $ffpreset . $this->_getMetaDataString() . "-threads " 
            . HV_FFMPEG_MAX_THREADS . " -crf $crf -s " . $this->_width . "x" . $this->_height . " -an -y $outputFile 2>/dev/null";
            
        $this->_logCommand($cmd);
            
        // Run FFmpeg
        $output = shell_exec($cmd);
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
        $file = $this->_directory . substr($this->_filename, 0, -4);
        
        $cmd = sprintf("%s -i %s.mp4 -vcodec copy %s -threads %d %s.flv 2>/dev/null",
            HV_FFMPEG,
            $file,
            $this->_getMetaDataString(),
            HV_FFMPEG_MAX_THREADS,
            $file
        );

        $this->_logCommand($cmd);
        exec($cmd);

        // Check to ensure that movie size is valid
        if (filesize($file . ".flv") < 1000)
            throw new Exception("FFmpeg error encountered: Unable to create flv.", 43);
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
        
        $macFlags = "-flags +loop -cmp +chroma -vcodec libx264 -me_method 'hex' -me_range 16 "
                  . "-keyint_min 25 -sc_threshold 40 -i_qfactor 0.71 -b_strategy 1 -qcomp 0.6 -qmin 10 "
                  . "-qmax 51 -qdiff 4 -bf 3 -directpred 1 -trellis 1 -wpredp 2 -an -y";
        
        $cmd = HV_FFMPEG . " -i " . $this->_directory . "/frames/frame%d.bmp -r " . $this->_frameRate
            . " -f mp4 -b 800k -coder 0 -bt 200k -maxrate 96k -bufsize 96k -rc_eq 'blurCplx^(1-qComp)' -level 30 "
            . "-refs 1 -subq 5 -g 30 -s " . $width . "x" . $height . " $macFlags $ipodVideoName";
            
        exec($cmd);

        // Check to ensure that movie size is valid
        if (filesize($ipodVideoName) < 1000)
            throw new Exception("FFmpeg error encountered: Unable to create iPod video.", 43);

        return $ipodVideoName;
    }
    
    /**
     * Adjusts the movie format that is used when encoding videos
     * 
     * @param {string} $format Extension for the format to switch to
     * 
     * @return void
     */
    public function setFormat($format) {
        $this->_format = $format;
        $this->_filename = str_replace(array("webm", "mp4"), $format, 
                            $this->_filename);
    }

    /**    
     * Log FFmpeg command
     */
    private function _logCommand($cmd)
    {
        $message = "========================================================\n" 
                 . "$cmd\n";
        fwrite($this->_log, $message);
    }
    
    /**
     * Creates the portion of the ffmpeg command relating to metadata properties
     */
    private function _getMetaDataString()
    {
        return sprintf(
            '-metadata title="%s" -metadata artist="Helioviewer.org" ' . 
            '-metadata description="%s" -metadata comment="%s" -timestamp "%s" ',
            $this->_title,
            $this->_description,
            str_replace(array("mp4", "webm"), $this->_format, $this->_comment),
            date("Y-m-d\TH:i:s\Z")
        );
    }
}
?>
