<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Movie_FFMPEGWrapper Class Definition
 *
 * PHP version 5
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Calls FFMpeg commands
 *
 * @category Movie
 * @package  Helioviewer
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Movie_FFMPEGWrapper
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
                    . "-qmax 51 -qdiff 4 -bf 3 -directpred 1 -trellis 1 -wpredp 2 -y";
        $this->_frameRate = $frameRate;
    }
    
    /**
     * Creates an ipod-compatible mp4 video
     * 
     * @param String $hq_filename the filename of the movie
     * @param String $outputDir   the path where the file will be stored
     * @param String $tmpImageDir The directory where the individual movie frames are stored
     * @param int    $width       the width of the video
     * @param int    $height      the height of the video
     * 
     * @return String the filename of the ipod video
     */
    public function createIpodVideo($hq_filename, $outputDir, $tmpImageDir, $width, $height) 
    {
        $ipodVideoName = $outputDir . "/ipod-$hq_filename";
        $cmd = "/usr/bin/ffmpeg -i " . $tmpImageDir . "/frame%d.jpg -r " . $this->_frameRate
            . " -f mp4 -acodec libmp3lame -ar 48000 -ab 64k -b 800k -coder 0 -bt 200k -maxrate "
            . "96k -bufsize 96k -rc_eq 'blurCplx^(1-qComp)' -level 30 -async 2 " 
            . "-refs 1 -subq 5 -g 30 -s " . $width . "x" . $height . " " 
            . $this->_macFlags . " " . $ipodVideoName;
        try {
            exec(escapeshellcmd($cmd));
        } catch (Exception $e) {
            logErrorMsg($e->getMessage(), true);
        }
        return $ipodVideoName;
    }
    
    /**
     * Creates a video in whatever format is given in $filename
     ********* 
     *  NOTE: Frame rate MUST be specified twice in the command, 
     *        before and after the input file, or ffmpeg will start
     *        cutting off frames to adjust for what it thinks is the right
     *        frameRate. 
     *********
     * 
     * @param String $filename    the filename of the movie
     * @param String $outputDir   the path where the file will be stored
     * @param String $tmpImageDir The directory where the individual movie frames are stored
     * @param int    $width       the width of the video
     * @param int    $height      the height of the video
     * 
     * @return String the filename of the video
     */
    public function createVideo($filename, $outputDir, $tmpImageDir, $width, $height)
    {  	
        // MCMedia player can't play videos with < 1 fps and 1 fps plays oddly. So ensure
        // fps >= 2
        $outputRate = substr($filename, -3) === "flv" ? max($this->_frameRate, 2) : $this->_frameRate;

        $cmd = "/usr/bin/ffmpeg -r " . $this->_frameRate . " -i " . $tmpImageDir . "/frame%d.jpg"
            . " -r " . $outputRate . " -vcodec libx264 -vpre hq -b 2048k -s " . $width . "x" . $height 
            . " -y " . $outputDir . "/" . $filename;
            
        try {
            exec(escapeshellcmd($cmd));
        } catch (Exception $e) {
            logErrorMsg($e->getMessage(), true);
        }
        return $filename;
    }
}
?>
