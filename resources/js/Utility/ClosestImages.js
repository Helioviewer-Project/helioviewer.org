/**
 * @fileOverview This class keeps all the closest images per layer, 
 * @author <a href="mailto:kasim.n.percinel@nasa.gov">Kasim Necdet Percinel</a>
 * @see TileLayerAccordiopn, LayerImgDates 
 */
"use strict"
class ClosestImages {

    imageDates = {}; 

    /* Ignored source ids */
    ignores = [];

    /**
     * Gets the closest image dates per tile layer (ie sourceid) , relative to given date
     * this function loads result into promise, wait for it
     * @param {string} sourceId for given tile layer
     * @param {date} observationDate
     * @returns {Promise}
     */
    fetchClosestImageDates(sourceId, observationDate) {

        // If we are ignoring this source id
        // return a false response always
        if (this.ignores.includes(sourceId)) {
            return Promise.resolve(new LayerImgDates());
        }

        let cacheKey = observationDate.toISOString() + '_' + sourceId;

        if (this.imageDates.hasOwnProperty(cacheKey)) {
            return this.imageDates[cacheKey];
        } else {

            this.imageDates[cacheKey] = new Promise((resolve, reject) => {
                return $.ajax({
                    type: "GET",
                    url: Helioviewer.api,
                    dataType: Helioviewer.dataType,
                    data: {
                        "action": "getClosestImageDatesForSources",
                        "sources" : sourceId,
                        "date": observationDate.toISOString(),
                    },

                }).then((resp) => {
                    let imgLayerDates = new LayerImgDates(resp[sourceId]);
                    return resolve(imgLayerDates);
                }, (error) => {
                    Helioviewer.messageConsole.error("Could not load tile layer controls");
                    console.error(error);
                    return reject(error);
                });
            });

            return this.imageDates[cacheKey];

        }

    }

    /**
     * Ignore this source id for this date,
     * that yields no next and no previous image result
     * @param {string} sourceId for given tile layer
     * @param {date} observationDate
     * @returns {void} nothing to return, it is better to let it fail if any problem
     */
    ignoreSource(sourceId) {
        if (!this.ignores.includes(sourceId)) {
            this.ignores.push(sourceId);
        }
    }

}


