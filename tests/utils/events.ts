import { Page } from "@playwright/test";

/** @typedef {string} Source, type for source keys in tree, it can only be our event resource keys */
type Source = string;

/** @typedef {string} EventType, Type for event types , like "Active Region" */
type EventType = string;

/** @typedef {string} Frm, Type for frm names , like "SPoCA" */
type Frm = string;

/** @typedef {string} EventLabel, Type for event labels, short_label for event instances */
type EventLabel = string;

/** @typedef {Record<string, any>} EventData, Type for any additional data to pass the event */
type EventData = Record<string, any>;

/** @typedef {Record<EventLabel, EventData>} Events, Type for event instances holding all event_label => event_instance branches */
type Events = Record<EventLabel, EventData>;

/** @typedef {Record<Frm, Events>} Frms, Type for frms holding all frm => event_instance branches */
type Frms = Record<Frm, Events>;

/** @typedef {Record<EventType, Frms>} EventTypes,  Type for event_types holding all event_type => frms branches */
type EventTypes = Record<EventType, Frms>;

/** @typedef {Record<Source, EventTypes>} EventTree,  Type for event_tree holding all source tree branches */
type EventTree = Record<Source, EventTypes>;

/**
 * Inject desired event_tree into the our displayed events
 * @param {Page} page. reference of the page, so we can use it to mock event requests
 * @param {EventTree} eventTree. this event tree includes all the events data in logical order
 * @returns {Promise<void>} , promise to wait for function to finish
 */
async function mockEvents(page: Page, eventTree: EventTree): Promise<void> {
  // Iterate in event tree source trees
  for (const source in eventTree) {
    // Mock API events request to include problem data which creates bug
    await page.route(`**/*action=events&sources=${source}*`, async (route) => {
      // Fetch original response.
      const response = await route.fetch();

      // const newJson = await response.json()
      const newJson = [];

      for (const eventtype in eventTree[source]) {
        // Event PIN is needed in HV, for "Active Region" our pin is "AR"
        const eventTypePin = eventtype
          .split(" ")
          .map((v) => v.charAt(0).toUpperCase())
          .join("");

        // This randomEventTye is required for displaying proper event_markers
        const randomEventType = [
          "AR",
          "CC",
          "CD",
          "CE",
          "CH",
          "CJ",
          "CR",
          "CW",
          "EF",
          "ER",
          "FA",
          "FE",
          "FI",
          "FL",
          "LP",
          "OS",
          "PG",
          "SG",
          "SP",
          "SS",
          "TO",
          "UNK"
        ].sort(() => 0.5 - Math.random())[0];

        // Generate event source tree
        newJson.push({
          name: eventtype,
          pin: eventTypePin,
          groups: Object.keys(eventTree[source][eventtype]).map((frm) => {
            return {
              name: frm,
              data: Object.keys(eventTree[source][eventtype][frm]).map((eventlabel) => {
                // frm reference used with no spaces
                const frmReference = frm.split(" ").join("");

                // randomize some number to differentiate events under same frm with same event_instances
                const randomMilliseconds: string = Math.floor(Math.random() * 1000)
                  .toString()
                  .padStart(3, "0");

                // generate event instances
                // Default event instance
                const generatedEventInstance = {
                  concept: eventtype,
                  label: eventlabel,
                  shortlabel: eventlabel,
                  eventtype: "24",
                  event_type: eventTypePin,
                  frm_name: frm,
                  hv_labels_formatted: {
                    "Event Type": eventtype
                  },
                  type: randomEventType,
                  id: `ivo://helio-informatics.org/${eventTypePin}_${frmReference}_20180904_192913_2017-09-06T120400.${randomMilliseconds}-007`,
                  active: "true",
                  area_atdiskcenter: null,
                  area_atdiskcenteruncert: null,
                  area_raw: null,
                  area_uncert: null,
                  area_unit: "",
                  ar_compactnesscls: "",
                  ar_mcintoshcls: "",
                  ar_mtwilsoncls: "",
                  ar_noaaclass: "",
                  ar_noaanum: null,
                  ar_numspots: null,
                  ar_penumbracls: "",
                  ar_polarity: null,
                  ar_zurichcls: "",
                  boundbox_c1ll: 330.6570129394531,
                  boundbox_c1ur: 334.6570129394531,
                  boundbox_c2ll: 50.80099868774414,
                  boundbox_c2ur: 54.80099868774414,
                  bound_ccnsteps: null,
                  bound_ccstartc1: null,
                  bound_ccstartc2: null,
                  bound_chaincode: "",
                  chaincodetype: "",
                  comment_count: "0",
                  event_avg_rating: null,
                  event_c1error: 2,
                  event_c2error: 2,
                  event_clippedspatial: "",
                  event_clippedtemporal: "",
                  event_coord1: 332.6570129394531,
                  event_coord2: 52.80099868774414,
                  event_coord3: 1.04544997215271,
                  event_coordsys: "UTC-HGC-TOPO",
                  event_coordunit: "degrees",
                  event_description: "",
                  event_endtime: "2017-09-06T15:04:00",
                  event_expires: "",
                  event_importance: null,
                  event_importance_num_ratings: "",
                  event_mapurl: "",
                  event_maskurl: "",
                  event_npixels: null,
                  event_peaktime: "",
                  event_pixelunit: "",
                  event_probability: null,
                  event_score: "",
                  event_starttime: "2017-09-06T09:04:00",
                  event_testflag: "false",
                  event_title: "",
                  frm_contact: "Marc DeRosa/derosa[at]lmsal.com",
                  frm_daterun: "2018-09-04T19:29:13",
                  frm_humanflag: "false",
                  frm_identifier: "What goes here?",
                  frm_institute: "LMSAL",
                  frm_paramset: "2017-09-06T12:04:00.000/nlat=192,rtop=2.5,rix=[2,37]",
                  frm_specificid: "",
                  frm_url: "https://doi.org/10.1023/A:1022908504100",
                  frm_versionnumber: 20180800,
                  gs_galleryid: "",
                  gs_imageurl: "",
                  gs_movieurl: "",
                  gs_thumburl: "",
                  hcr_checked: "false",
                  hgc_bbox: "POLYGON((-29.343 50.801,-25.343 50.801,-25.343 54.801,-29.343 54.801,-29.343 50.801))",
                  hgc_boundcc: "",
                  hgc_coord: "POINT(-27.343 52.801)",
                  hgc_x: -27.343,
                  hgc_y: 52.801,
                  hgs_bbox:
                    "POLYGON((-113.207998 50.801,-109.207998 50.801,-109.207998 54.801,-113.207998 54.801,-113.207998 50.801))",
                  hgs_boundcc: "",
                  hgs_coord: "POINT(-111.207998 52.801)",
                  hgs_x: -111.207998,
                  hgs_y: 52.801,
                  hpc_bbox:
                    "POLYGON((-552.292776 760.80618,-567.572718 756.0168,-517.700214 793.71858,-503.771232 798.08076,-552.292776 760.80618))",
                  hpc_boundcc: "",
                  hpc_coord: "POINT(-535.987332 777.64368)",
                  hpc_geom: "",
                  hpc_radius: "944.463928960984958",
                  hpc_x: -535.987332,
                  hpc_y: 777.64368,
                  hrc_a: 34.5763750659618,
                  hrc_bbox:
                    "POLYGON((0.98811 35.97706,0.993599 36.897056,0.995987 33.114262,0.99194 32.261284,0.98811 35.97706))",
                  hrc_boundcc: "",
                  hrc_coord: "POINT(0.992659722485869 34.5763750659618)",
                  hrc_r: 0.992659722485869,
                  hv_hpc_r_scaled: 952.3931483376375,
                  hv_hpc_x_final: -539.9789614464564,
                  hv_hpc_x_notscaled_rot: -535.48332679016,
                  hv_hpc_x_rot_delta_notscaled: 0.5040052098399883,
                  hv_hpc_x_scaled_rot: -539.9789614464564,
                  hv_hpc_y_final: 782.6184204061095,
                  hv_hpc_y_notscaled_rot: 776.102673044381,
                  hv_hpc_y_rot_delta_notscaled: -1.5410069556189683,
                  hv_hpc_y_scaled_rot: 782.6184204061095,
                  hv_rot_hpc_time_base: "2017-09-06T09:04:00",
                  hv_rot_hpc_time_targ: "2017-09-06T11:59:29.000Z",
                  intenskurt: null,
                  intensmax: null,
                  intensmean: null,
                  intensmedian: null,
                  intensmin: null,
                  intensskew: null,
                  intenstotal: null,
                  intensunit: "",
                  intensvar: null,
                  kb_archivdate: "2018-09-04T19:29:21",
                  kb_archivid:
                    "ivo://helio-informatics.org/TO_SSWPFSSv2+nullpointfinderv20180808_20180904_192913_2017-09-06T120400.000-007",
                  kb_archivist: "derosa_marc",
                  noposition: "false",
                  obs_channelid: "N/A",
                  obs_dataprepurl: "",
                  obs_firstprocessingdate: "",
                  obs_includesnrt: "",
                  obs_instrument: "N/A",
                  obs_lastprocessingdate: "",
                  obs_levelnum: null,
                  obs_meanwavel: 0,
                  obs_observatory: "N/A",
                  obs_title: "",
                  obs_wavelunit: "cm",
                  rasterscan: "",
                  rasterscantype: "",
                  refs: [
                    {
                      ref_name: "FRM_URL",
                      ref_type: "unknown",
                      ref_url: "https://doi.org/10.1023/A:1022908504100"
                    }
                  ],
                  refs_orig: "",
                  revision: "1",
                  search_channelid: "nil",
                  search_frm_name: "LMSAL SSW PFSS forecast",
                  search_instrument: "nil",
                  search_observatory: "nil",
                  skel_chaincode: "",
                  skel_curvature: null,
                  skel_nsteps: null,
                  skel_startc1: null,
                  skel_startc2: null,
                  solar_object_locator: "SOL2017-09-06T09:04:00L333C038",
                  SOL_standard: "SOL2017-09-06T09:04:00L333C038",
                  sum_overlap_scores: "0",
                  to_shape: "",
                  hv_marker_offset_x: "0",
                  hv_marker_offset_y: "0",
                  hv_hpc_x: -539.9789614464564,
                  hv_hpc_y: 782.6184204061095,
                  version: "",
                  start: "2017-09-06T09:04:00",
                  end: "2017-09-06T15:04:00"
                };

                // merge it with the given one
                return Object.assign({}, generatedEventInstance, eventTree[source][eventtype][frm]);
              })
            };
          })
        });
      }

      await route.fulfill({
        json: newJson
      });
    });
  }
}

export { mockEvents };
