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
class InputValidator_GoodInputTest extends PHPUnit_Framework_TestCase
{
    protected $inputValidator;
    
    /**
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
     * @param array $params  The parameters that were passed in
     * @test
     * @dataProvider checkForMissingParamsProvider
     * 
     * @return void
     */
    public function checkForMissingParams($required, $params)
    {
        // Check proper input
        try {
            Validation_InputValidator::checkForMissingParams($required, $params);
        }
        catch (Exception $ex) {
            $this->fail("Unexpected exception thrown: " . $ex->getMessage());
        }
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
            )
        );   
    }
}
?>