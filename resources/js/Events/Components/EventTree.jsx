import { useState, useEffect, useReducer, useRef } from 'react'
import React from 'react'

import ToggleIcon from './ToggleIcon.jsx'
import getEvents from './API.jsx'

import Checkbox from './Checkbox.jsx'
import Node from './Node.jsx'

const rightEnabled = '\u25B8';
const rightDisabled = '\u25B7';
const downEnabled = '\u25BC';
const downDisabled = '\u25BD';

import { EventTreeShowEmptyBranchContext, EventTreeContext, EventTreeDispatchContext  } from './EventTreeContext.jsx'
import {makeFlatTree, makeEventTreeReducer, filterEvents} from './functions.jsx'

function EventTree({source , eventsDate, onUpdate}) {

    const eventTimestamp = eventsDate.getTime();
    const cacheKey = `helioviewer.177.events.${source}.${eventTimestamp}`;
    const [showEmptyBranches, setShowEmptyBranches] = useState(true);
    const [showMarkers, setShowMarkers] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [allSelect, setAllSelect] = useState(false); 
    const [eventTree, dispatch] = useReducer(makeEventTreeReducer(cacheKey,onUpdate, showLabels, showMarkers, source), {});


    useEffect(() => {

        // const cachedTree = localStorage.getItem(cacheKey);
        //
        // if (cachedTree) {
        //     return dispatch({type: 'load',tree: JSON.parse(cachedTree)});
        // }

        async function fetchEvents() {
            const events = await getEvents(eventsDate, source)
            // console.log(events);
            const newTree =  makeFlatTree(events, source);
            console.log(newTree);
            // localStorage.setItem(cacheKey, JSON.stringify(newTree));
            return dispatch({type: 'load',tree: newTree});
        }

        fetchEvents();

    }, [eventsDate])

    useEffect(() => {
        const selectedEvents = filterEvents(eventTree, showLabels, showMarkers, source);
        // console.log(selectedEvents);
        onUpdate(selectedEvents);

    }, [eventTree, showLabels, showMarkers])

    const toggleAllSelect = function() {
        const newAllSelect = !allSelect;
        setAllSelect(newAllSelect);
        return dispatch({type: 'setAll',id: source, state: newAllSelect ? 'checked' : 'unchecked'});
    }

    if (Object.keys(eventTree).length <= 0) {
        return ;
    }

    const eventTreeContainerStyle = {
        padding:5,
        paddingTop:0
    }

    return (
        <>
          <EventTreeShowEmptyBranchContext.Provider value={showEmptyBranches}>
            <EventTreeContext.Provider value={eventTree}>
              <EventTreeDispatchContext.Provider value={dispatch}>
                <div style={eventTreeContainerStyle}>
                    <div className="header">
                        <span>{source}</span> 
                        <input
                          type="checkbox"
                          checked={allSelect == true}
                          onChange={toggleAllSelect}
                        />
                        {eventsDate.toISOString().replace(/-/g, '/').replace('T', ' ').slice(0, 19) + ' UTC'}
                        <ToggleIcon value={showEmptyBranches} updateValue={setShowEmptyBranches} />
                        <ToggleIcon value={showMarkers} updateValue={setShowMarkers} />
                        <ToggleIcon value={showLabels} updateValue={setShowLabels} />
                    </div>
                    <div className="event-tree-body">
                        {eventTree[source].children.map(cid => {
                            return <Node key={cid} id={cid} />
                        })}
                    </div>
                </div>
              </EventTreeDispatchContext.Provider>
            </EventTreeContext.Provider>
          </EventTreeShowEmptyBranchContext.Provider>
        </>
    );
}

export default EventTree;
