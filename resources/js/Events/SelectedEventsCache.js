"use strict";

/**
 * This class is used to handle events that have been checked in the past, but don't have any active events for the current observation time.
 * In this case, these events will be stored in this cache so that they can be found at a future time when the events are back in view.
 */
class SelectedEventsCache {
    constructor() {
        /**
         * Lookup table keyed by the event and the value is the frm list
         */
        this._events = {}
    }

    /**
     * Stores the given eventType, frm pair
     * @param {string} eventType Event type to cache
     * @param {string} frm Frm to cache
     */
    add(eventType, frm) {
        // If the event type isn't keyed in the event table, then add it
        if (!this._events.hasOwnProperty(eventType)) {
            this._events[eventType] = [];
        }
        // Remove the item if it exists first to make sure there's only ever one in the list.
        this.remove(eventType, frm);
        // Push the frm into the list
        this._events[eventType].push(frm);
    }

    /**
     * Removes the given eventType, frm pair from the cache
     * @param {string} eventType Event type to look for in the cache
     * @param {string} frm FRM to find for the given event type
     */
    remove(eventType, frm) {
        if (this._events.hasOwnProperty(eventType)) {
            let index = this._events[eventType].indexOf(frm);
            if (index != -1) {
                this._events[eventType].splice(index, 1);
            }
        }
    }

    /**
     * Returns the cache as an iterable list of event types and frms
     * The result is something like [{event_type: 'FP', frms: ['frm_a', 'frm_b', etc]}]
     * @typedef {Array<EventFrmPair>} EventCache
     * @typedef {Object} EventFrmPair
     * @property {string} event_type
     * @property {Array<string>} frms
     * @return EventCache
     */
    get() {
        let cached_events = this._events;
        return Object.keys(this._events).map((eventType) => {
            return {event_type: eventType, frms: cached_events[eventType]}
        })
    }
}