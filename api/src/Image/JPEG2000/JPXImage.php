<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * JPEG 2000 JPX Image Class Definition
 *
 * = 02/13/2010 =
 * MJ2 Creation has been removed since it is not currently being used.
 * To add support back in the future simply follow the same steps as for JPX
 * generation, but pass kdu_merge the additional sub-command:
 *
 *     -mj2_tracks P:0-@25
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Class for working with JPX images.
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Image_JPEG2000_JPXImage
{
    protected $frames;
    protected $linked;
    protected $outputFile;

    /**
     * Creates a JPXImage instance
     *
     * @param string $outputFile Location where JPX image should be stored
     *
     * @return void
     */
    public function __construct($outputFile)
    {
        $this->outputFile = $outputFile;
    }

    /**
     * Given a set of JP2 images, runs kdu_merge to build a single JPX image from them
     *
     * @param array  $frames   A list of JP2 filepaths
     * @param bool   $linked   If true, then a linked JPX file will be created
     * @param string $kduMerge [Optional] kdu_merge binary location
     * @param string $pathCmd  [Optional] String to prepend to merge command (e.g. for setting environmental varibles)
     *
     * @return void
     */
    protected function buildJPXImage($frames, $linked, $kduMerge = HV_KDU_MERGE_BIN)
    {
        //Append filepaths to kdu_merge command
        $cmd =  "$kduMerge -i ";

        foreach ($frames as $jp2) {
            if ( @filesize($jp2) === false ) {
                error_log('File is missing:  '.$jp2);
            }
            else {
                $cmd .= "$jp2,";
            }
        }

        // Drop trailing comma
        $cmd = substr($cmd, 0, -1);

        // Virtual JPX files
        if ($linked) {
            $cmd .= " -links";
        }

        $cmd .= " -o " . $this->outputFile;

        // Execute kdu_merge command
        exec(escapeshellcmd($cmd), $output, $return);
    }

    /**
     * Prints a JPX image to the screen
     *
     * @return void
     */
    public function displayImage()
    {
        $fp   = fopen($this->outputFile, 'r');
        $stat = stat($this->outputFile);

        $filename = basename($this->outputFile);

        header("Content-Length: " . $stat['size']);
        header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JPX));
        header("Content-Disposition: attachment; filename=\"$filename\"");

        $contents = fread($fp, $stat['size']);

        echo $contents;
        fclose($fp);
    }
}
?>
