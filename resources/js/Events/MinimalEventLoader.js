/**
 * @fileOverview Loads events and all related components
 * @author Kasim Necdet Percinel <kasim.n.percinel@nasa.gov>
 */

"use strict";
import { createRoot } from "react-dom/client";
import React from "react";
import EventLoader from "./EventLoader";

class MinimalEventLoader extends EventLoader {
  eventsCache = {};

  getEvents(source) {
    const eventsDate = new Date(Helioviewer.userSettings.get("state.date"));
    const cacheKey = `${source}>>${eventsDate.toISOString()}`;

    if (this.eventsCache.hasOwnProperty(cacheKey)) {
      return Promise.resolve(this.eventsCache[cacheKey]);
    }

    const sourceParam = `sources=${source}`;

    const apiURL = Helioviewer.api;

    return fetch(`${apiURL}?startTime=${encodeURIComponent(eventsDate.toISOString())}&action=events&${sourceParam}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Could not fetch events information for ${source}. Status: ${res.status}`);
        }
        return res.json();
      })
      .then((events) => {
        this.eventsCache[cacheKey] = this.parseEvents(events);
        return this.eventsCache[cacheKey];
      });
  }

  constructor(debug) {
    super();

    const eventPromises = EventLoader.sources.map((s) => this.getEvents(s));

    Promise.all(eventPromises)
      .then(() => {
        this.markReady();
      })
      .catch((err) => {
        this.error = err;
        this.markReady();
      });

    $(document).on("observation-time-changed", async (e) => {
      this.markNotReady();
      await this.draw();
      this.markReady();
    });

    $("#k12-events-visibility-btn").click((e) => {
      e.stopPropagation();

      const currentVisibility = $("#k12-events-visibility-btn").data("events-visible");
      const newVisibility = !currentVisibility;
      const newVisibilityText = newVisibility ? "EVENTS ARE ON" : "EVENTS ARE OFF";
      const newEyeClass = newVisibility ? "fa-eye" : "fa-eye-slash";

      $("#k12-events-visibility-btn").data("events-visible", newVisibility);
      $("#k12-events-btn-text").text(newVisibilityText);

      $("#k12-events-visibility-btn #visibilityBtn").removeClass("fa-eye fa-eye-slash hidden");
      $("#k12-events-visibility-btn #visibilityBtn").addClass(newEyeClass);
      $("#k12-events-visibility-btn #visibilityBtn").addClass(newVisibility ? "" : "hidden");

      $("#minimal-event-container").toggle();
    });
  }

  setFromSourceLegacyEventString(legacyEventString) {
    // console.log(source)
    const legacyEventsLayers = EventLoader.translateLegacyEventURLsToLegacyEventLayers(legacyEventString);

    // Required for screenshots to work
    Helioviewer.userSettings.iterateOnHelioViewerEventLayerSettings((l) => {
      Helioviewer.userSettings.set("state.events_v2.tree_" + l.id + ".layers", legacyEventsLayers[l.id]);
    });

    const selections = EventLoader.translateLegacyEventURLsToSelections(legacyEventString);

    Helioviewer.userSettings.iterateOnHelioViewerEventLayerSettings((l) => {
      Helioviewer.userSettings.set("state.events_v2.tree_" + l.id + ".layers_v2", selections[l.id]);
    });

    this.draw();
  }

  draw() {
    const visibility = $("#k12-events-visibility-btn").data("events-visible");

    $("#minimal-event-container").remove();

    const eventContainer = $('<div id="minimal-event-container" class="event-container"></div>').appendTo(
      "#moving-container"
    );

    if (!visibility) {
      $("#minimal-event-container").hide();
    }

    let i = 0;

    Helioviewer.userSettings.iterateOnHelioViewerEventLayerSettings((l) => {
      this.getEvents(l.id).then((events) => {
        l.layers_v2.forEach((selection) => {
          let [selectionSource, selectionEventType, selectionFrm] = selection.split(">>");

          if (selectionFrm) {
            if (events.hasOwnProperty(selection)) {
              events[selection].forEach((e) => new EventMarker(this.eventGlossary, eventContainer, e, i++, true, true));
            }
          } else {
            let prefix = selectionSource + ">>" + selectionEventType + ">>";
            for (let key in events) {
              if (key.startsWith(prefix)) {
                events[key].forEach((e) => new EventMarker(this.eventGlossary, eventContainer, e, i++, true, true));
              }
            }
          }
        });
      });
    });
  }

  parseEvents(eventData) {
    const extractEvents = (frmNode) => {
      if (frmNode.hasOwnProperty("data")) {
        return frmNode["data"];
      }

      if (frmNode.hasOwnProperty("groups")) {
        const events = [];

        for (const g of frmNode["groups"]) {
          events.push(...extractEvents(g));
        }

        return events;
      }

      throw new Error("Could not parse events");
    };

    let events = {};

    for (const et of eventData) {
      let eventPin = et["pin"];

      for (const frmNode of et["groups"]) {
        let frmNodePin = frmNode["name"];
        let eventsKey =
          EventLoader.eventLabelsMap[eventPin].source +
          ">>" +
          EventLoader.eventLabelsMap[eventPin].name +
          ">>" +
          frmNodePin;

        if (!events.hasOwnProperty(eventsKey)) {
          events[eventsKey] = [];
        }

        events[eventsKey].push(...extractEvents(frmNode));
      }
    }

    return events;
  }
}

export { MinimalEventLoader };
