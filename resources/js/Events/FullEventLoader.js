/**
 * @fileOverview Loads events and all related components
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
 */

"use strict";
import { createRoot } from 'react-dom/client';
import React from 'react';
import HelioviewerEventTree from './Components/HelioviewerEventTree'
import EventLoader from './EventLoader'

class FullEventLoader extends EventLoader {
    
    markers = {};
    selections = {};
    legacySelections = {};
    reactRoots = {};

    constructor(debug) {

        super();

        this.container = $('#EventLayerAccordion-Container');
        this.debug = debug;

        this.markers = Object.fromEntries(EventLoader.sources.map(s => [s, []]));
        this.legacySelections = Object.fromEntries(EventLoader.sources.map(s => [s, []]));
        this.selections = Object.fromEntries(EventLoader.sources.map(s => [s, null]));

        if (Helioviewer.urlSettings.loadState) {
            EventLoader.sources.forEach(s => {
                this.selections[s] = Helioviewer.userSettings.get("state.events_v2.tree_" + s + ".layers_v2")   
            });
        }

        if (typeof Helioviewer.urlSettings.eventLayers != 'undefined' && Helioviewer.urlSettings.eventLayers != "" && Helioviewer.urlSettings.eventLayers.length > 0) {

            const legacyEventString = "["+Helioviewer.urlSettings.eventLayers.join("],[")+"]";
            const legacyEventLayers = FullEventLoader.translateLegacyEventURLsToSelections(legacyEventString);

            for(const layerSource in legacyEventLayers) {
                this.selections[layerSource] = legacyEventLayers[layerSource]   
            }

        } 

        $(document).on('observation-time-changed', async (e) => {
            Helioviewer.webClient.startLoading();
            await this.draw()
            Helioviewer.webClient.stopLoading();
        });

        Helioviewer.webClient.startLoading();
        this.draw().then(() => {
        }).catch((error) => {
            this.error = error;
        }).finally(() => {
            this.markReady();
            Helioviewer.webClient.stopLoading();
        });

        // Keyboard button to toggle event labels (witk key "d")
        $(document).on('toggle-event-labels', (e) => {
            this.toggleEventLabels();
        });


    }

    getSelections(source=null) {
        if (source === null) {
            return Object.values(this.selections).flat().filter(s => s != null);
        } else {
            return this.selections[source] ? null : [];
        }
    }

    getLegacySelections(source=null) {
        if (source === null) {
            return Object.values(this.legacySelections).flat();
        } else {
            return this.legacySelections[source];
        }
    }

    makeHoveredEventsUpdate(source) {
        return (hoveredEvents) => {
            this.markers[source].forEach(em => {
                if(hoveredEvents.includes(em.id)) {
                    em.marker.emphasize();
                } else {
                    em.marker.deEmphasize();
                } 
            })
        }
    }

    /**
     * Creates a new Tile Layer accordion user interface component
     *
     * @param {Object} Events Reference to the application layer manager
     * @param {String} containerId ID for the outermost continer where the layer
     *                 manager user interface should be constructed
     */
    makeEventsUpdate(source) {

        return (events) => {

            $('#'+source+'-event-container').remove()

            let eventContainer = $('<div id="'+source+'-event-container" class="event-container"></div>').appendTo("#moving-container");

            let i = 0;

            let allEventMarkers = [];

            this.markers[source] = [];

            events.forEach(e => {

                let eventMarker = new EventMarker(
                    this.eventGlossary, 
                    eventContainer, 
                    e.event_data, 
                    i+1, 
                    Helioviewer.userSettings.get("state.events_v2.tree_" + source + ".labels_visible"), 
                    Helioviewer.userSettings.get("state.events_v2.tree_" + source + ".markers_visible")
                );

                allEventMarkers[i] = {
                    marker: eventMarker,
                    id: e.id
                }

                i = i + 1;
            })

            this.markers[source] = allEventMarkers;
        };

    }

    makeSelectionsUpdate(source) {

        return (selections, events) => {

            let legacySelection = EventLoader.translateSelectionsToLegacyEventLayers(selections, source, events);

            this.legacySelections[source] = legacySelection;
            this.selections[source] = selections;

            let legacyKey = "state.events_v2.tree_" + source + ".layers";
            let newKey = "state.events_v2.tree_" + source + ".layers_v2";

            Helioviewer.userSettings.set(legacyKey, legacySelection);
            Helioviewer.userSettings.set(newKey, selections);

            $(document).trigger("change-feature-events-state");
        };

    }

    makeToggleVisibility(source) {
        return (newVisibility) => {
            this.markers[source].forEach(em => {
                em.marker.setVisibility(newVisibility);
            })
            Helioviewer.userSettings.set("state.events_v2.tree_" + source + ".markers_visible", newVisibility);
        }
    }

    makeToggleLabelVisibility(source) {
        return (newVisibility) => {
            this.markers[source].forEach(em => {
                em.marker.setLabelVisibility(newVisibility);
            })
            Helioviewer.userSettings.set("state.events_v2.tree_" + source + ".labels_visible", newVisibility);
        }
    }

    draw() {

        const promises = [];

        for (const source of EventLoader.sources) {

            if(!this.reactRoots.hasOwnProperty(source)) {
                this.reactRoots[source] = createRoot($('#event-tree-container-'+source)[0]);
            }


            promises.push(new Promise((resolve, reject) => {
                this.reactRoots[source].render(<HelioviewerEventTree 

                    source={source}  
                    apiURL={Helioviewer.api}
                    eventsDate={new Date(Helioviewer.userSettings.get("state.date"))} 

                    onEventsUpdate={this.makeEventsUpdate(source)} 
                    onHoveredEventsUpdate = {this.makeHoveredEventsUpdate(source)}
                    onSelectionsUpdate={this.makeSelectionsUpdate(source)}

                    onToggleVisibility={this.makeToggleVisibility(source)} 
                    onToggleLabelVisibility={this.makeToggleLabelVisibility(source)} 

                    visibility={Helioviewer.userSettings.get("state.events_v2.tree_" + source + ".markers_visible")}
                    labelVisibility={Helioviewer.userSettings.get("state.events_v2.tree_" + source + ".labels_visible")}

                    forcedSelections={this.selections[source]} 

                    onLoad={resolve}
                    onError={(err) => reject(err)}

                />);
            }));
        }

        return Promise.all(promises);
    }

    async setFromSourceLegacyEventString(legacyEventString) {
        Helioviewer.webClient.startLoading();
        this.selections = EventLoader.translateLegacyEventURLsToSelections(legacyEventString);
        await this.draw()
        Helioviewer.webClient.stopLoading();
    }

    async setFromSelections(selections) {
        Helioviewer.webClient.startLoading();
        this.selections = Object.fromEntries(EventLoader.sources.map(s => [s, selections.filter(sl => sl.startsWith(s))]));
        await this.draw()
        Helioviewer.webClient.stopLoading();
    }

    async toggleEventLabels() {

        let weHaveAtLeastOneEvLabelsOn = false;

        for (const source of EventLoader.sources) {
            weHaveAtLeastOneEvLabelsOn = weHaveAtLeastOneEvLabelsOn || Helioviewer.userSettings.get("state.events_v2.tree_" + source + ".labels_visible");
        }

        const newLabelVisibility = !weHaveAtLeastOneEvLabelsOn;

        for (const source of EventLoader.sources) {
            Helioviewer.userSettings.set("state.events_v2.tree_" + source + ".labels_visible", newLabelVisibility);
        }

        await this.draw()
    }


    getLegacyShallowEventLayerString() {

        const selections = this.getSelections();    

        const findEventTypePin = (eventTypeStr) => {
          for (const key in EventLoader.eventLabelsMap) {
            if (EventLoader.eventLabelsMap[key].name === eventTypeStr) {
                return key;
            }
          }
        }

        const eventPinsWithFrms = {};
    
        for(const s of selections) {

            let [source, eventType, frm, eventId] = s.split(">>");
            let eventPin = findEventTypePin(eventType);

            if(!eventPinsWithFrms.hasOwnProperty(eventPin)) {
                eventPinsWithFrms[eventPin] = new Set();
            }

            if(frm != undefined) {
                eventPinsWithFrms[eventPin].add(frm);
            }

        }

        const layerStringPortions = [];

        for(const ep in eventPinsWithFrms) {

            if(eventPinsWithFrms[ep].size <= 0 || eventPinsWithFrms[ep].has("all")) {
                layerStringPortions.push("[" + ep + ",all,1]");
            } else {
                layerStringPortions.push("[" + ep + ","+[...eventPinsWithFrms[ep]].join(";")+",1]");
            }
        }

        return layerStringPortions.join(",");
    }

    highlightEventsFromEventTypePin(eventPin) {

        const markers = Object.values(this.markers).flat();

        for(const m of markers) {
            m.marker.setVisibility(m.marker.event_type == eventPin);
        }
    }

    highlightEventsFromEventID(id) {

        const markers = Object.values(this.markers).flat();

        for(const m of markers) {
            m.marker.setVisibility(m.marker.id == id);
        }
    }

    removeHighlight() {
        for(const s in this.markers) {
            for(const m of this.markers[s]) {
                m.marker.setVisibility(Helioviewer.userSettings.get("state.events_v2.tree_" + s + ".markers_visible"));
            }
        }
    }
}

export { FullEventLoader }
