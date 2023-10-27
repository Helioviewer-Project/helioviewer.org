import { GetJhvRequestForMovie } from "../Media/VideoPlayer";
import { DOMParser } from "xmldom";
import { XMLHttpRequest } from "xmlhttprequest";

global.XMLHttpRequest = XMLHttpRequest;

// Sampjs doesn't support nodejs, this is a somewhat hacky way to make it work
// requires the xmlhttprequest and xmldom packages.
// Override responseXML with the xmldom object which sampjs expects so that it can parse the response.
Object.defineProperty(XMLHttpRequest.prototype, "responseXML", {
  get: function () {
    return new DOMParser().parseFromString(this.responseText);
  },
  set: function () {},
});

global.helioviewer = {
  serverSettings: {
    jhelioviewerHost: "GSFC",
  },
};

/**
 * @typedef {Object} Layer
 * @property {string} observatory Parsed observatory (SDO, SOHO, etc)
 * @property {string} dataset Parsed dataset (AIA 304, LASCO C2, etc)
 *
 * @typedef {Object} KnownAnswerTest
 * @property {boolean} send Manual flag to send the request to JHelioviewer.
 * @property {string|undefined} startDate Optional start date, used with send option
 * @property {string|undefined} endDate Optional end date, used with send option
 * @property {string} layerString
 * @property {Array<Layer>} expectedResult
 */

test("GetJhvRequestForMovie can extract layers from layer strings", async () => {
  /** @type {Array<KnownAnswerTest>} */
  let KATs = [
    {
      send: false,
      layerString:
        "[SOHO,LASCO,C2,white-light,2,100,0,60,1,2022-10-03T15:51:26.000Z],[SOHO,LASCO,C3,white-light,3,100,0,60,1,2022-10-03T15:51:26.000Z],[SDO,AIA,304,1,100,0,60,1,2022-10-03T15:51:26.000Z]",
      expectedResult: [
        {
          observatory: "SOHO",
          dataset: "LASCO C2",
        },
        {
          observatory: "SOHO",
          dataset: "LASCO C3",
        },
        {
          observatory: "SDO",
          dataset: "AIA 304",
        },
      ],
    },
    {
      send: false,
      layerString: "[GOES-R,SUVI,304,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "GOES-R",
          dataset: "SUVI 304",
        },
      ],
    },
    {
      send: false,
      startDate: "2023-01-01 00:00:00",
      endDate: "2023-01-02 00:00:00",
      layerString:
        "[GONG,GONG,H-alpha,6562,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "NSO-GONG",
          dataset: "GONG H-alpha 6562",
        },
      ],
    },
    {
      send: false,
      layerString: "[IRIS,SJI,1330,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "IRIS",
          dataset: "SJI 1330",
        },
      ],
    },
    {
      send: false,
      layerString: "[SOLO,EUI,FSI,174,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "SOLO",
          dataset: "EUI FSI 174",
        },
      ],
    },
    {
      send: false,
      layerString:
        "[STEREO_A,SECCHI,EUVI,171,2,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "STEREO-A",
          dataset: "SECCHI EUVI 171",
        },
      ],
    },
    {
      send: false,
      layerString:
        "[STEREO_A,SECCHI,COR1,white-light,2,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "STEREO-A",
          dataset: "SECCHI COR1 White Light",
        },
      ],
    },
    {
      send: false,
      layerString: "[TRACE,171,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      startDate: "2010-06-17 17:59:27",
      endDate: "2010-06-18 05:59:27",
      expectedResult: [
        {
          observatory: "TRACE",
          dataset: "171",
        },
      ],
    },
    {
      send: false,
      startDate: "2001-12-14 06:33:49",
      endDate: "2001-12-14 08:20:43",
      layerString: "[Yohkoh,SXT,thin-Al,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "Yohkoh",
          dataset: "SXT Thin Al",
        },
      ],
    },
    {
      send: false,
      startDate: "1992-11-13 12:26:06",
      endDate: "1992-11-13 17:05:32",
      layerString:
        "[Yohkoh,SXT,white-light,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "Yohkoh",
          dataset: "SXT White Light",
        },
      ],
    },
    {
      send: false,
      startDate: "2001-12-14T15:06:33.000Z",
      endDate: "2001-12-15T03:06:33.000Z",
      layerString: "[Yohkoh,SXT,AlMgMn,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "Yohkoh",
          dataset: "SXT AlMgMn",
        },
      ],
    },
    {
      send: false,
      startDate: "2022-11-25T18:52:58.000Z",
      endDate: "2022-11-26T06:52:58.000Z",
      layerString:
        "[MLSO,COSMO,KCor,735,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "MLSO",
          dataset: "COSMO KCor 735",
        },
      ],
    },
    {
      send: false,
      layerString: "[PROBA2,SWAP,174,1,100,0,60,1,2023-10-24T15:10:17.000Z]",
      expectedResult: [
        {
          observatory: "PROBA2",
          dataset: "SWAP 174",
        },
      ],
    },
  ];

  await Promise.all(KATs.map((kat) => RunKat(kat)));
});

/**
 * Run the given known answer test
 * @param {KnownAnswerTest} kat
 */
async function RunKat(kat) {
  let request = GetJhvRequestForMovie(
    MakeTestMovie(kat.layerString, kat.startDate, kat.endDate),
  );
  // Send the result to JHelioviewer for manual testing.
  // See if it actually opens in JHV
  if (kat.send) {
    console.log(request.json);
    await request.Send();
  }
  ValidateRequest(request.json, kat.expectedResult, kat.layerString);
}

/**
 * The function under test expects a movie object.
 * For testing purposes, just wrap the layer string with fake movie metadata
 * @param {string} Layer string to place in the fake movie.
 * @param {string} startDate Optional start date
 * @param {string} endDate Optional end date
 */
function MakeTestMovie(layerString, startDate, endDate) {
  return {
    startDate: startDate ?? "2023-01-01 00:00:00",
    endDate: endDate ?? "2023-02-01 00:00:00",
    numFrames: 60,
    layers: layerString,
  };
}

/**
 * Validates the json generated by the request builder to confirm it contains the expected layers.
 * @param {Object} result JSON generated by the builder
 * @param {Array<Layer>} expected Expected layers
 * @param {string} layerString Layer string under test
 */
function ValidateRequest(result, expected, layerString) {
  /** @type {Array<Layer>} */
  let layers = result["org.helioviewer.jhv.request.image"];
  for (const expectedLayer of expected) {
    let foundLayer = layers.find((layer) => {
      return (
        layer.observatory == expectedLayer.observatory &&
        layer.dataset == expectedLayer.dataset
      );
    });
    // Print a human readable error message to help debug why the test failed.
    // This helps pinpoint which KAT is failing.
    if (typeof foundLayer === "undefined") {
      console.error(
        `Didn't find expected layer ${expectedLayer.observatory} ${expectedLayer.dataset} in layerString: ${layerString}`,
      );
      console.log(layers);
    }
    expect(foundLayer).toBeDefined();
    // GONG is a special case, must be loaded from ROB
    if (foundLayer.observatory != "NSO-GONG") {
      expect(foundLayer.server).toBe(
        helioviewer.serverSettings.jhelioviewerHost,
      );
    } else {
      expect(foundLayer.server).toBe("ROB");
    }
  }
}
