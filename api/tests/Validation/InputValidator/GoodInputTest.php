<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer InputValidator Good Input Tests
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Validation/InputValidator.php';
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
class InputValidator_GoodInputTest extends PHPUnit_Framework_TestCase
{
    /**
     * Tests method which checks for required parameters
     *
     * @param array $required A list of the required parameters for a given action
     * @param array $params   The parameters that were passed in
     *
     * @test
     * @covers Validation_InputValidator::checkForMissingParams
     * @dataProvider checkForMissingParamsProvider
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
     * @return array Acceptable input test cases
     */
    public function checkForMissingParamsProvider()
    {
        return array(
            array(
                array("required", "zero", "bool"),
                array("required" => "string", "zero" => "0", "bool" => "false", "optional" => "test")
            ),
            array(
                array("int", "float", "bool"),
                array("int" => "-42", "float" => "3.14", "bool" => "true")
            )
        );
    }

    /**
     * Tests method which attempts to validate and cast boolean input values
     *
     * @param array $bools  The simulated boolean user input
     * @param array $params The parameters that were passed in
     *
     * @test
     * @covers Validation_InputValidator::checkBools
     * @dataProvider checkBoolsProvider
     *
     * @return void
     */
    public function checkBools($bools, $params)
    {
        Validation_InputValidator::checkBools($bools, $params);
    }

    /**
     * Data provider for checkBools
     *
     * @return array Acceptable input test cases
     */
    public function checkBoolsProvider()
    {
        return array(
            array(
                array(),
                array()
            ),
            array(
                array("one", "two", "three", "four"),
                array("one" => "true", "two" => "False", "three" => "1", "four" => "0")
            ),
            array(
                array("not_specified"),
                array()
            )
        );
    }
}
?>