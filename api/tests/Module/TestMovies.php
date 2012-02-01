<?php
/**
 * Helioviewer Movies Module unit tests
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Helper/Config.php';
require_once 'src/Module/Movies.php';
/**
 * Helioviewer Movies Module unit tests
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class TestModule_Movies extends PHPUnit_Framework_TestCase
{
    protected $moviesModule;
    /**
     * Sets up test environment
     *
     * @return void
     */
    protected function setUp()
    {
        $config = new Config("../settings/Config.ini");
    }
}
?>