<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer InputValidator Bad Input Tests
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
require_once 'lib/Validation/InputValidator.php';
/**
 * Helioviewer InputValidator Tests
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class InputValidator_BadInputTest extends PHPUnit_Framework_TestCase
{
    protected $inputValidator;

    /**
     * Sets up test environment
     *
     * @return void
     */
    protected function setUp()
    {
        $this->inputValidator = new Validation_InputValidator();
    }

    /**
     * Tests method which checks for required parameters
     *
     * @param array $required A list of the required parameters for a given action
     * @param array $params   The parameters that were passed in
     *
     * @test
     * @covers Validation_InputValidator::checkForMissingParams
     * @dataProvider missingParameterProvider
     * @expectedException Exception
     *
     * @return void
     */
    public function checkForMissingParams($required, $params)
    {
        Validation_InputValidator::checkForMissingParams($required, $params);
    }

    /**
     * Data provider for checkForMissingParams
     *
     * @return array Input with some required parameters missing
     */
    public function missingParameterProvider()
    {
        return array(
            array(
                array("required", "zero", "bool"),
                array("required" => "string", "zero" => "0", "forgot" => "boolean")
            ),
            array(
                array("required", "zero", "bool"),
                array()
            )
        );
    }
}
?>