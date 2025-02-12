/**
 * @fileOverview Each tile layer has closest images this class holds information about closest images per sourceId.
 * @author <a href="mailto:kasim.n.percinel@nasa.gov">Kasim Necdet Percinel</a>
 * @see TileLayerAccordiopn, ClosestImages 
 */

"use strict"
class LayerImgDates {

    nextImageDate = null;
    prevImageDate = null;

    constructor(imgDate) {

        // Create an empty one if there is no image date
        // It will always return false to hasNext and hasPrevious calls

        if (imgDate != null) {
            this.nextImageDate = imgDate.next_date;
            this.prevImageDate = imgDate.prev_date;
        }
    }

    // Returns bool if there is next image available
    hasNextImage() {
        return this.nextImageDate != null
    }

    // Returns bool if there is previous image available
    hasPrevImage() {
        return this.prevImageDate != null
    }
}

