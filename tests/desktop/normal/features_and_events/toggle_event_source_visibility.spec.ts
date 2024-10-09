import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import { mockEvents } from "../../../utils/events";

/**
 * This test mocks some random events including some empty event-types
 * then validates they are visible eventhough they are not checked
 * then toggle empty resource visibility,
 * then validates they those empty event-type nodes are not visible anymore
 */
test("Toggle event source visibility should hide/show empty event-type nodes, on off style", async ({
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
      },
      "EMPTY EVENT TYPE HEK": {}
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
      },
      "EMPTY EVENT TYPE CCMC": {}
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

  // Action 3: toggle empty event source visibility for HEK layer
  await hek.toggleVisibilityEmptyEventSources();

  // Assert empty event types should be visible for ccmc but not for hek
  await ccmc.assertEventTypeNodeVisible("EMPTY EVENT TYPE CCMC");
  await hek.assertEventTypeNodeNotVisible("EMPTY EVENT TYPE HEK");

  // Action 4: now toggle again to make empty event types appear for HEK
  await hek.toggleVisibilityEmptyEventSources();
  // Action 5:  toggle to hide empty event types for CCMC this time
  await ccmc.toggleVisibilityEmptyEventSources();

  // Assert empty event types should be visible for ccmc but not for not hek
  await ccmc.assertEventTypeNodeNotVisible("EMPTY EVENT TYPE CCMC");
  await hek.assertEventTypeNodeVisible("EMPTY EVENT TYPE HEK");
});

/**
 * This test mocks some random events including some empty event-types
 * then validates they are visible eventhough they are not checked
 * then toggle empty resource visibility,
 * then validates they those empty event-type nodes are not visible anymore
 */
test("Toggle event source visibility should be preserved with state.", async ({ page, browser }, info) => {
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
      },
      "EMPTY EVENT TYPE HEK": {}
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
      },
      "EMPTY EVENT TYPE CCMC": {}
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

  // Action 3:  toggle to hide empty event-types for CCMC this time
  await ccmc.toggleVisibilityEmptyEventSources();

  // Assert empty event types should be visible for ccmc but not for not hek
  await ccmc.assertEventTypeNodeNotVisible("EMPTY EVENT TYPE CCMC");
  await hek.assertEventTypeNodeVisible("EMPTY EVENT TYPE HEK");

  await hv.Load();
  await hv.CloseAllNotifications();

  // Parse event tree pieces
  const hekReload = hv.parseTree("HEK");
  const ccmcReload = hv.parseTree("CCMC");

  await ccmcReload.assertEventTypeNodeNotVisible("EMPTY EVENT TYPE CCMC");
  await hekReload.assertEventTypeNodeVisible("EMPTY EVENT TYPE HEK");
});
