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
include_once 'src/Helper/ErrorHandler.php';
include_once 'lib/Redisent/Redisent.php';

class Job_MovieBuilder
{
    public function perform()
    {
        printf("Starting movie %s\n", $this->args['movieId']);
        
        $redis = new Redisent('localhost');
        
        // Build movie
        try {
            $movie = new Movie_HelioviewerMovie($this->args['movieId']);
            $movie->build();
        } catch (Exception $e) {
            // Handle any errors encountered
            printf("Error processing movie %s\n", $this->args['movieId']);
            
            // If counter was increased at queue time, decrement
            if ($this->args['counter']) {
                $redis->decrby('helioviewer:movie_queue_wait', $this->args['eta']);
            }
            logErrorMsg($e->getMessage(), "Resque_");
            
            throw $e;
        }
        
        printf("Finished movie %s\n", $this->args['movieId']);
        
        // If the queue is empty and no jobs are being processed, set estimated
        // time counter to zero
        $numWorkers = sizeOf($redis->smembers("resque:workers"));
        $numWorking = sizeOf($redis-keys("resque:worker:*on_demand_movie"));
        $queueSize  = $redis->llen("resque:queue:on_demand_movie");
        
        if ($numWorking <= 1 && $queueSize == 0) {
            $redis->set('helioviewer:movie_queue_wait', 0);
            return;
        }
        
        // Otherwise, if counter was increased at queue time, decrement
        if ($this->args['counter']) {
            try {
                $redis->decrby('helioviewer:movie_queue_wait', $this->args['eta']);
            } catch (Exception $e) {
                logErrorMsg("Unable to decrement movie time counter. " .
                            "(eta: " . $this->args['eta'] . ")\n\n" . $e->getMessage(), "Resque_");
            }
        }
    }
}
