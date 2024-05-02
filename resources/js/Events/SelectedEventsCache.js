"use strict";

/**
 * This class is used to handle events that have been checked in the past, but don't have any active events for the current observation time.
 * In this case, these events will be stored in this cache so that they can be found at a future time when the events are back in view.
 */
class SelectedEventsCache {
    constructor() {
        /**
         * Lookup table keyed by the event and the value is the frm list and the event_instances list
         */
        this._events = {}
    }

    /**
     * Stores the given eventType, frm pair
     * @param {string} eventType Event type to cache
     * @param {string} frm Frm to cache
     */
    addFRM(eventType, frm) {
        // If the event type isn't keyed in the event table, then add it
        if (!this._events.hasOwnProperty(eventType)) {
            this._events[eventType] = {frms:[], event_instances:[]};
        }
        // Push the frm into the list, only if it is not already there
        if(!this._events[eventType].frms.includes(frm)) {
            this._events[eventType].frms.push(frm)
        }
    }


    /**
     * Stores the given eventType, event instance pair
     * @param {string} eventType Event type to cache
     * @param {string} eventInstance event instance to cache
     */
    addEventInstance(eventType, eventInstance) {
        // If the event type isn't keyed in the event table, then add it
        if (!this._events.hasOwnProperty(eventType)) {
            this._events[eventType] = {frms:[], event_instances:[]};
        }
        // Push the event instance into the list, only if it is not already there
        if(!this._events[eventType]['event_instances'].includes(eventInstance)) {
            this._events[eventType]['event_instances'].push(eventInstance);
        }
    }

    /**
     * Removes the given eventType, frm pair from the cache
     * @param {string} eventType Event type to look for in the cache
     * @param {string} frm FRM to find for the given event type
     */
    removeFRM(eventType, frm) {
        if (this._events.hasOwnProperty(eventType)) {
            let index = this._events[eventType].frms.indexOf(frm);
            if (index != -1) {
                this._events[eventType].frms.splice(index, 1);
            }
        }
    }

    /**
     * Removes the given eventType, eventInstance pair from the cache
     * @param {string} eventType Event type to look for in the cache
     * @param {string} eventInstance Event Instance to find for the given event type
     */
    removeEventInstance(eventType, eventInstance) {
        if (this._events.hasOwnProperty(eventType)) {
            let index = this._events[eventType].event_instances.indexOf(eventInstance);
            if (index != -1) {
                this._events[eventType].event_instances.splice(index, 1);
            }
        }
    }

    /**
     * Returns the cache as an iterable list of event types and frms
     * The result is something like [{event_type: 'FP', frms: ['frm_a', 'frm_b', etc], event_instances: ['FP--SIDC_Operator--ODU4YjBmYTQxNjJiYjgxN2UxZGNmODdiNzc3MzkzYThkNGM5MDA2NWFjZjhlYjI2ZGE4ZDkwZjNlNDExNmZhYg__']}]
     * @typedef {Array<EventFrmPair>} EventCache
     * @typedef {Object} EventFrmPair
     * @property {string} event_type
     * @property {Array<string>} frms
     * @return EventCache
     */
    get() {
        let cached_events = this._events;
        return Object.keys(this._events).map((eventType) => {
            return {
                event_type: eventType, 
                frms: [...cached_events[eventType].frms], // copy arrays as we are just exporting it 
                event_instances: [...cached_events[eventType].event_instances],  // copy array as we are just exporting it
            }
        })
    }
}
