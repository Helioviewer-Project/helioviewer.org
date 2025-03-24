export function makeFlatTreeInner(eventData, parentPath, index) {

    if (eventData.hasOwnProperty('groups')) {

        const root = {
            label : eventData.name,
            path : `${parentPath}>>${index}__${eventData.name}`, 
            id : `${parentPath}>>${index}__${eventData.name}`, 
            state : 'unchecked',
            expand: true,
            children : [],
        };
        
        const childs = [];

        eventData.groups.forEach((ed, innerIndex) => {
            let innerFlatTree = makeFlatTreeInner(ed, root.path, innerIndex)
            root.children.push(innerFlatTree[0].id);
            innerFlatTree[0].parent_id = root.id
            childs.push(...innerFlatTree);
        });

        return [root, ...childs]

    }

    if (eventData.hasOwnProperty('data')) {

        const root = {
            label : eventData.name,
            path : `${parentPath}>>${index}__${eventData.name}`, 
            id : `${parentPath}>>${index}__${eventData.name}`, 
            state : 'unchecked',
            expand: true,
            children : [],
        };
        
        const childs = [];

        eventData.data.forEach((e, innerIndex) => {

            let eventNode = {
                label : e.short_label ?? e.label,
                path : `${root.path}>>${innerIndex}__${e.label}`, 
                id : `${root.path}>>${innerIndex}__${e.label}`, 
                state : 'unchecked',
                expand: false,
				hover: false,
                data: e,
            };

            root.children.push(eventNode.id);
            eventNode.parent_id = root.id

            childs.push(eventNode);
        });

        return [root, ...childs]

    }

}

export function makeFlatTree(eventData, source = 'HEK') {

    const root = {
        label : source,
        path : source, 
        id: source,
        state : 'unchecked',
        expand: true,
        parent_id: null,
        children : [],
    };
    
    const childs = [];

    eventData.forEach((ed, index) => {
        let innerFlatTree = makeFlatTreeInner(ed, source, index)
        root.children.push(innerFlatTree[0].id);
        innerFlatTree[0].parent_id = root.id
        childs.push(...innerFlatTree);
    });

    const res = {};

    [root, ...childs].forEach(e => {
        res[e.id] = e;
    });

    return res;
}

export function getEventsCount(eventTree, id) {

    const isEvent = eventTree[id].hasOwnProperty('data');

    if (isEvent) {
        return 1;
    }

    let res = 0;

    eventTree[id].children.forEach(childid => {
        res = res + getEventsCount(eventTree, childid);
    });

    return res;
}



export function makeNewState(state, different = true) {

    const stateConf = {
        checked   :'unchecked',
        unchecked :'checked',
        indecided :different ? 'checked' : 'unchecked',
    };

    return stateConf[state];
}

export function toggleCheck(eventTree, id, forcedState = '') {
    
    // isEvent
    const newStateForNode = forcedState == ''  ? makeNewState(eventTree[id]['state']) : forcedState;
    let newEventTree = {...eventTree, [id] : {...eventTree[id], state: newStateForNode}}

    if(eventTree[id].hasOwnProperty('data')) {
        return newEventTree;
    }

    if (eventTree[id].children) {
        eventTree[id].children.forEach(cid => {
            newEventTree = toggleCheck(newEventTree, cid, newStateForNode);
        });
    }

    return newEventTree;
}

export function handleParent(eventTree, id) {

    if (eventTree[id].parent_id == null) {
        return eventTree;
    } 

    const parentId = eventTree[id].parent_id

    let allChecked = true;
    let allUnchecked = true;

    eventTree[parentId].children.forEach(cid => {
        allChecked = allChecked && eventTree[cid].state == 'checked';
        allUnchecked = allUnchecked && eventTree[cid].state == 'unchecked';
    });

    let parentState = '';

    if (allChecked) {
        parentState = 'checked'
    }

    if (allUnchecked) {
        parentState = 'unchecked'
    }

    if (!allChecked && !allUnchecked) {
        parentState = 'indecided'
    }

    const newParent = {...eventTree[parentId], state: parentState}; 
    return handleParent({...eventTree, [parentId] : {...newParent}}, parentId);
}
export function filterEvents(eventTree, showLabels, showMarkers, source){

    const res = [];

    Object.keys(eventTree).forEach(id => {
        let node = eventTree[id];
        let isEvent = node.hasOwnProperty('data');

        if(isEvent) {
            if(node.state == 'checked') {
                res.push({
                    "event_data" : node.data,
                    "visible" : showMarkers,
                    "label_visible" : showLabels,
                    "label" : node.label,
                    "source" : source,
                });
            }
        }
    });
    return res;
}
export function makeEventTreeReducer(cacheKey, onUpdate, showLabels, showMarkers, source) {
   return (eventTree, action) => {
       switch (action.type) {
            case 'load': {
              return action.tree;
            }
            case 'toggleCheck': {
                const newTree = handleParent(toggleCheck(eventTree, action.id),action.id);
                localStorage.setItem(cacheKey, JSON.stringify(newTree));
                return newTree; 
            }
            case 'toggleExpand': {
                const newTree = {...eventTree, [action.id] : {...eventTree[action.id], expand: !eventTree[action.id].expand}}
                localStorage.setItem(cacheKey, JSON.stringify(newTree));
                return newTree; 
            } 
            case 'setAll': {
                const newTree = toggleCheck(eventTree, action.id, action.state);
                localStorage.setItem(cacheKey, JSON.stringify(newTree));
                return newTree; 
            }
            case 'setHover': {
                const newTree = setHover(eventTree, action.id, true);
                localStorage.setItem(cacheKey, JSON.stringify(newTree));
                return newTree; 
            }
            case 'setOffHover': {
                const newTree = setHover(eventTree, action.id, false)
                localStorage.setItem(cacheKey, JSON.stringify(newTree));
                return newTree; 
            }
       }
   }
}


