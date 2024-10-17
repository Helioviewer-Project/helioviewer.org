import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

/**
 * This test is a regression test for proving issue 588 is fixed for the given helioviewer
 * @see https://github.com/Helioviewer-Project/helioviewer.org/issues/588
 */
test("Issue 588, special characters in event tree causing to tree to fail", async ({ page, browser }, info) => {
  // Mock API events request to include problem data which creates bug
  await page.route("**/*action=events&sources=HEK*", async (route) => {
    // Fetch original response.
    const response = await route.fetch();
    // Add a prefix to the title.
    let newJson = await response.json();

    newJson.push({
      name: "Topological Object",
      pin: "TO",
      groups: [
        {
          name: "SSW PFSS v2 + null point finder v20180808",
          data: [
            {
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
              concept: "Topological Object",
              eventtype: "24",
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
              event_type: "TO",
              frm_contact: "Marc DeRosa/derosa[at]lmsal.com",
              frm_daterun: "2018-09-04T19:29:13",
              frm_humanflag: "false",
              frm_identifier: "What goes here?",
              frm_institute: "LMSAL",
              frm_name: "SSW PFSS v2 + null point finder v20180808",
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
              hv_labels_formatted: {
                "Event Type": "Topological Object"
              },
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
              label: "Topological Object 332.66,52.80",
              short_label: "Topological Object 332.66,52.80",
              version: "",
              id: "ivo://helio-informatics.org/TO_SSWPFSSv2+nullpointfinderv20180808_20180904_192913_2017-09-06T120400.000-007",
              type: "TO",
              start: "2017-09-06T09:04:00",
              end: "2017-09-06T15:04:00"
            },
            {
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
              boundbox_c1ll: 32.86600112915039,
              boundbox_c1ur: 36.86600112915039,
              boundbox_c2ll: 49.76559829711914,
              boundbox_c2ur: 53.76559829711914,
              bound_ccnsteps: null,
              bound_ccstartc1: null,
              bound_ccstartc2: null,
              bound_chaincode: "",
              chaincodetype: "",
              comment_count: "0",
              concept: "Topological Object",
              eventtype: "24",
              event_avg_rating: null,
              event_c1error: 2,
              event_c2error: 2,
              event_clippedspatial: "",
              event_clippedtemporal: "",
              event_coord1: 34.86600112915039,
              event_coord2: 51.76559829711914,
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
              event_type: "TO",
              frm_contact: "Marc DeRosa/derosa[at]lmsal.com",
              frm_daterun: "2018-09-04T19:29:13",
              frm_humanflag: "false",
              frm_identifier: "What goes here?",
              frm_institute: "LMSAL",
              frm_name: "SSW PFSS v2 + null point finder v20180808",
              frm_paramset: "2017-09-06T12:04:00.000/nlat=192,rtop=2.5,rix=[2,37]",
              frm_specificid: "",
              frm_url: "https://doi.org/10.1023/A:1022908504100",
              frm_versionnumber: 20180800,
              gs_galleryid: "",
              gs_imageurl: "",
              gs_movieurl: "",
              gs_thumburl: "",
              hcr_checked: "true",
              hgc_bbox: "POLYGON((32.866 49.7656,36.866 49.7656,36.866 53.7656,32.866 53.7656,32.866 49.7656))",
              hgc_boundcc: "",
              hgc_coord: "POINT(34.866 51.7656)",
              hgc_x: 34.866,
              hgc_y: 51.7656,
              hgs_bbox:
                "POLYGON((-50.998998 49.7656,-46.998998 49.7656,-46.998998 53.7656,-50.998998 53.7656,-50.998998 49.7656))",
              hgs_boundcc: "",
              hgs_coord: "POINT(-48.998998 51.7656)",
              hgs_x: -48.998998,
              hgs_y: 51.7656,
              hpc_bbox:
                "POLYGON((-478.69818 673.31886,-450.560988 669.33102,-412.25664 714.59652,-438.007584 718.23894,-478.69818 673.31886))",
              hpc_boundcc: "",
              hpc_coord: "POINT(-445.42413 694.26804)",
              hpc_geom:
                "010300000001000000050000008AABCABE2BEB7DC005C078068D0A85402D978DCEF9287CC09352D0EDA5EA8440876D8B321BC479C0481B47ACC5548640917F66101F607BC0A6ED5F59E97186408AABCABE2BEB7DC005C078068D0A8540",
              hpc_radius: "824.870151570353869",
              hpc_x: -445.42413,
              hpc_y: 694.26804,
              hrc_a: 32.6831641628919,
              hrc_bbox:
                "POLYGON((0.8683 35.411045,0.848025 33.946516,0.867086 29.981003,0.884189 31.37632,0.8683 35.411045))",
              hrc_boundcc: "",
              hrc_coord: "POINT(0.866963100057714 32.6831641628919)",
              hrc_r: 0.866963100057714,
              hv_hpc_r_scaled: 831.7953248760716,
              hv_hpc_x_final: -439.6667106308628,
              hv_hpc_x_notscaled_rot: -436.00623301477714,
              hv_hpc_x_rot_delta_notscaled: 9.417896985222853,
              hv_hpc_x_scaled_rot: -439.6667106308628,
              hv_hpc_y_final: 698.7768606222759,
              hv_hpc_y_notscaled_rot: 692.9591423481853,
              hv_hpc_y_rot_delta_notscaled: -1.308897651814732,
              hv_hpc_y_scaled_rot: 698.7768606222759,
              hv_labels_formatted: {
                "Event Type": "Topological Object"
              },
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
              kb_archivdate: "2018-09-04T19:29:22",
              kb_archivid:
                "ivo://helio-informatics.org/TO_SSWPFSSv2+nullpointfinderv20180808_20180904_192913_2017-09-06T120400.000-008",
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
              solar_object_locator: "SOL2017-09-06T09:04:00L034C039",
              SOL_standard: "SOL2017-09-06T09:04:00L034C039",
              sum_overlap_scores: "0",
              to_shape: "",
              hv_marker_offset_x: "0",
              hv_marker_offset_y: "0",
              hv_hpc_x: -439.6667106308628,
              hv_hpc_y: 698.7768606222759,
              label: "Topological Object 34.87,51.77",
              short_label: "Topological Object 34.87,51.77",
              version: "",
              id: "ivo://helio-informatics.org/TO_SSWPFSSv2+nullpointfinderv20180808_20180904_192913_2017-09-06T120400.000-008",
              type: "TO",
              start: "2017-09-06T09:04:00",
              end: "2017-09-06T15:04:00"
            },
            {
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
              boundbox_c1ll: 202.85400390625,
              boundbox_c1ur: 206.85400390625,
              boundbox_c2ll: 38.70289993286133,
              boundbox_c2ur: 42.70289993286133,
              bound_ccnsteps: null,
              bound_ccstartc1: null,
              bound_ccstartc2: null,
              bound_chaincode: "",
              chaincodetype: "",
              comment_count: "0",
              concept: "Topological Object",
              eventtype: "24",
              event_avg_rating: null,
              event_c1error: 2,
              event_c2error: 2,
              event_clippedspatial: "",
              event_clippedtemporal: "",
              event_coord1: 204.85400390625,
              event_coord2: 40.70289993286133,
              event_coord3: 1.0495400428771973,
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
              event_type: "TO",
              frm_contact: "Marc DeRosa/derosa[at]lmsal.com",
              frm_daterun: "2018-09-04T19:29:13",
              frm_humanflag: "false",
              frm_identifier: "What goes here?",
              frm_institute: "LMSAL",
              frm_name: "SSW PFSS v2 + null point finder v20180808",
              frm_paramset: "2017-09-06T12:04:00.000/nlat=192,rtop=2.5,rix=[2,37]",
              frm_specificid: "",
              frm_url: "https://doi.org/10.1023/A:1022908504100",
              frm_versionnumber: 20180800,
              gs_galleryid: "",
              gs_imageurl: "",
              gs_movieurl: "",
              gs_thumburl: "",
              hcr_checked: "false",
              hgc_bbox:
                "POLYGON((-157.146 38.7029,-153.146 38.7029,-153.146 42.7029,-157.146 42.7029,-157.146 38.7029))",
              hgc_boundcc: "",
              hgc_coord: "POINT(-155.146 40.7029)",
              hgc_x: -155.146,
              hgc_y: 40.7029,
              hgs_bbox:
                "POLYGON((118.989002 38.7029,122.989002 38.7029,122.989002 42.7029,118.989002 42.7029,118.989002 38.7029))",
              hgs_boundcc: "",
              hgs_coord: "POINT(120.989002 40.7029)",
              hgs_x: 120.989002,
              hgs_y: 40.7029,
              hpc_bbox:
                "POLYGON((648.59772 634.69218,621.8175 640.15128,585.63312 687.14556,610.8474 682.01364,648.59772 634.69218))",
              hpc_boundcc: "",
              hpc_coord: "POINT(617.47476 661.42944)",
              hpc_geom: "",
              hpc_radius: "904.855780406895065",
              hpc_x: 617.47476,
              hpc_y: 661.42944,
              hrc_a: 316.968424801839,
              hrc_bbox:
                "POLYGON((0.953785 314.379176,0.937982 315.83233,0.948921 319.560061,0.962296 318.150698,0.953785 314.379176))",
              hrc_boundcc: "",
              hrc_coord: "POINT(0.95103037853079 316.968424801839)",
              hrc_r: 0.95103037853079,
              hv_hpc_r_scaled: 912.4524707272669,
              hv_hpc_x_final: 627.7188384092858,
              hv_hpc_x_notscaled_rot: 622.4927189382539,
              hv_hpc_x_rot_delta_notscaled: 5.017958938253969,
              hv_hpc_x_scaled_rot: 627.7188384092858,
              hv_hpc_y_final: 668.8927563229474,
              hv_hpc_y_notscaled_rot: 663.3238403625629,
              hv_hpc_y_rot_delta_notscaled: 1.8944003625629193,
              hv_hpc_y_scaled_rot: 668.8927563229474,
              hv_labels_formatted: {
                "Event Type": "Topological Object"
              },
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
              kb_archivdate: "2018-09-04T19:29:19",
              kb_archivid:
                "ivo://helio-informatics.org/TO_SSWPFSSv2+nullpointfinderv20180808_20180904_192913_2017-09-06T120400.000-005",
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
              solar_object_locator: "SOL2017-09-06T09:04:00L205C050",
              SOL_standard: "SOL2017-09-06T09:04:00L205C050",
              sum_overlap_scores: "0",
              to_shape: "",
              hv_marker_offset_x: "0",
              hv_marker_offset_y: "0",
              hv_hpc_x: 627.7188384092858,
              hv_hpc_y: 668.8927563229474,
              label: "Topological Object 204.85,40.70",
              short_label: "Topological Object 204.85,40.70",
              version: "",
              id: "ivo://helio-informatics.org/TO_SSWPFSSv2+nullpointfinderv20180808_20180904_192913_2017-09-06T120400.000-005",
              type: "TO",
              start: "2017-09-06T09:04:00",
              end: "2017-09-06T15:04:00"
            }
          ]
        }
      ]
    });

    await route.fulfill({
      json: newJson
    });
  });

  // load helioviewer
  let hv = new Helioviewer(page, info);

  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : Open left sources panel
  await hv.OpenSidebar();

  const eventTree = hv.parseTree("HEK");

  // Mocked event_type , frms and attached event instances should all be correctly in the event tree
  expect(await eventTree.hasEventType("Topological Object")).toBe(true);

  expect(await eventTree.hasFRM("Topological Object", "SSW PFSS v2 + null point finder v20180808")).toBe(true);
  expect(await eventTree.frmEventCount("Topological Object", "SSW PFSS v2 + null point finder v20180808")).toBe(3);
  expect(
    await eventTree.frmHasEventInstance(
      "Topological Object",
      "SSW PFSS v2 + null point finder v20180808",
      "Topological Object 332.66,52.80"
    )
  ).toBe(true);
  expect(
    await eventTree.frmHasEventInstance(
      "Topological Object",
      "SSW PFSS v2 + null point finder v20180808",
      "Topological Object 34.87,51.77"
    )
  ).toBe(true);
  expect(
    await eventTree.frmHasEventInstance(
      "Topological Object",
      "SSW PFSS v2 + null point finder v20180808",
      "Topological Object 204.85,40.70"
    )
  ).toBe(true);
  expect(
    await eventTree.frmHasEventInstance(
      "Topological Object",
      "SSW PFSS v2 + null point finder v20180808",
      "Topological Object Not Exists"
    )
  ).toBe(false);

  // Action 3: Check event_type "Topological Object" from the event tree
  await eventTree.toggleCheckEventType("Topological Object");

  // All event markers belong to "Topological Object' should be visible
  await eventTree.assertEventVisible("Topological Object 332.66,52.80");
  await eventTree.assertEventVisible("Topological Object 34.87,51.77");
  await eventTree.assertEventVisible("Topological Object 204.85,40.70");
  await eventTree.assertEventNotVisible("Topological Object Not Exists");

  // Action 4: Uncheck event_type "Topological Object" from the event tree
  await eventTree.toggleCheckEventType("Topological Object");

  // All event markers belong to "Topological Object" should NOT be visible
  await eventTree.assertEventNotVisible("Topological Object 332.66,52.80");
  await eventTree.assertEventNotVisible("Topological Object 34.87,51.77");
  await eventTree.assertEventNotVisible("Topological Object 204.85,40.70");

  // Action 5: Check frm "SSW PFSS v2 + null point finder v20180808" from the event tree
  await eventTree.toggleCheckFRM("Topological Object", "SSW PFSS v2 + null point finder v20180808");

  // All event markers belong to "SSW PFSS v2 + null point finder v20180808" should be visible
  await eventTree.assertEventVisible("Topological Object 332.66,52.80");
  await eventTree.assertEventVisible("Topological Object 34.87,51.77");
  await eventTree.assertEventVisible("Topological Object 204.85,40.70");

  // Action 6: Uncheck frm "SSW PFSS v2 + null point finder v20180808" from the event tree
  await eventTree.toggleCheckFRM("Topological Object", "SSW PFSS v2 + null point finder v20180808");

  // All event markers belong to "SSW PFSS v2 + null point finder v20180808" should NOT be visible
  await eventTree.assertEventNotVisible("Topological Object 332.66,52.80");
  await eventTree.assertEventNotVisible("Topological Object 34.87,51.77");
  await eventTree.assertEventNotVisible("Topological Object 204.85,40.70");

  // Action 6: Open up the frm branch of "SSW PFSS v2 + null point finder v20180808" to see all event instance nodes under this branch
  await eventTree.toggleBranchFRM("Topological Object", "SSW PFSS v2 + null point finder v20180808");

  // Tree node for event instance should be visible
  await eventTree.assertEventInstanceTreeNodeVisible(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 332.66,52.80"
  );

  // Action 7: Close the frm branch of "SSW PFSS v2 + null point finder v20180808" to hide all event instance nodes under this branch
  await eventTree.toggleBranchFRM("Topological Object", "SSW PFSS v2 + null point finder v20180808");

  // Tree node for event instance should NOT be visible
  await eventTree.assertEventInstanceTreeNodeNotVisible(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 332.66,52.80"
  );

  // Action 8: Open up the frm branch of "SSW PFSS v2 + null point finder v20180808" to see all event instance nodes under this branch
  await eventTree.toggleBranchFRM("Topological Object", "SSW PFSS v2 + null point finder v20180808");

  // Action 9: Check event instance node "Topological Object 332.66,52.80" to see event marker attached to it
  await eventTree.toggleCheckEventInstance(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 332.66,52.80"
  );

  // Only requested marker should be visible not all of them
  await eventTree.assertEventVisible("Topological Object 332.66,52.80");
  await eventTree.assertEventNotVisible("Topological Object 34.87,51.77");
  await eventTree.assertEventNotVisible("Topological Object 204.85,40.70");

  // Action 9: UnCheck event instance node "Topological Object 332.66,52.80" to hide event marker attached to it
  await eventTree.toggleCheckEventInstance(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 332.66,52.80"
  );
  // Action 10: Check event instance node "Topological Object 34.87,51.77" to show event marker attached to it
  await eventTree.toggleCheckEventInstance(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 34.87,51.77"
  );
  // Action 11: Check event instance node "Topological Object 204.85,40.70" to show event marker attached to it
  await eventTree.toggleCheckEventInstance(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 204.85,40.70"
  );

  // Now 2 of them should be visible while the other one is hidden
  await eventTree.assertEventNotVisible("Topological Object 332.66,52.80");
  await eventTree.assertEventVisible("Topological Object 34.87,51.77");
  await eventTree.assertEventVisible("Topological Object 204.85,40.70");

  // Action 12: Hover on our logo , to test hovering affects of event markers
  await hv.HoverOnLogo();

  // Assert markers should be visible but NOT highlighted
  await eventTree.assertEventNotHighlighted("Topological Object 34.87,51.77");
  await eventTree.assertEventNotHighlighted("Topological Object 204.85,40.70");

  // Action 13: Hover on our event type node  "Topological Object" inside the event tree
  await eventTree.hoverOnEventType("Topological Object");

  // Assert markers should be visible and highlighted
  await eventTree.assertEventHighlighted("Topological Object 34.87,51.77");
  await eventTree.assertEventHighlighted("Topological Object 204.85,40.70");

  // Action 14: Hover on our logo , to test hovering affects of event markers
  await hv.HoverOnLogo();

  // Assert markers should be visible but NOT highlighted
  await eventTree.assertEventNotHighlighted("Topological Object 34.87,51.77");
  await eventTree.assertEventNotHighlighted("Topological Object 204.85,40.70");

  // Action 15: Hover on our frm node  "SSW PFSS v2 + null point finder v20180808" inside the event tree
  await eventTree.hoverOnFRM("Topological Object", "SSW PFSS v2 + null point finder v20180808");

  // Assert markers should be visible and highlighted
  await eventTree.assertEventHighlighted("Topological Object 34.87,51.77");
  await eventTree.assertEventHighlighted("Topological Object 204.85,40.70");

  // Action 16: Hover on our logo , to test hovering affects of event markers
  await hv.HoverOnLogo();

  // Assert markers should be visible but NOT highlighted
  await eventTree.assertEventNotHighlighted("Topological Object 34.87,51.77");
  await eventTree.assertEventNotHighlighted("Topological Object 204.85,40.70");

  // Action 17: Hover on our event instance node  "Topological Object 34.87,51.77" inside the event tree
  await eventTree.hoverOnEventInstance(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 34.87,51.77"
  );

  // Now only hovered event_instances should be highlighted but not the other ones
  await eventTree.assertEventHighlighted("Topological Object 34.87,51.77");
  await eventTree.assertEventNotHighlighted("Topological Object 204.85,40.70");

  // Action 18: Hover on our event instance node  "Topological Object 204.85,40.70" inside the event tree
  await eventTree.hoverOnEventInstance(
    "Topological Object",
    "SSW PFSS v2 + null point finder v20180808",
    "Topological Object 204.85,40.70"
  );

  // Now only hovered event_instances should be highlighted but not the other ones
  await eventTree.assertEventNotHighlighted("Topological Object 34.87,51.77");
  await eventTree.assertEventHighlighted("Topological Object 204.85,40.70");
});
