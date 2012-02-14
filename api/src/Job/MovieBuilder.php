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
        printf("Starting movie %s (%s)\n", $this->args['movieId'], strtoupper($this->args['format']));
        
        # Build movie
        $movie = new Movie_HelioviewerMovie($this->args['movieId'], $this->args['format']);
        $movie->build();
        
        # Decrement movie queue wait counter
        $redis = new Redisent('localhost');
        $redis->decrby('helioviewer:movie_queue_wait', $this->args['eta']);
        
        printf("Finished movie %s (%s)\n", $this->args['movieId'], strtoupper($this->args['format']));
        
        # If requesting an mp4, queue webm for future creation
        if ($this->args['format'] == "mp4") {
            $args = array(
                "movieId" => $this->args['movieId'],
                "format"  => "webm"
            );
            Resque::enqueue('alternate_format_movie', 'Job_AltMovieBuilder', $args, TRUE);
        }
        
    }
}

class Job_AltMovieBuilder
{
    public function perform()
    {
        printf("Starting movie %s (%s)\n", $this->args['movieId'], strtoupper($this->args['format']));
        $movie = new Movie_HelioviewerMovie($this->args['movieId'], $this->args['format']);
        $movie->build();
        printf("Finished movie %s (%s)\n", $this->args['movieId'], strtoupper($this->args['format']));
    }
}