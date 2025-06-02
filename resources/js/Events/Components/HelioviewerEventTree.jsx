import React from "react";
import { useRef, useState, useEffect } from "react";

import Cache from "./Core/Cache.jsx";
import EventTree from "./Core/EventTree.jsx";
import API from "./Core/API.jsx";
import Checkbox from "./Checkbox.jsx";
import Node from "./Node.jsx";
import SourceHeader from "./SourceHeader.jsx";
import {LoadingIcon} from "./Icons.jsx";

const useIsMount = () => {
  const isMountRef = useRef(false);

  useEffect(() => {
    isMountRef.current = true;
  }, []);

  return isMountRef.current;
};

function HelioviewerEventTree({
  source,
  eventsDate,
  onEventsUpdate,
  onHoveredEventsUpdate,
  onSelectionsUpdate=null,
  visibility = true,
  labelVisibility = true,
  onToggleVisibility = null,
  onToggleLabelVisibility = null,
  forcedSelections = null,
  apiURL = "https://api.helioviewer.org",
  onLoad = null,
  onError = (err) => {console.error(err)}
}) {

  const isMount = useIsMount();
  const eventTimestamp = eventsDate.getTime();
  const cache = Cache.make(source);

  let defaultSelections = cache.getSelections();

  if (forcedSelections != null) {
      defaultSelections = forcedSelections;
  }

  const [selections, setSelections] = useState(defaultSelections);
  const [loading, setLoading] = useState(false);
  const [showEmptyBranches, setShowEmptyBranches] = useState(cache.getShowEmptyBranches());
  const [eventTree, setEventTree] = useState(new EventTree({}));
  const [events, setEvents] = useState([]);

  
  useEffect(() => {
      
    async function fetchEvents() {
      // @TODO implement abort logic
      try {
          setLoading(true);

          const api = new API(apiURL);

          const apiEvents = await api.getEvents(eventsDate, source);
          const eventTree = EventTree.make(apiEvents, source);
          const selectedTree = eventTree.applySelections(selections);

          setEventTree(selectedTree);
          setEvents(selectedTree.selectedEvents());

          if (onLoad != null) {
              onLoad();
          }

      } catch (error) {
          onError(error);
      } finally {
          setLoading(false);
      }


      console.log(`useEffect ${source} eventsDate ${eventsDate}`);

    }

    fetchEvents();
  }, [eventsDate]);

  useEffect(() => {

    if (!isMount) {
      return;
    }

    onEventsUpdate(events);

      console.log(`useEffect ${source} eventsUpdate ${events.length} many events`);
  }, [events]);

  if (onSelectionsUpdate != null) {
      useEffect(() => {

        if (!isMount) {
          return;
        }

        onSelectionsUpdate(selections, eventTree.selectedEvents());

      console.log(`useEffect ${source} selectionsUpdate ${selections}`);
      }, [selections]);
  }

  const toggleCheckbox = function (id) {
    const newTree = eventTree.toggleCheckbox(id);
    const newSelections = newTree.extractSelections();

    Cache.make(source).saveSelections(newSelections);

    setEventTree(newTree);
    setSelections(newSelections);
    setEvents(newTree.selectedEvents());
  };

  const toggleExpand = function (id) {
    const newTree = eventTree.toggleExpand(id);
    setEventTree(newTree);
  };

  const onHover = function (hoverId) {
    const hoveredEvents = eventTree.getEventsOfNode(hoverId).map((e) => {
      return e.id;
    });

    onHoveredEventsUpdate(hoveredEvents);
  };

  const offHover = function () {
    onHoveredEventsUpdate([]);
  };

  const handleShowEmptyBranches = function (newShowEmptyBranchesValue) {
    Cache.make(source).saveShowEmptyBranches(newShowEmptyBranchesValue);
    setShowEmptyBranches(newShowEmptyBranchesValue);
  };

  if (Object.keys(eventTree).length <= 0) {
    return;
  }

  let nodeContainerStyle = {
    margin: 0,
    padding: ".55em .125em .1em 1em",
    backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))",
    MozBackgroundImage: "-moz-linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))",
    OBackgroundImage: "-o-linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))",
    WebkitBackgroundImage: "-webkit-linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0))"
  };

  let hasEvents = eventTree.getEventCount(source) > 0;

  if (!hasEvents) {
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
	console.log(eventTree);
    nodeChildrensStyle["display"] = "none";
  }

  let eventTreeRender = <span style={{ color: "red" }}>No events</span>;

  if (hasEvents) {
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
    });
  }

  return (
    <>
      <div style={nodeContainerStyle}>
        <SourceHeader
          hasEvents={hasEvents}
          checked={eventTree[source].state}
          onCheckedUpdate={() => toggleCheckbox(source)}
          onHeaderHover={() => {
            onHover(source);
          }}
          offHeaderHover={() => {
            offHover();
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
        <div style={nodeChildrensStyle}>{loading ? <><LoadingIcon /><span>&nbsp;Loading</span></> : eventTreeRender }</div>
      </div>
    </>
  );
}

export default HelioviewerEventTree;
