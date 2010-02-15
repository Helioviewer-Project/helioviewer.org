<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * JHelioviewer Module Tests
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'PHPUnit/Framework.php';
require_once "lib/Config.php";
require_once 'lib/Module/JHelioviewer.php';
/**
 * JHelioviewer Module Tests
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class JHelioviewerTest extends PHPUnit_Framework_TestCase
{
    protected $jhelioviewerModule;

    /**
     * Sets up test environment
     *
     * @return void
     */
    protected function setUp()
    {
        $config = new Config("../settings/Config.ini");
    }

    /**
     * Tests HTTP -> JPIP URI translation method
     *
     * @test
     */
    public function getJPIPURL()
    {
        $params = array(
            'action'      => 'getJP2Image',
            'observatory' => 'SOHO',
            'instrument'  => 'LASCO',
            'detector'    => 'C2',
            'measurement' => 'white light',
            'date'        => '2003-10-05T00:00:00Z',
            'getJPIP'     => 'true'
        );

        $jhv = new Module_JHelioviewer($params);

        $url         = "/var/www/jp2/v0.6/2009/01/01/SOHO/LASCO/C2/white-light/test.jp2";
        $jp2Dir      = "/var/www/jp2/v0.6";
        $jpipRootURL = "jpip://localhost:8090/v0.6";
        $expected    = "jpip://localhost:8090/v0.6/2009/01/01/SOHO/LASCO/C2/white-light/test.jp2";

        $actual = $this->jhelioviewerModule->_getJPIPURL($url, $jp2Dir, $jpipRootURL);

        $this->assertEquals($actual, $expected);
    }
}
?>