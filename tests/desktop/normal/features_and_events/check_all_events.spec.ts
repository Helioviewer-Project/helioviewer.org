import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import { mockEvents } from "../../../utils/events";

/**
 * This test mocks the HEK and CCMC events, then checks all HEK layer,
 * test validates all HEK markers and checkboxes are enabled, but not for all of the CCMCs events
 */
test("CheckAll should check all event markers also their markers for given sources", async ({
  page,
  browser
}, info) => {
  // mocked event data
  const events = {
    HEK: {
      "Active Region": {
        SPoCA: {
          "SPoCA 37775": {},
          "SPoCA 37776": {}
        },
        "NOAA SWPC Observer": {
          "NOAA 13814": {},
          "NOAA 13815": {}
        }
      },
      "Coronal Hole": {
        SPoCA: {
          "SPoCA 49106": {},
          "SPoCA 49144": {}
        }
      }
    },
    CCMC: {
      DONKI: {
        CME: {
          "Type:C 11 456km": {}
        }
      },
      "Solar Flare Predictions": {
        AMOS: {
          "C+ 34.05% M+: 2.82% X: 0%": {},
          "C+ 77.15% M+: 9.08% X: 0%": {}
        },
        "MAG4 Sharp FE": {
          "M: 34.05% M+: 2.82% X: 0%": {},
          "M: 77.15% M+: 9.08% X: 0%": {}
        }
      }
    }
  };

  // mock events
  await mockEvents(page, events);

  // load helioviewer
  let hv = new Helioviewer(page, info);

  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : Open left sources panel
  await hv.OpenSidebar();

  const hekTree = hv.parseTree("HEK");

  // Action 3 : HEK check all
  await hekTree.checkAll();

  for (const eventtype in events["HEK"]) {
    // assert eventtype markers checkbox is checked
    await hekTree.assertEventTypeNodeChecked(eventtype);

    for (const frm in events["HEK"][eventtype]) {
      // assert frm markers checkbox is checked
      await hekTree.assertFrmNodeChecked(eventtype, frm);

      for (const eventinstance in events["HEK"][eventtype][frm]) {
        // assert eventinstance markers checkbox is checked and assert their markers are visible also
        await hekTree.assertMarkerVisible(eventinstance);
        await hekTree.assertEventInstanceNodeChecked(eventtype, frm, eventinstance);
      }
    }
  }

  // Assert no ccmc node is selected
  const ccmcTree = hv.parseTree("CCMC");

  for (const eventtype in events["CCMC"]) {
    // assert eventtype markers checkbox is NOT checked
    await ccmcTree.assertEventTypeNodeUnchecked(eventtype);

    for (const frm in events["CCMC"][eventtype]) {
      // assert frm markers checkbox is NOT checked
      await ccmcTree.assertFrmNodeUnchecked(eventtype, frm);

      for (const eventinstance in events["CCMC"][eventtype][frm]) {
        // assert eventinstance markers checkbox is NOT checked and assert their markers are NOT visible also
        await ccmcTree.assertMarkerNotVisible(eventinstance);
        await ccmcTree.assertEventInstanceNodeUnchecked(eventtype, frm, eventinstance);
      }
    }
  }
});