const coordinates = new CoordinateSystemsHelper();
var input = {
    x: 940.0,
    y: 0.0,
    utc: "2017-07-26T00:00:00.000Z",
    //utc: new Date().toISOString(),
    observer: "EARTH",
    target: "SUN"
}

const client = new WebGLClientRenderer(coordinates);
const apiURL = "http://api.hv.org";

var InitDemo = async function () {
    client.start();
};
coordinates._convertHPCtoHCC(input).then(data=>console.log(data));