/**
 * @fileOverview Each tile layer has closest images this class holds information about closest images per sourceId.
 * @author <a href="mailto:kasim.n.percinel">Kasim Necdet Percinel</a>
 * @see TileLayerAccordiopn, ClosestImages 
 */

class LayerImgDates {

    nextImageDate = null;
    prevImageDate = null;

    constructor(imgDate) {
        this.nextImageDate = imgDate.next_date;
        this.prevImageDate = imgDate.prev_date;
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

