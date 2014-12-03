<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helper_HelioviewerLayers Class Definition
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * A simple class to represent one or more Helioviewer layers in a request.
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 * TODO 11/23/2010: Check to make sure number of valid layers is > 0
 * and stop execution otherwise
 */
require_once HV_ROOT_DIR.'/../src/Database/ImgIndex.php';

class Helper_HelioviewerLayers {

    private $_layers = array();
    private $_layerString;
    private $_db;

    /**
     * Creates a new HelioviewerLayers instance
     *
     * @param string $layerString Layer string in one of two recognized
     *                            formats:
     *                            [obs,inst,det,meas,visible,opacity] or
     *                            [sourceId,visible,opacity].
     *
     * @return void
     */
    public function __construct($layerString) {

        $this->_layerString = $layerString;

        $this->_db = new Database_ImgIndex();

        $layerStringArray = explode('],[', substr($layerString, 1, -1));

        // Process individual layers in string
        foreach ($layerStringArray as $singleLayerString) {
            $layer = $this->_decodeSingleLayerString($singleLayerString);

            // Only include layer if it is visible
            if ($layer['visible'] && ($layer['opacity'] > 0)) {
                array_push($this->_layers, $layer);
            }
        }

        // Check to make sure at least one valid layer was specified
        if (sizeOf($this->_layers) === 0) {
            throw new Exception(
                'No valid and visible layers specified for request.', 20);
        }
    }

    /**
     * Returns the number of layers in the collection
     *
     * @return int Number of layers in request
     */
    public function length() {
        return sizeOf($this->_layers);
    }

    /**
     * Returns the layers as an array of associative arrays
     *
     * @return array An array of hashes repre$layersenting the requested layers
     */
    public function toArray() {
        return $this->_layers;
    }

    /**
     * Returns a bitmask (binary string) representation of the datasources
     * included in the HelioviewerLayers object
     *
     * @return {string} A bitmask string, e.g. "10010000000000"
     */
    public function getBitMask() {
        $ids = array();

        foreach($this->_layers as $layer) {
            array_push($ids, $layer['sourceId']);
        }
        rsort($ids);

        $bitArray = array_pad(array(), $ids[0] + 1, 0);

        foreach ($ids as $id) {
            $bitArray[$ids[0] - $id] = 1;
        }

        return implode($bitArray);
    }

    /**
     * Returns a string representation of the request layers suitable for use
     * in queries
     *
     * @return string String representation of the request layers for use in
     *                API queries
     */
    public function serialize() {
        return $this->_layerString;
    }

    /**
     * Returns a human-readable representation of the request layers
     *
     * @return string Human-readable string
     */
    public function toHumanReadableString() {
        $layerString = '';
        foreach ($this->_layers as $i=>$layer) {
            foreach ($layer['uiLabels'] as $i=>$obj) {
                $layerString .= $obj['name'] . ' ';
            }
            $layerString = substr($layerString,0,-1) . ', ';
        }
        $layerString = substr($layerString,0,-2);

        return $layerString;
    }

    /**
     * Returns a string reprentation of the request layers suitable for use
     * in filenames
     *
     * @return string String representation of the request layers for use in
     *                filenames, etc.
     */
    public function toString() {
        $layerString = '';

        foreach ($this->_layers as $layer) {
            $layerString .= str_replace(' ', '_', $layer['name']) . '__';
        }

        // remove trailing __
        return substr($layerString, 0, -2);
    }

    /**
     * Takes a single layer string and converts it to a more convenient associative array. filling in any
     * missing details as neccessary
     *
     * @param string $layerString A single layer represented as a string in one of the two following forms:
     *                            [obs,inst,det,meas,visible,opacity] or [sourceId,visible,opacity]
     *
     * @return array Associative array representation of the layer
     */
    private function _decodeSingleLayerString($layerString) {
        // Break up string into individual components
        $layerArray = explode(',', $layerString);

        if (sizeOf($layerArray) == 3) {
            // [sourceId,visible,opacity]
            list($sourceId, $layeringOrder, $opacity) = $layerArray;

            $source = $this->_db->getDatasourceInformationFromSourceId($sourceId);

            $layeringOrder = $layeringOrder;
            $name          = $source['name'];
            $uiLabels      = $source['uiLabels'];
        }
        else  {
            $opacity       = array_pop($layerArray);
            $layeringOrder = array_pop($layerArray);

            $info = $this->_db->getDatasourceInformationFromNames(
                        $layerArray);
            $sourceId      = $info["id"];
            $name          = $info["name"];
            $layeringOrder = $layeringOrder;
            $uiLabels      = $info['uiLabels'];

        }

        // Associative array form
        return array (
            'name'          => $name,
            'sourceId'      => (int)$sourceId,
            'layeringOrder' => (int)$layeringOrder,
            'uiLabels'      => $uiLabels,
            'visible'       => ($layeringOrder > 0) ? true : false,
            'opacity'       => (int)$opacity
        );
    }
}
?>
