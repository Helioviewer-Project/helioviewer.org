import React from "react";
import { useRef, useState, useEffect } from "react";

import Cache from "./Core/Cache.jsx"
import EventTree from "./Core/EventTree.jsx"
import API from "./Core/API.jsx";
import Checkbox from "./Checkbox.jsx";
import Node from "./Node.jsx";
import SourceHeader from "./SourceHeader.jsx"


const useIsMount = () => {

    const isMountRef = useRef(false);

    useEffect(() => {
      isMountRef.current = true;
    }, []);

    return isMountRef.current;
};

function HelioviewerEventTree({ source, eventsDate, onEventsUpdate, onHoveredEventsUpdate, visibility=true, labelVisibility=true,  onToggleVisibility=null, onToggleLabelVisibility=null, forcedSelections=null, apiURL="https://api.helioviewer.org" }) {

  const isMount = useIsMount();
  const eventTimestamp = eventsDate.getTime()

  const [showEmptyBranches, setShowEmptyBranches] = useState(true)
  const [eventTree, setEventTree] = useState(new EventTree({}))

  useEffect(() => {

    async function fetchEvents() {

      // @TODO implement abort logic
      const cache = Cache.make(source);
	  const api = new API(apiURL);  

      const events = await api.getEvents(eventsDate, source);
      const eventTree = EventTree.make(events, source);
	
      // if hv already pass state
      if(forcedSelections!=null || forcedSelections!=undefined) {
		cache.saveSelections(forcedSelections);
      }

      // APPLY CACHE
      const selectedTree = eventTree.applySelections(cache.getSelections())

      setShowEmptyBranches(cache.getShowEmptyBranches());
      setEventTree(selectedTree);
    }

    fetchEvents();

  }, [eventsDate]);
  

  useEffect(() => {

    if(!isMount) {
        return ;
    }

    const selectedEvents = eventTree.selectedEvents();
    const cache = Cache.make(source);

    onEventsUpdate(selectedEvents, cache.getSelections());

  }, [eventTree.selectedEvents()]);

  const toggleCheckbox = function (id) {
    const newTree = eventTree.toggleCheckbox(id)
    const newSelections = newTree.extractSelections() 

    Cache.make(source).saveSelections(newSelections);
    setEventTree(newTree);
  };

  const toggleExpand = function (id) {
    const newTree = eventTree.toggleExpand(id)
    setEventTree(newTree);
  };

  const onHover = function (hoverId) {
    const hoveredEvents = eventTree.getEventsOfNode(hoverId).map(e => {
        return e.id;
    });

    onHoveredEventsUpdate(hoveredEvents);
  }  

  const offHover = function () {
    onHoveredEventsUpdate([]);
  }  


  const handleShowEmptyBranches = function(newShowEmptyBranchesValue) {
    Cache.make(source).saveShowEmptyBranches(newShowEmptyBranchesValue)
	setShowEmptyBranches(newShowEmptyBranchesValue)
  }


  if (Object.keys(eventTree).length <= 0) {
    return;
  }

  let nodeContainerStyle = {
    margin: 0,
    padding: ".55em .125em .1em 1em",
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))',
    MozBackgroundImage: '-moz-linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))',
    OBackgroundImage: '-o-linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))',
    WebkitBackgroundImage: '-webkit-linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))'
  };

  let hasEvents = true;

  if (eventTree.getEventCount(source) <= 0) {
    hasEvents = false;
    nodeContainerStyle = {
      opacity: 0.5,
      ...nodeContainerStyle
    };
  }

  const nodeChildrensStyle = {
    paddingLeft: 3,
    paddingTop: 10,
    paddingBottom: 10,
      fontSize: 13
  };

  if (!eventTree[source].expand) {
    nodeChildrensStyle["display"] = "none";
  }


  let eventTreeRender = <span style={{color:'red'}}>No events</span>;

  if(hasEvents) {
    eventTreeRender = eventTree[source].children.map((cid) => {
        return (
          <Node
            key={cid}
            id={cid}
            toggleCheckbox={toggleCheckbox}
            toggleExpand={toggleExpand}
            onHover={onHover}
            offHover={offHover}
            eventTree={eventTree}
            showEmptyBranches={showEmptyBranches}
          />
        );
   })
  }

  return (
    <>
      <div style={nodeContainerStyle}>
        <SourceHeader 

            hasEvents={hasEvents}
            
            checked={eventTree[source].state}
            onCheckedUpdate={() => toggleCheckbox(source)}

            onHeaderHover = {() => {
                onHover(source)
            }}

            offHeaderHover = {() => {
                offHover()
            }}

            source={source} 
            eventsDate={eventsDate}

            expand={eventTree[source].expand} 
            toggleExpand={() => toggleExpand(source)}

            showEmptyBranches={showEmptyBranches} 
            handleShowEmptyBranches={handleShowEmptyBranches} 

            visibility={visibility} 
            handleVisibility={onToggleVisibility} 

            labelVisibility={labelVisibility} 
            handleLabelVisibility={onToggleLabelVisibility} 
        />

        <div style={nodeChildrensStyle}>
            {eventTreeRender}
        </div>
      </div>
    </>
  );
}

export default HelioviewerEventTree;
