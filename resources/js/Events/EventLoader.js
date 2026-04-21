import EventGlossary from "./EventGlossary";

export default class EventLoader {
  static sources = ["HEK", "CCMC", "RHESSI"];

  static eventLabelsMap = {
    AR: { name: "Active Region", source: "HEK", color: "#ff8f97" },
    CC: { name: "Coronal Cavity", source: "HEK", color: "#ff8acc" },
    CD: { name: "Coronal Dimming", source: "HEK", color: "#ffd391" },
    CH: { name: "Coronal Hole", source: "HEK", color: "#fef38e" },
    CJ: { name: "Coronal Jet", source: "HEK", color: "#9da4ff" },
    CE: { name: "CME", source: "HEK", color: "#ffb294" },
    CR: { name: "Coronal Rain", source: "HEK", color: "#ff85ff" },
    CW: { name: "Coronal Wave", source: "HEK", color: "#ebff8c" },
    EF: { name: "Emerging Flux", source: "HEK", color: "#95c6ff" },
    ER: { name: "Eruption", source: "HEK", color: "#ff8dad" },
    FI: { name: "Filament", source: "HEK", color: "#c8ff8d" },
    FA: { name: "Filament Activation", source: "HEK", color: "#7bff8e" },
    FE: { name: "Filament Eruption", source: "HEK", color: "#a3ff8d" },
    FL: { name: "Flare", source: "HEK", color: "#7affae" },
    LP: { name: "Loop", source: "HEK", color: "#7cffc9" },
    OT: { name: "Other", source: "HEK", color: "#d4d4d4" },
    NR: { name: "NothingReported", source: "HEK", color: "#d4d4d4" },
    OS: { name: "Oscillation", source: "HEK", color: "#81fffc" },
    PG: { name: "Plage", source: "HEK", color: "#ab8cff" },
    PT: { name: "PeacockTail", source: "HEK", color: "#494a37" },
    PB: { name: "ProminenceBubble", source: "HEK", color: "#b3d5e4" },
    SG: { name: "Sigmoid", source: "HEK", color: "#e986ff" },
    SP: { name: "Spray Surge", source: "HEK", color: "#ff82ff" },
    SS: { name: "Sunspot", source: "HEK", color: "#8ce6ff" },
    TO: { name: "Topological Object", source: "HEK", color: "#ca89ff" },
    BU: { name: "UVBurst", source: "HEK", color: "#ff6347" },
    HY: { name: "Hypothesis", source: "HEK", color: "#00ffff" },
    EE: { name: "ExplosiveEvent", source: "HEK", color: "#fec00a" },
    UNK: { name: "Unknown", source: "HEK", color: "#d4d4d4" },
    EP: { name: "SEPs", source: "HEK", color: "#e0b040" },
    IC: { name: "ICMEs", source: "HEK", color: "#40b0e0" },
    SR: { name: "SIRs", source: "HEK", color: "#70d070" },

    C3: { name: "DONKI", source: "CCMC", color: "#f0c060" },
    FP: { name: "Solar Flare Predictions", source: "CCMC", color: "#74b0c5" },

    F2: { name: "Solar Flares", source: "RHESSI", color: "#ff7070" }
  };

  /**
   * Returns the display color for an event type pin.
   * @param {string} type   2-letter event type pin (e.g. "AR", "FL")
   * @param {string} [fallback="#d4d4d4"] color to return if the pin is not in eventLabelsMap
   * @returns {string} hex color string
   */
  static getEventTypeColor(type, fallback = "#d4d4d4") {
    const entry = EventLoader.eventLabelsMap[type];
    return (entry && entry.color) ? entry.color : fallback;
  }

  /**
   * Returns the human-readable name for an event type pin.
   * @param {string} type   2-letter event type pin (e.g. "AR", "FL")
   * @param {string} [fallback="Unknown"] name to return if the pin is not in eventLabelsMap
   * @returns {string} display name
   */
  static getEventTypeName(type, fallback = "Unknown") {
    const entry = EventLoader.eventLabelsMap[type];
    return (entry && entry.name) ? entry.name : fallback;
  }

  static make(outputType = "normal", debug) {
    if (outputType == "minimal" || outputType == "embed") {
      return new MinimalEventLoader(debug);
    } else {
      return new FullEventLoader(debug);
    }
  }

  constructor() {
    this.eventGlossary = EventGlossary;
    this._isReady = false;
    this.error = null;
  }

  ready(callback) {
    if (this._isReady == true) {
      callback(this);
    } else {
      this._readyQueue = this._readyQueue || [];
      this._readyQueue.push(callback);
    }
  }

  markReady() {
    this._isReady = true;
    if (this._readyQueue) {
      this._readyQueue.forEach((cb) => cb(this));
      this._readyQueue = [];
    }
  }

  markNotReady() {
    this._isReady = false;
  }

  showEventInfoDialog(eventId) {
    // No-op in base class, implemented in FullEventLoader
  }

  static translateLegacyEventURLsToLegacyEventLayers(legacyEventString) {
    let eventTypeStrings = [];

    if (legacyEventString != "None") {
      eventTypeStrings = legacyEventString.slice(1, -1).split("],[");
    }

    const res = Object.fromEntries(EventLoader.sources.map((s) => [s, []]));

    for (const ets of eventTypeStrings) {
      let [eventType, frmsString, open] = ets.split(",");
      let source = EventLoader.eventLabelsMap[eventType]["source"];

      res[source].push({
        event_type: eventType,
        frms: frmsString.split(";"),
        event_instances: [],
        open: true
      });
    }

    return res;
  }

  static translateLegacyEventURLsToSelections(legacyEventString) {
    let eventTypeStrings = [];

    if (legacyEventString != "None") {
      eventTypeStrings = legacyEventString.slice(1, -1).split("],[");
    }

    const result = Object.fromEntries(EventLoader.sources.map((s) => [s, []]));

    for (const ets of eventTypeStrings) {
      let [eventType, frmsString, open] = ets.split(",");
      let source = EventLoader.eventLabelsMap[eventType]["source"];
      let eventTypeName = EventLoader.eventLabelsMap[eventType]["name"];

      if (frmsString == "all") {
        result[source].push(source + ">>" + eventTypeName);
      } else {
        result[source].push(
          ...frmsString.split(";").map((f) => source + ">>" + eventTypeName + ">>" + f.replaceAll("_", " "))
        );
      }
    }

    return result;
  }

  static translateSelectionsToLegacyEventLayers(selections, source, selectedEvents) {
    const transformEventLabelsMap = (elm) => {
      let transformedMap = {};

      for (let key in elm) {
        let eventName = elm[key].name;
        let eventSource = elm[key].source;

        if (!transformedMap[eventSource]) {
          transformedMap[eventSource] = {};
        }

        transformedMap[eventSource][eventName] = key;
      }

      return transformedMap;
    };

    let transformedELP = transformEventLabelsMap(EventLoader.eventLabelsMap);
    let legacySelections = [];

    for (const cs of selections) {
      let parts = cs.split(">>");

      if (parts.length == 1) {
        let [selectedSource] = parts;

        for (let eventTypeLabel of Object.keys(transformedELP[selectedSource])) {
          legacySelections.push({
            event_instances: [],
            event_type: transformedELP[selectedSource][eventTypeLabel],
            frms: ["all"],
            open: 1
          });
        }
      }

      if (parts.length == 2) {
        let [selectedSource, selectedEventTypeLabel] = parts;

        legacySelections.push({
          event_instances: [],
          event_type: transformedELP[selectedSource][selectedEventTypeLabel],
          frms: ["all"],
          open: 1
        });
      }

      if (parts.length == 3) {
        let isFound = false;

        let [selectedSource, selectedEventTypeLabel, selectedFRM] = parts;

        // Check if this event type is already added to legacy selections
        let selectedEventTypePin = transformedELP[selectedSource][selectedEventTypeLabel];
        let escapedSelectedFRM = selectedFRM
          .replace(/ /g, "_")
          .replace(/=/g, "_")
          .replace(/([\+\.\(\)])/g, "\\$1");

        legacySelections = legacySelections.map((s) => {
          if (s.event_type == selectedEventTypePin) {
            isFound = true;
            return {
              event_instances: s.event_instances,
              event_type: selectedEventTypePin,
              frms: [...s.frms, escapedSelectedFRM],
              open: 1
            };
          }

          return s;
        });

        if (!isFound) {
          legacySelections.push({
            event_instances: [],
            event_type: selectedEventTypePin,
            frms: [escapedSelectedFRM],
            open: 1
          });
        }
      }

      if (parts.length == 4) {
        let makeLegacyEventId = (eventPin, frmName, eventID) => {
          let escapedFrmName = frmName
            .replace(/ /g, "_")
            .replace(/=/g, "_")
            .replace(/([\+\.\(\)])/g, "\\$1");
          let encodedEventID = btoa(eventID)
            .replace(/ /g, "_")
            .replace(/=/g, "_")
            .replace(/([\+\.\(\)])/g, "\\$1");

          return `${eventPin}--${escapedFrmName}--${encodedEventID}`;
        };

        let [selectedSource, selectedEventTypeLabel, selectedFRM, selectedEventLabel] = parts;
        let selectedEventTypePin = transformedELP[selectedSource][selectedEventTypeLabel];

        let legacyEventID;

        for (let se of selectedEvents) {
          if (se.id == cs) {
            legacyEventID = makeLegacyEventId(selectedEventTypePin, selectedFRM, se.event_data.id);
          }
        }

        // If legacyEventID couldn't be found, skip this item
        if (legacyEventID) {
          let isFound = false;

          legacySelections = legacySelections.map((s) => {
            if (s.event_type == selectedEventTypePin) {
              isFound = true;

              return {
                event_instances: [...s.event_instances, legacyEventID],
                event_type: selectedEventTypePin,
                frms: s.frms,
                open: 1
              };
            }

            return s;
          });

          if (!isFound) {
            legacySelections.push({
              event_instances: [legacyEventID],
              event_type: selectedEventTypePin,
              frms: [],
              open: 1
            });
          }
        }
      }
    }

    return legacySelections;
  }
}

export { EventLoader };
