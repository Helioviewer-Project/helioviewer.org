/**
 * Stores event information in an accessible way.
 * IDs are generated for each event and are accessible on this event tree via
 * EventTree[event_id]
 * Each event contains the ID of its parent and a list of child events.
 */
class EventTree {
  constructor(props) {
    Object.assign(this, props);
  }

  /**
   * @param {Object} events Event Data object
   * @param {string} source Top level event group (HEK, CCMC, RHESSI, etc)
   */
  static make(events, source) {
    /**
     * Given a set of events like:
     *   - top level
     *      - groups: second level
     *          - groups: third level
     *              - data: [event 1, event 2, event 3]
     *  This will return a structure like:
     *  [{top level}, {second level}, {third level}, {event 1}, {event 2}, {event 3}].
     *  Each object in the list will have references to their children and an ID for their parent.
     */
    const makeFlatTreeInner = (eventData, parentPath, level = 0) => {
      if (eventData.hasOwnProperty("groups")) {
        const root = {
          label: eventData.name,
          path: `${parentPath}>>${eventData.name}`,
          id: `${parentPath}>>${eventData.name}`,
          state: "unchecked",
          expand: level == 0,
          children: []
        };

        const childs = [];

        eventData.groups.forEach((ed) => {
          let innerFlatTree = makeFlatTreeInner(ed, root.path, level + 1);
          root.children.push(innerFlatTree[0].id);
          innerFlatTree[0].parent_id = root.id;
          childs.push(...innerFlatTree);
        });

        return [root, ...childs];
      }

      if (eventData.hasOwnProperty("data")) {
        const root = {
          label: eventData.name,
          path: `${parentPath}>>${eventData.name}`,
          id: `${parentPath}>>${eventData.name}`,
          state: "unchecked",
          expand: level == 0,
          children: []
        };

        const childs = [];

        eventData.data.forEach((e) => {
          let eventNode = {
            label: e.short_label ?? e.label,
            path: `${root.path}>>${e.short_label ?? e.label}`,
            id: `${root.path}>>${e.short_label ?? e.label}`,
            state: "unchecked",
            expand: level == 0,
            data: e
          };

          root.children.push(eventNode.id);
          eventNode.parent_id = root.id;

          childs.push(eventNode);
        });

        return [root, ...childs];
      }
    };

    const root = {
      label: source,
      path: source,
      id: source,
      state: "unchecked",
      parent_id: null,
      expand: true,
      children: []
    };

    const childs = [];

    events.forEach((ed) => {
      let innerFlatTree = makeFlatTreeInner(ed, source);
      root.children.push(innerFlatTree[0].id);
      innerFlatTree[0].parent_id = root.id;
      childs.push(...innerFlatTree);
    });

    const res = {};

    [root, ...childs].forEach((e) => {
      res[e.id] = e;
    });

    return new EventTree(res);
  }

  toggleCheckbox(id) {
    const stateCycle = {
      checked: "unchecked",
      unchecked: "checked",
      undecided: "checked"
    };

    const newState = stateCycle[this[id]["state"]];

    const nodes = this.getNodes(id);

    for (const n of nodes) {
      this[n].state = newState;
    }

    let parentId = this[id].parent_id;

    while (parentId != null) {
      let siblingsStates = this[parentId].children.map((cid) => this[cid].state);

      this[parentId].state = siblingsStates.reduce(
        (finalState, eventState) => (finalState != eventState ? "undecided" : finalState),
        siblingsStates[0]
      );

      parentId = this[parentId].parent_id;
    }

    return new EventTree({ ...this });
  }

  toggleExpand(id) {
    if (this.hasOwnProperty(id)) {
      this[id].expand = !this[id].expand;
    }

    return new EventTree({ ...this });
  }

  removeSelections() {
    for (const n in this) {
      this[n].state = "unchecked";
    }
    return new EventTree({ ...this });
  }

  applySelections(selections) {
    selections.forEach((id) => {
      if (this.hasOwnProperty(id)) {
        const nodes = this.getNodes(id);

        for (const n of nodes) {
          this[n].state = "checked";
        }

        let parentId = this[id].parent_id;

        while (parentId != null) {
          let siblingsStates = this[parentId].children.map((cid) => this[cid].state);

          this[parentId].state = siblingsStates.reduce(
            (finalState, eventState) => (finalState != eventState ? "undecided" : finalState),
            siblingsStates[0]
          );

          this[parentId].expand =
            this[parentId].state == "undecided" || this.isRoot(parentId) || this.isFirstLevel(parentId);

          parentId = this[parentId].parent_id;
        }
      } else {
        console.warn(id, " selection problem , it is not in tree!");
      }
    });

    return new EventTree({ ...this });
  }

  selectedEvents() {
    const res = [];

    for (const n in this) {
      let node = this[n];
      let isEvent = node.hasOwnProperty("data");

      if (isEvent) {
        if (node.state == "checked") {
          res.push({
            event_data: node.data,
            label: node.label,
            id: node.id
          });
        }
      }
    }

    return res;
  }

  extractSelections() {
    const res = [];

    for (const n in this) {
      let node = this[n];

      // We only care checked ones
      if (node.state == "checked") {
        // its parent could be null, then this means root node is selected
        // or if anynode is selected but its parent not selected
        if (node.parent_id == null || this[node.parent_id].state != "checked") {
          res.push(node.id);
        }
      }
    }

    return res;
  }

  getNodes(id) {
    const isEvent = this[id].hasOwnProperty("data");

    if (isEvent) {
      return [id];
    }

    const allNodes = [id];

    this[id].children.forEach((cid) => {
      allNodes.push(...this.getNodes(cid));
    });

    return allNodes;
  }

  getEventsOfNode(id) {
    const isEvent = this[id].hasOwnProperty("data");

    if (isEvent) {
      return [this[id]];
    }

    const allEvents = [];

    this[id].children.forEach((cid) => {
      allEvents.push(...this.getEventsOfNode(cid));
    });

    return allEvents;
  }

  getEventCount(id) {
    return this.getEventsOfNode(id).length;
  }

  /**
   * An event branch a branch which contains an event data array.
   * Branches containing groups are not event branches.
   */
  isEventBranch(id) {
    const isEvent = this[id].hasOwnProperty("data");

    if (isEvent) {
      return false;
    }

    if (this[id].children.length <= 0) {
      return false;
    }

    const firstChildrenId = this[id].children[0];

    return this[firstChildrenId].hasOwnProperty("data");
  }

  getLevel(id) {
    // trigger exception , if it is not in tree, we handle all exceptions
    const nodeID = this[id].id;

    return nodeID.split(">>").length;
  }

  isRoot(id) {
    return this.getLevel(id) == 1;
  }

  isFirstLevel(id) {
    return this.getLevel(id) == 2;
  }
}

export default EventTree;
