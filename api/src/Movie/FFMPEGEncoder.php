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
    private $_macFlags;
    private $_frameRate;
    
    /**
     * Constructor
     * 
     * @param {int} $frameRate The number of frames per second in the movie
     * 
     * @return void
     */
    public function __construct($frameRate)
    {
        $this->_macFlags = "-flags +loop -cmp +chroma -vcodec libx264 -me_method 'hex' -me_range 16 "
                    . "-keyint_min 25 -sc_threshold 40 -i_qfactor 0.71 -b_strategy 1 -qcomp 0.6 -qmin 10 "
                    . "-qmax 51 -qdiff 4 -bf 3 -directpred 1 -trellis 1 -wpredp 2 -an -y";
        $this->_frameRate = $frameRate;
    }
    
    /**
     * Creates an ipod-compatible mp4 video
     * 
     * @param string $directory  The directory where both files are stored
     * @param string $filename   Base filename of the video
     * @param int    $width      The width of the video
     * @param int    $height     The height of the video
     * 
     * @return String the filename of the ipod video
     */
    public function createIpodVideo($directory, $filename, $format, $width, $height) 
    {
        $ipodVideoName = "$directory/ipod-$filename.$format";
        
        $cmd = HV_FFMPEG . " -i $directory/frames/frame%d.bmp -r " . $this->_frameRate
            . " -f mp4 -b 800k -coder 0 -bt 200k -maxrate 96k -bufsize 96k -rc_eq 'blurCplx^(1-qComp)' -level 30 "
            . "-refs 1 -subq 5 -g 30 -s " . $width . "x" . $height . " " 
            . $this->_macFlags . " " . $ipodVideoName;
            
        exec(escapeshellcmd($cmd));

        // Check to ensure that movie size is valid
        if (filesize($ipodVideoName) < 1000)
            throw new Exception("FFmpeg error encountered: Unable to create iPod video.");

        return $ipodVideoName;
    }
    
    /**
     * Creates a video in whatever format is given in $filename
     * 
     * NOTE: Frame rate MUST be specified twice in the command, before and after the input file, or ffmpeg will start
     *       cutting off frames to adjust for what it thinks is the right frameRate. 
     * 
     * @param string $directory  The directory where both files are stored
     * @param string $filename   Base filename of the video
     * @param int    $width       the width of the video
     * @param int    $height      the height of the video
     * 
     * @return String the filename of the video
     */
    public function createVideo($directory, $filename, $format, $width, $height, $lossless = false)
    {
        // MCMedia player can't play videos with < 1 fps and 1 fps plays oddly. So ensure
        // fps >= 2
        $outputRate = substr($filename, -3) === "flv" ? max($this->_frameRate, 2) : $this->_frameRate;
        
        if ($lossless) {
            $rateQuality = "";
        } else {
            $rateQuality = " -crf 18";
        }
        
        $filepath = "$directory/$filename.$format";

        $cmd = HV_FFMPEG . " -r " . $this->_frameRate . " -i $directory/frames/frame%d.bmp"
            . " -r " . $outputRate . " -vcodec libx264 -vpre lossless_fast -threads " . HV_FFMPEG_MAX_THREADS 
            . $rateQuality . " -s $width" . "x" . $height . " -an -y $filepath";
            
        exec(escapeshellcmd($cmd));
            
        // If FFmpeg segfaults, an empty movie container may still be produced,
        // check to ensure that movie size is valid
        if (filesize($filepath) < 1000)
            throw new Exception("FFmpeg error encountered.");

        return $filepath;
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
    public function createAlternativeVideoFormat($directory, $filename, $origFormat, $newFormat)
    {
        $old = "$directory/$filename.$origFormat";
        $new = "$directory/$filename.$newFormat";
        
        $cmd = HV_FFMPEG . " -i $old -vcodec copy -threads " . HV_FFMPEG_MAX_THREADS . " $new";
    
        exec(escapeshellcmd($cmd));

        // Check to ensure that movie size is valid
        if (filesize($new) < 1000)
            throw new Exception("FFmpeg error encountered: Unable to create flv.");
    }
}
?>
