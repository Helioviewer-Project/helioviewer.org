/**
 * @fileOverview Loads events and all related components
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
 */

"use strict";
import { createRoot } from "react-dom/client";
import React from "react";
import HelioviewerEventTree from "@helioviewer/event-tree";
import EventLoader from "./EventLoader";

class FullEventLoader extends EventLoader {
  markers = {};
  selections = {};
  reactRoots = {};

  constructor(debug) {
    super();

    this.container = $("#EventLayerAccordion-Container");
    this.debug = debug;

    this.markers = Object.fromEntries(EventLoader.sources.map((s) => [s, []]));
    this.selections = Object.fromEntries(EventLoader.sources.map((s) => [s, null]));

    if (Helioviewer.urlSettings.loadState) {
      const sels = Helioviewer.userSettings.get("state.event_selections") || [];
      EventLoader.sources.forEach((s) => {
        this.selections[s] = sels.filter((p) => p.startsWith(s + ">>") || p === s);
      });
    }

    if (
      typeof Helioviewer.urlSettings.eventLayers != "undefined" &&
      Helioviewer.urlSettings.eventLayers != "" &&
      Helioviewer.urlSettings.eventLayers.length > 0
    ) {
      const legacyEventString = "[" + Helioviewer.urlSettings.eventLayers.join("],[") + "]";
      const legacyEventLayers = FullEventLoader.translateLegacyEventURLsToSelections(legacyEventString);

      for (const layerSource in legacyEventLayers) {
        this.selections[layerSource] = legacyEventLayers[layerSource];
      }
    }

    $(document).on("observation-time-changed", async (e) => {
      await this.draw();
    });

    this.draw()
      .then(() => {})
      .catch((error) => {
        this.error = error;
      })
      .finally(() => {
        this.markReady();
      });

    // Keyboard button to toggle event labels (witk key "d")
    $(document).on("toggle-event-labels", (e) => {
      this.toggleEventLabels();
    });
  }

  makeHoveredEventsUpdate(source) {
    return (hoveredEvents) => {
      this.markers[source].forEach((em) => {
        if (hoveredEvents.includes(em.id)) {
          em.marker.emphasize();
        } else {
          em.marker.deEmphasize();
        }
      });
    };
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
      $("#" + source + "-event-container").remove();

      let eventContainer = $('<div id="' + source + '-event-container" class="event-container"></div>').appendTo(
        "#moving-container"
      );

      let i = 0;

      let allEventMarkers = [];

      this.markers[source] = [];

      events.forEach((e) => {
        let eventMarker = new EventMarker(
          this.eventGlossary,
          eventContainer,
          e.event_data,
          i + 1,
          Helioviewer.userSettings.get("state.event_visibility_selections")[source]?.label_visibility ?? true,
          Helioviewer.userSettings.get("state.event_visibility_selections")[source]?.marker_visibility ?? true
        );

        allEventMarkers[i] = {
          marker: eventMarker,
          id: e.id
        };

        i = i + 1;
      });

      this.markers[source] = allEventMarkers;
    };
  }

  makeSelectionsUpdate(source) {
    return (selections, events) => {
      this.selections[source] = selections;

      // Cross-source union: state.event_selections is the single flat source of truth
      // for any consumer that doesn't care which source a selection came from.
      const union = Array.from(
        new Set(
          Object.values(this.selections)
            .flat()
            .filter((s) => s != null)
        )
      );
      Helioviewer.userSettings.set("state.event_selections", union);

      $(document).trigger("change-feature-events-state");
    };
  }

  makeToggleVisibility(source) {
    return (newVisibility) => {
      this.markers[source].forEach((em) => {
        em.marker.setVisibility(newVisibility);
      });

      let eventVisibilitySelections = Helioviewer.userSettings.get("state.event_visibility_selections");
      eventVisibilitySelections[source] = eventVisibilitySelections[source] ?? {
        marker_visibility: true,
        label_visibility: true
      };
      eventVisibilitySelections[source].marker_visibility = newVisibility;
      Helioviewer.userSettings.set("state.event_visibility_selections", eventVisibilitySelections);

      this.draw();
    };
  }

  makeToggleLabelVisibility(source) {
    return (newVisibility) => {
      this.markers[source].forEach((em) => {
        em.marker.setLabelVisibility(newVisibility);
      });

      let eventVisibilitySelections = Helioviewer.userSettings.get("state.event_visibility_selections");
      eventVisibilitySelections[source] = eventVisibilitySelections[source] ?? {
        marker_visibility: true,
        label_visibility: true
      };
      eventVisibilitySelections[source].label_visibility = newVisibility;
      Helioviewer.userSettings.set("state.event_visibility_selections", eventVisibilitySelections);

      this.draw();
    };
  }

  draw() {
    const promises = [];

    for (const source of EventLoader.sources) {
      if (!this.reactRoots.hasOwnProperty(source)) {
        this.reactRoots[source] = createRoot($("#event-tree-container-" + source)[0]);
      }

      promises.push(
        new Promise((resolve, reject) => {
          this.reactRoots[source].render(
            <HelioviewerEventTree
              source={source}
              apiURL={Helioviewer.api}
              eventsDate={new Date(Helioviewer.userSettings.get("state.date"))}
              onEventsUpdate={this.makeEventsUpdate(source)}
              onHoveredEventsUpdate={this.makeHoveredEventsUpdate(source)}
              onSelectionsUpdate={this.makeSelectionsUpdate(source)}
              onToggleVisibility={this.makeToggleVisibility(source)}
              onToggleLabelVisibility={this.makeToggleLabelVisibility(source)}
              visibility={
                Helioviewer.userSettings.get("state.event_visibility_selections")[source]?.marker_visibility ?? true
              }
              labelVisibility={
                Helioviewer.userSettings.get("state.event_visibility_selections")[source]?.label_visibility ?? true
              }
              forcedSelections={this.selections[source]}
              onLoad={resolve}
              onError={(err) => reject(err)}
            />
          );
        })
      );
    }

    return Promise.all(promises);
  }

  async setFromSourceLegacyEventString(legacyEventString) {
    Helioviewer.webClient.startLoading();
    this.selections = EventLoader.translateLegacyEventURLsToSelections(legacyEventString);
    await this.draw();
    Helioviewer.webClient.stopLoading();
  }

  async setFromSelections(selections) {
    Helioviewer.webClient.startLoading();
    this.selections = Object.fromEntries(
      EventLoader.sources.map((s) => [s, selections.filter((sl) => sl.startsWith(s))])
    );
    await this.draw();
    Helioviewer.webClient.stopLoading();
  }

  async toggleEventLabels() {
    let eventVisibilitySelections = Helioviewer.userSettings.get("state.event_visibility_selections");

    let weHaveAtLeastOneEvLabelsOn = false;

    for (const source of EventLoader.sources) {
      weHaveAtLeastOneEvLabelsOn =
        weHaveAtLeastOneEvLabelsOn || (eventVisibilitySelections[source]?.label_visibility ?? true);
    }

    const newLabelVisibility = !weHaveAtLeastOneEvLabelsOn;

    for (const source of EventLoader.sources) {
      eventVisibilitySelections[source] = eventVisibilitySelections[source] ?? {
        marker_visibility: true,
        label_visibility: true
      };
      eventVisibilitySelections[source].label_visibility = newLabelVisibility;
    }

    Helioviewer.userSettings.set("state.event_visibility_selections", eventVisibilitySelections);

    await this.draw();
  }

  showEventInfoDialog(eventId) {
    var markers = Object.values(this.markers).flat();
    var match = markers.find(function (m) {
      return m.marker.id === eventId;
    });
    if (match) {
      match.marker._showEventInfoDialog();
    }
  }

  highlightEventsFromEventTypePin(eventPin) {
    const markers = Object.values(this.markers).flat();

    for (const m of markers) {
      m.marker.setVisibility(m.marker.type == eventPin);
    }
  }

  highlightEventsFromEventID(id) {
    const markers = Object.values(this.markers).flat();

    for (const m of markers) {
      m.marker.setVisibility(m.marker.id == id);
    }
  }

  removeHighlight() {
    let eventVisibilitySelections = Helioviewer.userSettings.get("state.event_visibility_selections");
    for (const s in this.markers) {
      for (const m of this.markers[s]) {
        m.marker.setVisibility(eventVisibilitySelections[s]?.marker_visibility ?? true);
      }
    }
  }
}

export { FullEventLoader };
