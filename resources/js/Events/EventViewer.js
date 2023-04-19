import { JsonViewer } from '@textea/json-viewer';
import React, { useState } from 'react';
/**
 * React-based event viewer.
 * This is the content that shows up in dialog when viewing an event's source data.
 * This EventViewer is only used for Non-HEK events. The HEK data has not been migrated to support this viewer.
 */
export default function EventViewer({views, source}) {
    const [tab, setTab] = useState(0)
    return <div>
        <div className='event-info-dialog-menu'>
            {views.map((view, idx) => <Tab key={idx} name={view.name} selected={idx == tab} onClick={(_) => setTab(idx)} />)}
            <Tab key={'all'} name={'all'} extraClasses={'right'} selected={tab == 'all'} onClick={(_) => setTab('all')} />
        </div>
        {tab != 'all' ? <Content data={views[tab].data} /> : <div></div>}
        {tab == 'all' ? <div style={{padding: '15px'}}>
                            <JsonViewer
                                    value={source}
                                    theme={theme}
                                    displayObjectSize={false}
                                    displayDataTypes={false}
                                    valueTypes={[{
                                        is: (value) => typeof value === "string" && value.startsWith('http'),
                                        Component: (props) => <a href={props.value} target='_blank'>{props.value}</a>
                                    }]}
                        /></div> : <div></div>}
    </div>;
}

/**
 * Represents a tab in the dialog
 */
function Tab({name, selected, onClick, extraClasses}) {
    return <a className={`show-tags-btn ${extraClasses} ${selected ? 'selected' : ''}`} onClick={onClick}>{name}</a>
}

function Content({data}) {
    let pairs = Object.entries(data);
    return <div className='event-header' style={{height: '400px', overflow: 'auto'}}>
        {pairs.map((pair) => <DataPair key={pair[0]} label={pair[0]} value={pair[1]} />)}
    </div>
}

function DataPair({label, value}) {
    let emptyClass = value == null ? 'empty' : '';
    return <div className={emptyClass}>
        <span className={`event-header-tag ${emptyClass}`}>{label}:</span>
        <Value value={value} />
    </div>
}

function Value({value}) {
    let className = `event-header-value ${value == null ? 'empty' : ''}`;
    if (value == null) {
        return <span className={className}></span>
    }
    switch (typeof value) {
        case 'string':
            return <StringValue className={className} value={value} />
        default:
            return <span className={className}>{value}</span>
    }
}

function StringValue({value, className}) {
    if (value.startsWith('http')) {
        return <a href={value} target='_blank'>{value}</a>;
    } else {
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
