import React from "react";
import { useRef, useState, useEffect } from "react";

import Cache from "./Core/Cache.jsx";
import EventTree from "./Core/EventTree.jsx";
import API from "./Core/API.jsx";
import Checkbox from "./Checkbox.jsx";
import Node from "./Node.jsx";
import SourceHeader from "./SourceHeader.jsx";
import { LoadingIcon } from "./Icons.jsx";

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
  onSelectionsUpdate = null,
  visibility = true,
  labelVisibility = true,
  onToggleVisibility = null,
  onToggleLabelVisibility = null,
  forcedSelections = null,
  apiURL = "https://api.helioviewer.org",
  onLoad = null,
  onError = (err) => {
    console.error(err);
  }
}) {
  const isMount = useIsMount();
  const cache = Cache.make(source);

  const [selections, setSelections] = useState(forcedSelections ?? cache.getSelections());
  const [loading, setLoading] = useState(false);
  const [showEmptyBranches, setShowEmptyBranches] = useState(cache.getShowEmptyBranches());
  const [eventTree, setEventTree] = useState(null);
  const [events, setEvents] = useState([]);

  // Run initially first
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchEvents() {
      setLoading(true);

      try {
        const api = new API(apiURL);
        const apiEvents = await api.getEvents(eventsDate, source, { signal });
        const eventTree = EventTree.make(apiEvents, source);
        const selectedTree = eventTree.applySelections(selections);

        Cache.make(source).saveSelections(selections);

        if (onSelectionsUpdate != null) {
          onSelectionsUpdate(selections, selectedTree.selectedEvents());
        }

        onEventsUpdate(selectedTree.selectedEvents());

        setEventTree(selectedTree);
      } catch (error) {
        if (error.name != "AbortError") {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();

    return () => {
      controller.abort(); // Abort on cleanup
    };
  }, [eventsDate.getTime()]);

  useEffect(() => {
    // This is only for after mount
    if (!isMount) {
      return;
    }

    Cache.make(source).saveSelections(selections);

    const selectedTree = eventTree.removeSelections().applySelections(selections);

    if (onSelectionsUpdate != null) {
      onSelectionsUpdate(selections, selectedTree.selectedEvents());
    }

    onEventsUpdate(selectedTree.selectedEvents());

    setEventTree(selectedTree);
  }, [selections]);

  useEffect(() => {
    // Only update if it is updated from outside
    if (!isMount || forcedSelections == null) {
      return;
    }

    setSelections(forcedSelections);
  }, [forcedSelections]);

  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  });

  const toggleCheckbox = function (id) {
    const newSelections = eventTree.toggleCheckbox(id).extractSelections();

    setSelections(newSelections);
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

  if (eventTree == null) {
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
        <div style={nodeChildrensStyle}>
          {loading ? (
            <div className="event-tree-container-loader">
              <LoadingIcon />
              <span>&nbsp;Loading</span>
            </div>
          ) : (
            eventTreeRender
          )}
        </div>
      </div>
    </>
  );
}

export default HelioviewerEventTree;
