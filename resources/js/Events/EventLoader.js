import EventGlossary from './EventGlossary'

export default class EventLoader {

  static sources = ["HEK", "CCMC", "RHESSI"];

  static eventLabelsMap = {
      'AR' : { name:'Active Region', source:'HEK' },
      'CC' : { name:'Coronal Cavity', source:'HEK' },
      'CD' : { name:'Coronal Dimming', source:'HEK' },
      'CH' : { name:'Coronal Hole', source:'HEK' },
      'CJ' : { name:'Coronal Jet', source:'HEK' },
      'CE' : { name:'CME', source:'HEK' },
      'CR' : { name:'Coronal Rain', source:'HEK' },
      'CW' : { name:'Coronal Wave', source:'HEK' },
      'EF' : { name:'Emerging Flux', source:'HEK' },
      'ER' : { name:'Eruption', source:'HEK' },
      'FI' : { name:'Filament', source:'HEK' },
      'FA' : { name:'Filament Activation', source:'HEK' },
      'FE' : { name:'Filament Eruption', source:'HEK' },
      'FL' : { name:'Flare', source:'HEK' },
      'LP' : { name:'Loop', source:'HEK' },
      'OT' : { name:'Other', source:'HEK' },
      'NR' : { name:'NothingReported', source:'HEK' },
      'OS' : { name:'Oscillation', source:'HEK' },
      'PG' : { name:'Plage', source:'HEK' },
      'PT' : { name:'PeacockTail', source:'HEK'},
      'PB' : { name:'ProminenceBubble', source:'HEK'},
      'SG' : { name:'Sigmoid', source:'HEK' },
      'SP' : { name:'Spray Surge', source:'HEK' },
      'SS' : { name:'Sunspot', source:'HEK' },
      'TO' : { name:'Topological Object', source:'HEK' },
      'BU' : { name:'UVBurst', source:'HEK' },
      'HY' : { name:'Hypothesis', source:'HEK' },
      'EE' : { name:'ExplosiveEvent', source:'HEK'},
      'UNK': { name: 'Unknown', source: 'HEK'},

      'C3' : { name:'DONKI', source:'CCMC' },
      'FP' : { name:'Solar Flare Predictions', source:'CCMC' },

      'F2' : { name:'Solar Flares', source:'RHESSI' },
  };

  static make(outputType="normal", debug) {
    if (outputType == "minimal" || outputType=="embed") {
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
      this._readyQueue.forEach(cb => cb(this));
      this._readyQueue = [];
    }
  }

  markNotReady() {
    this._isReady = false;
  }

    static translateLegacyEventURLsToLegacyEventLayers(legacyEventString) {

        let eventTypeStrings = [];
        
        if(legacyEventString != 'None'){
            eventTypeStrings = legacyEventString.slice(1, -1).split("],[")
        }

        const res = Object.fromEntries(EventLoader.sources.map(s => [s, []]));

        for(const ets of eventTypeStrings) {

            let [eventType, frmsString, open]  = ets.split(",");
            let source = EventLoader.eventLabelsMap[eventType]["source"];

            res[source].push({
                event_type : eventType,
                frms       : frmsString.split(';'),
                event_instances : [],
                open       : true
            });

        }

        return res;

    }

    static translateLegacyEventURLsToSelections(legacyEventString) {

        let eventTypeStrings = [];
        
        if(legacyEventString != 'None'){
            eventTypeStrings = legacyEventString.slice(1, -1).split("],[")
        }

        const result = Object.fromEntries(EventLoader.sources.map(s => [s, []]));

        for(const ets of eventTypeStrings) {

            let [eventType, frmsString, open]  = ets.split(",");
            let source = EventLoader.eventLabelsMap[eventType]["source"];
            let eventTypeName = EventLoader.eventLabelsMap[eventType]["name"];

            if(frmsString == "all") {
                result[source].push(source+">>"+eventTypeName);
            } else {
                result[source].push(...frmsString.split(';').map(f => source+">>"+eventTypeName+ ">>" + f.replaceAll("_"," ")));
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
        }

        let transformedELP = transformEventLabelsMap(EventLoader.eventLabelsMap);
        let legacySelections = [];

        for (const cs of selections) {

            let parts = cs.split('>>');

            if(parts.length == 1) {

                let [selectedSource] = parts;

                for(let eventTypeLabel of Object.keys(transformedELP[selectedSource])) {
                    legacySelections.push({
                        event_instances : [],
                        event_type : transformedELP[selectedSource][eventTypeLabel],
                        frms: ['all'],
                        open: 1,
                    })
                }
            }

            if(parts.length == 2) {

                let [selectedSource, selectedEventTypeLabel] = parts;

                legacySelections.push({
                    event_instances : [],
                    event_type : transformedELP[selectedSource][selectedEventTypeLabel],
                    frms: ['all'],
                    open: 1,
                })

            }

            if(parts.length == 3) {

                let isFound = false;

                let [selectedSource, selectedEventTypeLabel, selectedFRM] = parts;

                // Check if this event type is already added to legacy selections 
                let selectedEventTypePin = transformedELP[selectedSource][selectedEventTypeLabel];
                let escapedSelectedFRM = selectedFRM.replace(/ /g, "_").replace(/=/g, "_").replace(/([\+\.\(\)])/g, '\\$1')

                legacySelections = legacySelections.map(s => {

                    if (s.event_type == selectedEventTypePin) {
                        isFound = true;
                        return {
                            event_instances : s.event_instances,
                            event_type : selectedEventTypePin,
                            frms: [...s.frms, escapedSelectedFRM],
                            open: 1,
                        };
                    }

                    return s
                });

                if(!isFound) {
                    legacySelections.push({
                        event_instances : [],
                        event_type : selectedEventTypePin,
                        frms: [escapedSelectedFRM],
                        open: 1,
                    })
                }

            }

            if(parts.length == 4) {

                let makeLegacyEventId = (eventPin, frmName, eventID) => {

                    let escapedFrmName = frmName.replace(/ /g, "_").replace(/=/g, "_").replace(/([\+\.\(\)])/g, '\\$1');
                    let encodedEventID = btoa(eventID).replace(/ /g, "_").replace(/=/g, "_").replace(/([\+\.\(\)])/g, '\\$1');

                    return `${eventPin}--${escapedFrmName}--${encodedEventID}`;

                };

                let [selectedSource, selectedEventTypeLabel, selectedFRM, selectedEventLabel] = parts;
                console.log(parts);
                let selectedEventTypePin = transformedELP[selectedSource][selectedEventTypeLabel];

                let legacyEventID;

                for (let se of selectedEvents) {
                    if(se.id == cs) {
                        legacyEventID = makeLegacyEventId(selectedEventTypePin, selectedFRM, se.event_data.id );
                    }
                }

                let isFound = false;

                legacySelections = legacySelections.map(s => {

                    if (s.event_type == selectedEventTypePin) {

                        isFound = true;

                        return {
                            event_instances : [...s.event_instances, legacyEventID],
                            event_type : selectedEventTypePin,
                            frms: s.frms,
                            open: 1,
                        };
                    }

                    return s
                });

                if(!isFound) {
                    legacySelections.push({
                        event_instances : [legacyEventID],
                        event_type : selectedEventTypePin,
                        frms: [],
                        open: 1,
                    })
                }
            }
        }

        return legacySelections;
    }

}
