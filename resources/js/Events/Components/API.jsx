// const APIURL = 'https://api.helioviewer.org/'
const APIURL = 'http://ec2-44-219-199-246.compute-1.amazonaws.com:8081/';

async function getEvents(date, source) {

    const startTime = date.toISOString();
    const url = `${APIURL}?startTime=${encodeURIComponent(startTime)}&action=events&sources=${encodeURIComponent(source)}`;

    const response = await fetch(url, {
        mode: 'cors'
    });

    if (!response.ok) {
        console.error(response)
    }

    const data = await response.json();

    return data;
}

export default getEvents;

