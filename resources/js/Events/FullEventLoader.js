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

    _eventMarkers = {};
    _eventSelections = {};
    _eventLegacySelections = {};
	_reactRoots = {};

    constructor(debug) {

        super();

        this.container = $('#EventLayerAccordion-Container');
        this.debug = debug;

		this._eventMarkers = Object.fromEntries(EventLoader.sources.map(s => [s, []]));
		this._eventSelections = Object.fromEntries(EventLoader.sources.map(s => [s, []]));
		this._eventLegacySelections = Object.fromEntries(EventLoader.sources.map(s => [s, []]));

		const selections = Object.fromEntries(EventLoader.sources.map(s => [s, null]));

		if (Helioviewer.urlSettings.loadState) {
			EventLoader.sources.forEach(s => {
				selections[s] = Helioviewer.userSettings.get("state.events_v2.tree_" + s + ".layers_v2")	
			});
		}

		if (typeof Helioviewer.urlSettings.eventLayers != 'undefined' && Helioviewer.urlSettings.eventLayers != "" && Helioviewer.urlSettings.eventLayers.length > 0) {

            const legacyEventString = "["+Helioviewer.urlSettings.eventLayers.join("],[")+"]";
            const legacyEventLayers = FullEventLoader.translateLegacyEventURLsToSelections(legacyEventString);

            for(const layerSource in legacyEventLayers) {
				selections[layerSource] = legacyEventLayers[layerSource]	
            }

        } 

        this.draw(selections).then(() => {
            this._markReady()
        }).catch(err => {
            this.error = err
            this._markReady()
        });

		$(document).on('observation-time-changed', (e) => {
            this._markNotReady();
			this.ready(el => {
				el.draw()
			});
            this._markReady();
		});
		
    }

	getSelections(source=null) {
		if (source === null) {
			return Object.values(this._eventSelections).flat();
		} else {
			return this._eventSelections[source];
		}
	}

	getLegacySelections(source=null) {
		if (source === null) {
			return Object.values(this._eventLegacySelections).flat();
		} else {
			return this._eventLegacySelections[source];
		}
	}

    makeHoveredEventsUpdate(source) {
        return (hoveredEvents) => {
            this._eventMarkers[source].forEach(em => {
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
    makeEventsUpdate(source, eventGlossary) {

        return (events, selections) => {

            $('#'+source+'-event-container').remove()

            let eventContainer = $('<div id="'+source+'-event-container" class="event-container"></div>').appendTo("#moving-container");

            let i = 0;

            let allEventMarkers = [];

            this._eventMarkers[source] = [];

            events.forEach(e => {

                let eventMarker = new EventMarker(
                    eventGlossary, 
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

			console.log(selections);
			console.log(source);
			console.log(events);
			let legacySelections = EventLoader.translateSelectionsToLegacyEventLayers(selections, source, events);

            this._eventMarkers[source] = allEventMarkers;
            this._eventLegacySelections[source] = legacySelections;
            this._eventSelections[source] = selections;

            let legacyKey = "state.events_v2.tree_" + source + ".layers";
            let newKey = "state.events_v2.tree_" + source + ".layers_v2";

            Helioviewer.userSettings.set(legacyKey, legacySelections);
            Helioviewer.userSettings.set(newKey, selections);

            $(document).trigger("change-feature-events-state");
        };

    }

    makeToggleVisibility(source) {
        return (newVisibility) => {
            this._eventMarkers[source].forEach(em => {
                em.marker.setVisibility(newVisibility);
            })
            Helioviewer.userSettings.set("state.events_v2.tree_" + source + ".markers_visible", newVisibility);
        }
    }

    makeToggleLabelVisibility(source) {
        return (newVisibility) => {
            this._eventMarkers[source].forEach(em => {
                em.marker.setLabelVisibility(newVisibility);
            })
            Helioviewer.userSettings.set("state.events_v2.tree_" + source + ".labels_visible", newVisibility);
        }
    }

	draw(selections) {

        return this.getEventGlossary().then(glossary => {

            Helioviewer.userSettings.iterateOnHelioViewerEventLayerSettings(l => {

				let source = l.id;

				if(!this._reactRoots.hasOwnProperty(source)) {
					this._reactRoots[source] = createRoot($('#event-tree-container-'+source)[0]);
				}

				let forcedSelections = null
				if (selections != undefined) {
					forcedSelections = selections[source]
				}
//
				console.log("draw", l.id, forcedSelections);

				this._reactRoots[source].render(<HelioviewerEventTree 

					source={source}  
					apiURL={Helioviewer.api}
					eventsDate={new Date(Helioviewer.userSettings.get("state.date"))} 

					onEventsUpdate={this.makeEventsUpdate(source, glossary)} 
					onHoveredEventsUpdate = {this.makeHoveredEventsUpdate(source)}

					onToggleVisibility={this.makeToggleVisibility(source)} 
					onToggleLabelVisibility={this.makeToggleLabelVisibility(source)} 

					visibility={Helioviewer.userSettings.get("state.events_v2.tree_" + source + ".markers_visible")}
					labelVisibility={Helioviewer.userSettings.get("state.events_v2.tree_" + source + ".labels_visible")}
					forcedSelections={forcedSelections} 

				/>);
			})
		});

	}

    setFromSourceLegacyEventString(legacyEventString) {
        const selections = EventLoader.translateLegacyEventURLsToSelections(legacyEventString);
        return this.draw(selections);
    }

    setFromSelections(selections) {
		const selectionsBySources = Object.fromEntries(EventLoader.sources.map(s => [s, selections.filter(sl => sl.startsWith(s))]));
        return this.draw(selectionsBySources);
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

		const markers = Object.values(this._eventMarkers).flat();

		for(const m of markers) {
			m.marker.setVisibility(m.marker.event_type == eventPin);
		}
	}

    highlightEventsFromEventID(id) {

		const markers = Object.values(this._eventMarkers).flat();

		for(const m of markers) {
			m.marker.setVisibility(m.marker.id == id);
		}
	}

	removeHighlight() {
		for(const s in this._eventMarkers) {
			for(const m of this._eventMarkers[s]) {
				m.marker.setVisibility(Helioviewer.userSettings.get("state.events_v2.tree_" + s + ".markers_visible"));
			}
		}
	}
}

export { FullEventLoader }
