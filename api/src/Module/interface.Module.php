<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Module Interface
 *
 * PHP version 5
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jonathan Harper <jwh376@msstate.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
interface Module {
    /**
     * Executes the requested action
     *
     * @return void
     */
    public function execute();
    /**
     * Contains logic neccessary to validate any action supported by a given
     * module
     *
     * @return void
     */
    public function validate();
}