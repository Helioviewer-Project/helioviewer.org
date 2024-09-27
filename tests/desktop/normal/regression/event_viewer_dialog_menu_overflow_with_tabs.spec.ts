import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

test("Event viewer dialog menu should not overflow with tabs", async ({ page }) => {
  await page.route("*/**/*action=events&sources=CCMC", async (route) => {
    await route.fulfill({ json: CCMC_JSON });
  });

  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : OPEN SIDEBAR
  await hv.OpenSidebar();

  // Action 3: SET OBSERVATION TIME
  await hv.SetObservationDateTime("2021/05/31", "00:01:29");

  // Action 4: View CCMC CME events
  await expect(page.locator("#tree_CCMC").getByRole("link", { name: "CME" })).toBeVisible();
  await page.locator("#tree_CCMC").getByRole("link", { name: "CME" }).click();

  // Action 5: Click Matching Marker
  await expect(page.locator("#marker_2021-05-30T163600-CME-001")).toBeVisible();
  await page.locator("#marker_2021-05-30T163600-CME-001").click();

  // Action 6: Click link to view dialog menu
  await expect(page.getByText("View source data")).toBeVisible();
  await page.getByText("View source data").click();

  // Dialog should be visible
  await expect(page.locator(".event-info-dialog-menu")).toBeVisible();

  // Action 7 : ADD NEW TABGROUPS TO OVERFLOW
  await page.evaluate(() => {
    $(".event-info-dialog-menu").append($("div.tabgroup:nth-of-type(2)").clone());
    $(".event-info-dialog-menu").append($("div.tabgroup:nth-of-type(2)").clone());
    $(".event-info-dialog-menu").append($("div.tabgroup:nth-of-type(2)").clone());
    $(".event-info-dialog-menu").append($("div.tabgroup:nth-of-type(2)").clone());
  });

  // Check if scrollbar is loaded
  const dialogMenu = page.locator(".event-info-dialog-menu");
  expect(await dialogMenu.evaluate((a) => a.scrollWidth > a.clientWidth)).toBe(true);
});

const CCMC_JSON = [
  {
    name: "DONKI",
    pin: "C3",
    groups: [
      {
        name: "CME",
        contact: "Space Weather Database of NOtifications, Knowledge, Information (DONKI)",
        url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
        data: [
          {
            id: "2021-05-30T16:36:00-CME-001",
            label: "Type: S\nHalf Angle: 10&deg;\n312 km/s\nModeled",
            short_label: "Type: S 10&deg; 312 km/s Modeled",
            version: "M2M_CATALOG",
            type: "CE",
            start: "2021-05-30 16:36:00",
            end: "2021-05-31 16:36:00",
            source: {
              activityID: "2021-05-30T16:36:00-CME-001",
              catalog: "M2M_CATALOG",
              startTime: "2021-05-30T16:36Z",
              instruments: [
                {
                  displayName: "SOHO: LASCO/C2"
                },
                {
                  displayName: "SOHO: LASCO/C3"
                },
                {
                  displayName: "STEREO A: SECCHI/COR2"
                }
              ],
              sourceLocation: "",
              activeRegionNum: null,
              note: "",
              submissionTime: "2021-05-31T21:10Z",
              versionId: 2,
              link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/17028/-1",
              cmeAnalyses: [
                {
                  isMostAccurate: true,
                  time21_5: "2021-05-31T05:28Z",
                  latitude: -13,
                  longitude: 78,
                  halfAngle: 10,
                  speed: 312,
                  type: "S",
                  featureCode: "null",
                  imageType: null,
                  measurementTechnique: "null",
                  note: "",
                  levelOfData: 1,
                  tilt: null,
                  minorHalfWidth: null,
                  speedMeasuredAtHeight: null,
                  submissionTime: "2021-05-31T17:57Z",
                  link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CMEAnalysis/17029/-1",
                  enlilList: [
                    {
                      modelCompletionTime: "2021-05-31T17:28Z",
                      au: 2,
                      estimatedShockArrivalTime: null,
                      estimatedDuration: null,
                      rmin_re: null,
                      kp_18: null,
                      kp_90: null,
                      kp_135: null,
                      kp_180: null,
                      isEarthGB: false,
                      link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/WSA-ENLIL/17021/-1",
                      impactList: [
                        {
                          isGlancingBlow: true,
                          location: "Parker Solar Probe",
                          arrivalTime: "2021-06-02T07:52Z"
                        }
                      ],
                      cmeIDs: [
                        "2021-05-30T00:24:00-CME-001",
                        "2021-05-30T03:12:00-CME-001",
                        "2021-05-30T10:24:00-CME-001",
                        "2021-05-30T16:36:00-CME-001"
                      ]
                    }
                  ]
                }
              ],
              linkedEvents: null
            },
            views: [
              {
                name: "TEST DATA",
                content: {
                  "Activity ID": "2021-05-30T16:36:00-CME-001",
                  Catalog: "M2M_CATALOG",
                  "Active Region": null,
                  "Start Time": "2021-05-30T16:36Z",
                  Latitude: -13,
                  Longitude: 78,
                  "External Link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/17028/-1",
                  Instruments: "SOHO: LASCO/C2, SOHO: LASCO/C3, STEREO A: SECCHI/COR2",
                  "Related Events": null,
                  Note: ""
                }
              },
              {
                tabgroup: 1,
                name: "Analysis 1",
                content: {
                  "Is Most Accurate": true,
                  "Level Of Data": 1,
                  Type: "S",
                  Speed: 312,
                  "Half Angle": 10,
                  Note: "",
                  Link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CMEAnalysis/17029/-1"
                }
              },
              {
                tabgroup: 1,
                name: "Model 1",
                content: {
                  "Model Completion Time": "2021-05-31T17:28Z",
                  Link: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/WSA-ENLIL/17021/-1",
                  "Estimated Shock Arrival Time": null,
                  "Estimated Duration": null,
                  au: 2,
                  rmin_re: null,
                  kp_18: null,
                  kp_90: null,
                  kp_135: null,
                  kp_180: null,
                  "Is Earth GB": false,
                  "Parker Solar Probe Impact": "2021-06-02T07:52Z",
                  "Parker Solar Probe Glancing Blow": true,
                  "20210530_140400_2.0_anim.tim-den.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_anim.tim-den.gif",
                  "20210530_140400_2.0_anim.tim-vel.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_anim.tim-vel.gif",
                  "20210530_140400_2.0_anim.tim-den-Stereo_A.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_anim.tim-den-Stereo_A.gif",
                  "20210530_140400_2.0_anim.tim-den-Stereo_B.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_anim.tim-den-Stereo_B.gif",
                  "20210530_140400_2.0_anim.tim-vel-Stereo_A.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_anim.tim-vel-Stereo_A.gif",
                  "20210530_140400_2.0_anim.tim-vel-Stereo_B.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_anim.tim-vel-Stereo_B.gif",
                  "20210530_140400_2.0_ENLIL_CONE_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_Kp_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_Kp_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_PSP_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_PSP_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_STA_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_STA_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_STB_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_STB_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_Mars_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_Mars_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_Merc_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_Merc_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_SolO_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_SolO_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_Venus_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_Venus_timeline.gif",
                  "20210530_140400_2.0_ENLIL_CONE_Osiris_timeline.gif":
                    "https://iswa.gsfc.nasa.gov/downloads/20210530_140400_2.0_ENLIL_CONE_Osiris_timeline.gif"
                }
              }
            ],
            hv_hpc_x: 926.3634515083418,
            hv_hpc_y: -214.12679432271327,
            link: {
              url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/17028/-1",
              text: "Go to full analysis"
            }
          }
        ]
      }
    ]
  }
];
