import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import { mockEvents } from "../../../utils/events";

/**
 * This test mocks some random events for CCMC
 * then all matching event markers should be visible
 * then toggle visibility of layer CCMC, ,
 * asserts all previously selected events of CCMC this layer should be hidden
 * then toggles again for CCMC, to show all of the events
 * then validates all previously selected events should be visible
 */
test("Toggle visibility of events should hide/show events on then sun", async ({ page, browser }, info) => {
  // mocked event data
  const events = {
    CCMC: {
      DONKI: {
        CME: {
          "Type:C 11": {},
          "Type:C 12": {}
        }
      },
      "Solar Flare Predictions": {
        AMOS: {
          "C+ 34.05%": {},
          "C+ 77.15%": {}
        },
        "MAG4 Sharp FE": {
          "M: 34.05%": {},
          "M: 77.15%": {}
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

  // Parse event tree pieces
  const ccmc = hv.parseTree("CCMC");

  // Action 3 : Check DONKI
  await ccmc.toggleCheckEventType("DONKI");

  // Action 4 : Check AMOS
  await ccmc.toggleCheckFRM("Solar Flare Predictions", "AMOS");

  // Action 5 : Check M: 77.15%
  await ccmc.toggleBranchFRM("Solar Flare Predictions", "MAG4 Sharp FE");
  await ccmc.toggleCheckEventInstance("Solar Flare Predictions", "MAG4 Sharp FE", "M: 77.15%");

  // Assert all checked markers need to be visible or not
  await ccmc.assertEventVisible("Type:C 11");
  await ccmc.assertEventVisible("Type:C 12");
  await ccmc.assertEventVisible("C+ 34.05%");
  await ccmc.assertEventVisible("C+ 77.15%");
  await ccmc.assertEventVisible("M: 77.15%");
  await ccmc.assertEventNotVisible("M: 34.05%");

  // Action 6:  toggle to hide all events for CCMC
  await ccmc.toggleVisibilityEvents();

  // Assert now nothing should be shown
  await ccmc.assertEventNotVisible("Type:C 11");
  await ccmc.assertEventNotVisible("Type:C 12");
  await ccmc.assertEventNotVisible("C+ 34.05%");
  await ccmc.assertEventNotVisible("C+ 77.15%");
  await ccmc.assertEventNotVisible("M: 77.15%");
  await ccmc.assertEventNotVisible("M: 34.05%");

  // Action 7:  toggle to show events
  await ccmc.toggleVisibilityEvents();

  // Assert empty event types should be visible for ccmc but not for not hek
  await ccmc.assertEventVisible("Type:C 11");
  await ccmc.assertEventVisible("Type:C 12");
  await ccmc.assertEventVisible("C+ 34.05%");
  await ccmc.assertEventVisible("C+ 77.15%");
  await ccmc.assertEventVisible("M: 77.15%");
  await ccmc.assertEventNotVisible("M: 34.05%");
});

/**
 * This test mocks some random events
 * then all matching event markers should be visible
 * then toggle visibility of one event layer ( HEK, CCMC ),
 * asserts all events of this layer should be hidden
 * then reload the page
 * visibility of event layers should be in same configuration
 */
test("Toggle visibility of events should be preserved with state", async ({ page, browser }, info) => {
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
          "Type:C 11": {}
        }
      },
      "Solar Flare Predictions": {
        AMOS: {
          "C+ 34.05% M+": {},
          "C+ 77.15% M+": {}
        },
        "MAG4 Sharp FE": {
          "M: 34.05% M+": {},
          "M: 77.15% M+": {}
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

  // Parse event tree pieces
  const hek = hv.parseTree("HEK");
  const ccmc = hv.parseTree("CCMC");

  // Action 3 : Check CCMC/DONKI AND HEK/Coronal Hole
  await ccmc.toggleCheckEventType("DONKI");
  await hek.toggleCheckEventType("Coronal Hole");

  // Assert all checked markers need to be visible or not
  await ccmc.assertEventVisible("Type:C 11");
  await ccmc.assertEventNotVisible("C+ 34.05% M+");
  await hek.assertEventVisible("SPoCA 49106");
  await hek.assertEventNotVisible("NOAA 13815");

  // Action 6:  toggle to hide all events for CCMC
  await ccmc.toggleVisibilityEvents();

  // Assert now no ccmc event is visible, hek should stay same
  await ccmc.assertEventNotVisible("Type:C 11");
  await ccmc.assertEventNotVisible("C+ 34.05% M+");
  await hek.assertEventVisible("SPoCA 49106");
  await hek.assertEventNotVisible("NOAA 13815");

  // Action 7 : Reload Page
  await hv.Load();
  await hv.CloseAllNotifications();

  // Parse event tree piecesi again
  const hekReload = hv.parseTree("HEK");
  const ccmcReload = hv.parseTree("CCMC");

  // Nothing should change
  await ccmcReload.assertEventNotVisible("Type:C 11");
  await ccmcReload.assertEventNotVisible("C+ 34.05% M+");
  await hekReload.assertEventVisible("SPoCA 49106");
  await hekReload.assertEventNotVisible("NOAA 13815");
});
