class EventTree {
  constructor(props) {
    Object.assign(this, props);
  }

  static make(events, source) {
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
      indecided: "checked"
    };

    const newState = stateCycle[this[id]["state"]];

    const nodes = this.getNodes(id);

    for (const n of nodes) {
      this[n].state = newState;
    }

    let parentId = this[id].parent_id;

    while (parentId != null) {
      let siblingsStates = this[parentId].children.map((cid) => this[cid].state);

      let parentState = "indecided";

      if (siblingsStates.every((ss) => ss == "checked")) {
        parentState = "checked";
      }

      if (siblingsStates.every((ss) => ss == "unchecked")) {
        parentState = "unchecked";
      }

      this[parentId].state = parentState;

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

  applySelections(selections) {
    selections.forEach((s) => {
      if (this.hasOwnProperty(s)) {
        const nodes = this.getNodes(s);

        for (const n of nodes) {
          this[n].state = "checked";
        }

        let parentId = this[s].parent_id;

        while (parentId != null) {
          let siblingsStates = this[parentId].children.map((cid) => this[cid].state);

          let parentState = "indecided";

          if (siblingsStates.every((ss) => ss == "checked")) {
            parentState = "checked";
          }

          if (siblingsStates.every((ss) => ss == "unchecked")) {
            parentState = "unchecked";
          }

          this[parentId].state = parentState;
          this[parentId].expand = parentState == "indecided";

          parentId = this[parentId].parent_id;
        }
      } else {
        console.warn(s, " selection problem , it is not in tree!");
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
}

export default EventTree;
