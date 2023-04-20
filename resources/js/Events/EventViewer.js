import { JsonViewer } from '@textea/json-viewer';
import React, { useState } from 'react';
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
export default function EventViewer({views, source}) {
    // Store the currently selected tab, used to index into the views array.
    const [tab, setTab] = useState(0)
    return <div>
        <div className='event-info-dialog-menu'>
            {/* Map each view to into its own unique Tab. When clicked, tab will be updated with the selected index */}
            {views.map((view, idx) => <Tab key={idx} name={view.name} selected={idx == tab} onClick={(_) => setTab(idx)} />)}
            {/* Then create the final tab on the right containing the "All" text */}
            <Tab key={'all'} name={'all'} extraClasses={'right'} selected={tab == 'all'} onClick={(_) => setTab('all')} />
        </div>
        {/* When a tab is selected, access the view by index. When "all" is selected, use the JsonViewer */}
        {tab != 'all' ? <Content data={views[tab].content} /> :
                        <div style={{padding: "15px"}}>
                            <JsonViewer
                                value={source}
                                theme={theme}
                                displayObjectSize={false}
                                displayDataTypes={false}
                                valueTypes={[{
                                    is: (value) => typeof value === "string" && value.startsWith('http'),
                                    Component: (props) => <a href={props.value} target='_blank'>{props.value}</a>
                                }]}
                            />
                        </div>
                        }
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
    return <a className={`show-tags-btn ${extraClasses} ${selected ? 'selected' : ''}`} onClick={onClick}>{name}</a>
}

/**
 * Renders data into the event dialog
 * @param {Object} data JSON Object without nesting. Each entry is a label->value pair.
 */
function Content({data}) {
    // Get a list of key value pairs. index 0 is the key, index 1 is the value
    let pairs = Object.entries(data);
    return <div className='event-header' style={{height: '400px', overflow: 'auto'}}>
        {/* Map each pair into a DataPair which handles the rendering. */}
        {pairs.map((pair) => <DataPair key={pair[0]} label={pair[0]} value={pair[1]} />)}
    </div>
}

/**
 * Renders an individual label - value pair.
 * @param {string} label Content label
 * @param {any} value Content value
 * @returns
 */
function DataPair({label, value}) {
    // Check if the value is empty. These get a special 'empty' class in the HTML.
    let emptyClass = IsEmptyValue(value) ? 'empty' : '';
    return <div className={emptyClass}>
        <span className={`event-header-tag ${emptyClass}`}>{label}:</span>
        {/* Render the value. Using another component to handle special cases for certain types of values. */}
        <Value empty={IsEmptyValue(value)} value={value} />
    </div>
}

/**
 * Renders a value, taking care to handle special cases such as rendering links if the value is a URL.
 * @param {boolean} empty Set to true if value is null or an empty string
 * @param {any} value Value to render.
 * @returns
 */
function Value({empty, value}) {
    let className = `event-header-value ${empty ? 'empty' : ''}`;
    if (typeof value == 'string' && value.startsWith('http')) {
        // If the string is a URL, make it a link
        return <span className={className}>
                   <a href={value} target='_blank'>{value}</a>
               </span>
    } else {
        // Otherwise just return the content as plain text.
        return <span className={className}>{value}</span>
    }
}

const theme = {
    scheme: 'Helioviewer (Based on Ocean by Chris Kempson (http://chriskempson.com))',
    author: 'Daniel Garcia-Briseno',
    base00: '#000000',
    base01: '#343d46',
    base02: '#000000',
    base03: '#65737e',
    base04: '#a7adba',
    base05: '#c0c5ce',
    base06: '#dfe1e8',
    base07: '#eff1f5',
    base08: '#bf616a',
    base09: '#d0A7C0',
    base0A: '#ebcb8b',
    base0B: '#a3be8c',
    base0C: '#96b5b4',
    base0D: '#8fa1b3',
    base0E: '#b48ead',
    base0F: '#ab7967'
}

/**
 * Returns true if the value is null or empty
 * @param {any} value
 * @returns {boolean}
 */
function IsEmptyValue(value) {
    switch (typeof value) {
        case "string":
            return value.trim() === "";
        default:
            return value == null;
    }
}