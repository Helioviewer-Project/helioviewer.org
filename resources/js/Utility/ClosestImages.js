/**
 * @fileOverview This class keeps all the closest images per layer, 
 * @author <a href="mailto:kasim.n.percinel">Kasim Necdet Percinel</a>
 * @see TileLayerAccordiopn, LayerImgDates 
 */
"use strict"
class ClosestImages {

    imageDates = {}; 

    /**
     * Gets the closest image dates per tile layer (ie sourceid) , relative to given date
     * this function loads result into promise, wait for it
     * @param {string} sourceId for given tile layer
     * @param {date} observationDate 
     * @returns {Promise} 
     */
    fetchClosestImageDates(sourceId, observationDate) {

        let dateStr = observationDate.toISOString();

        if (!this.imageDates.hasOwnProperty(sourceId)) {
            this.imageDates[sourceId] = {};
        }

        let self = this;
        let requestPromise = new Promise((resolve, reject) => {

            if (self.imageDates[sourceId].hasOwnProperty(dateStr)) {
                resolve(self.imageDates[sourceId][dateStr]);
            } else {
                // Get all nearest image dates
                $.ajax({
                    type: "GET",
                    url: Helioviewer.api,
                    dataType: Helioviewer.dataType,
                    data: {
                        "action": "getClosestImageDatesForSources",
                        "sources" : sourceId,
                        "date": dateStr,
                    },

                }).then((resp) => {
                    let imgLayerDates = new LayerImgDates(resp[sourceId]);
                    self.imageDates[sourceId][dateStr] = imgLayerDates;
                    resolve(imgLayerDates);
                }, (error) => {
                    Helioviewer.messageConsole.warn("Could not load tile layer controls");
                    console.error(error);
                    reject(error);
                });
            }
        });

        return requestPromise;
    }
    
    
    


}


