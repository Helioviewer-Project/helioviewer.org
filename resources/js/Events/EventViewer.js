import { JsonViewer } from './JsonViewer';
import React, { useState, useEffect } from 'react';
/**
 * React-based event viewer.
 * This is the content that shows up in dialog when viewing an event's source data.
 * This EventViewer is only used for Non-HEK events. The HEK data has not been migrated to support this viewer.
 * @typedef {Object} View Each view represents a tab in the event information dialog
 * @property {string} name Name of the tab
 * @property {Object} content Key-Value pairs representing a label and value for the content to display
 *
 * @param {Array<View>} views List of views (tabs) to display
 * @param {Object} source Raw JSON source data not distilled into views.
 */
export default function EventViewer({views, source, onChange}) {
    // Store the currently selected tab, used to index into the views array.
    const [tab, setTab] = useState(views[0])
    useEffect(onChange);
    let groups = GetTabGroups(views);

    return <div>
        <div className='event-info-dialog-menu horizontal-scrolled-menu'>
            {/* Map each view to into its own unique Tab. When clicked, tab will be updated with the selected index */}
            {groups.map((viewGroup, idx) => <TabGroup key={idx} views={viewGroup} selected={tab} setSelected={setTab} />)}
            {/* Then create the final tab on the right containing the "All" text */}
            <div className="tabgroup">
                <Tab key={'all'} name={'all'} selected={tab == 'all'} onClick={(_) => setTab('all')} />
            </div>
        </div>
        {/* When a tab is selected, access the view by index. When "all" is selected, use the JsonViewer */}
        {tab != 'all' ? <JsonViewer value={tab.content} /> : <JsonViewer value={source} />}
    </div>;
}

/**
 * Represents a tab in the dialog
 * @param {string} name Content to place in the tab
 * @param {boolean} selected Sets the "selected" class on the tab if true
 * @param {function} onClick Function to execute when tab is clicked
 * @param {string} extraClasses Extra HTML classes to place in the element
 */
function Tab({name, selected, onClick, extraClasses}) {
    return <a className={`show-tags-btn ${extraClasses || ''} ${selected ? 'selected' : ''}`} onClick={onClick}>{name}</a>
}

/**
 * Renders tabs within a tabgroup
 * @param {Array<View>} views List of views that are in this tabgroup
 * @param {View} selected Selected view
 * @param {function} setSelected function to set the selected tab identifier
 */
function TabGroup({views, selected, setSelected}) {
    let selectedKey = window.btoa(JSON.stringify(selected));
    return <div className='tabgroup'>
        {
        views.map((view, idx) => {
            let key = window.btoa(JSON.stringify(view));
            return views[idx].content != null ? <Tab tabgroup={view.tabgroup} key={key} name={view.name} selected={selectedKey == key} onClick={(_) => setSelected(view)} /> : ""
        })
        }
    </div>
}

/**
 * Parses the list of views into groups based on their tabgroup field.
 * Lower tabgroups will appear before
 * @param {Array<Array<View>>} views
 */
function GetTabGroups(views) {
    let groups = {};
    // This group is used if there is no specific tabgroup specified.
    // Which means the view is its own unique tab.
    let groupIndex = 99999;
    views.forEach((view) => {
        // Use the specified tabgroup. If one is not specified, then get a unique tabgroup id
        let tabgroup = view.tabgroup || groupIndex++;
        if (!groups.hasOwnProperty(tabgroup)) {
            groups[tabgroup] = [view];
        } else {
            groups[tabgroup].push(view);
        }
    })
    return Object.values(groups).reverse();
}
