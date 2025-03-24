import { useEffect, useRef } from 'react'
import React from 'react';

const rightEnabled = '\u25B8';
const rightDisabled = '\u25B7';
const downEnabled = '\u25BC';
const downDisabled = '\u25BD';

import {getEventsCount} from './functions.jsx'
import { useEventTree, useEventTreeDispatch, useEventTreeShowEmptyBranchContext } from './EventTreeContext.jsx'
import Checkbox from './Checkbox.jsx'

export default function Node({id}) {

    const eventTree = useEventTree();
    const showEmptyBranches = useEventTreeShowEmptyBranchContext();
    const dispatch = useEventTreeDispatch();

    const handleExpandChange = () => {dispatch({type: 'toggleExpand', id: id})}
    const handleStateChange = () => {dispatch({type: 'toggleCheck', id: id})}
    const handleOnHover = () => {}//dispatch({type: 'setHover', id: id})}
    const handleOffHover = () => {}//dispatch({type: 'setOffHover', id: id})}

    let expandControlTriangle = rightDisabled;

    if (getEventsCount(eventTree, id) > 0) {
        
        if (eventTree[id].expand) {
            expandControlTriangle = downEnabled;
        } else {
            expandControlTriangle = rightEnabled;
        }
    }

    const isEvent = eventTree[id].hasOwnProperty('data');
    const isBranch = !isEvent;
	const hasEvents = getEventsCount(eventTree, id) > 0;
    const branchWithNoEvents = isBranch && !hasEvents

	if (branchWithNoEvents && !showEmptyBranches) {
		return;
	}

    let nodeContainerStyle = {};
    if (branchWithNoEvents) {
        nodeContainerStyle = {
            opacity: 0.5,
        }
    }

    const nodeHeaderStyle = {
        display: "flex",
        alignItems: "center",
    } 
    
    const controlTriangleStyle = {
        paddingBottom:3,
        fontSize:10,
        minWidth: 13,
        cursor: "pointer",
    }

    const nodeChildrensStyle = {
        paddingLeft: 18
    }

    if (!(eventTree[id].expand)) {
        nodeChildrensStyle['display'] = 'none';
    }

    return (
        <div style={nodeContainerStyle}>
            <div 
                style={nodeHeaderStyle}
				onMouseEnter={handleOnHover}
				onMouseLeave={handleOffHover}
			>
                { isEvent ? null : <a style={controlTriangleStyle} onClick={handleExpandChange}>{expandControlTriangle}</a> }
                <div style={nodeHeaderStyle}>
                    <div>
                        <Checkbox state={eventTree[id].state} onChange={handleStateChange} />
                        <span>{eventTree[id].label} {isEvent ? null : '('+getEventsCount(eventTree, id)+')'} </span>
                    </div>
                </div>
            </div>
            { isEvent ? null : (
                <div style={nodeChildrensStyle}>
                    {eventTree[id].children.map(cid => {
                        return <Node key={cid} id={cid} />
                    })}
                </div>
            )}
        </div>
    );
}

