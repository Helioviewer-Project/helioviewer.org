<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer.org Movie Builder Resque Job
 *
 * PHP version 5
 *
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

/**
 * Helioviewer.org Movie Builder Resque Job
 *
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
include_once 'src/Movie/HelioviewerMovie.php';
include_once 'lib/Redisent/Redisent.php';

class Job_MovieBuilder
{
    public function perform()
    {
        printf("Starting movie %s\n", $this->args['movieId']);
        
        $redis = new Redisent('localhost');
        
        # Build movie
        try {
            $movie = new Movie_HelioviewerMovie($this->args['movieId']);
            $movie->build();
        } catch (Exception $ex) {
            printf("Error processing movie %s\n", $this->args['movieId']);
            $redis->decrby('helioviewer:movie_queue_wait', $this->args['eta']);
            throw $ex;
        }
        
        printf("Finished movie %s\n", $this->args['movieId']);
        
        # Decrement movie queue wait counter
        $redis->decrby('helioviewer:movie_queue_wait', $this->args['eta']);
    }
}
