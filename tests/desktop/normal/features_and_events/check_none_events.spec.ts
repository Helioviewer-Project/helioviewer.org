import { test } from "@playwright/test";
import { mockEvents } from "../../../utils/events";
import { MobileView, DesktopView, HelioviewerFactory, MobileInterface } from "page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  /**
   * This test mocks CCMC events, then checks some frm and eventtype, then unchecks all
   * test validates all checkboxes are unchecked and their markers are not visible
   */
  test(
    `[${view.name} UncheckAll should uncheck all event markers that are previously selected also their markers should be hidden`,
    { tag: [view.tag] },
    async ({ page }, info) => {
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
      let hv = HelioviewerFactory.Create(view, page, info) as MobileInterface;

      // Action 1 : BROWSE TO HELIOVIEWER
      await hv.Load();
      await hv.CloseAllNotifications();

      // Action 2 : Open left sources panel
      await hv.OpenEventsDrawer();

      // Assert parse CCMC tree
      const ccmcTree = hv.parseTree("CCMC");

      // Action 3 : Check DONKI
      await ccmcTree.toggleCheckEventType("DONKI");

      // Action 4 : Check AMOS
      await ccmcTree.toggleCheckFRM("Solar Flare Predictions", "AMOS");

      // Action 5 : Check M: 77.15%
      await ccmcTree.toggleBranchFRM("Solar Flare Predictions", "MAG4 Sharp FE");
      await ccmcTree.toggleCheckEventInstance("Solar Flare Predictions", "MAG4 Sharp FE", "M: 77.15%");

      // Assert all checkboxes need to be checked or not
      await ccmcTree.assertFrmNodeChecked("DONKI", "CME");
      await ccmcTree.assertFrmNodeChecked("Solar Flare Predictions", "AMOS");
      await ccmcTree.assertEventInstanceNodeChecked("DONKI", "CME", "Type:C 11");
      await ccmcTree.assertEventInstanceNodeChecked("DONKI", "CME", "Type:C 12");
      await ccmcTree.assertEventInstanceNodeChecked("Solar Flare Predictions", "AMOS", "C+ 34.05%");
      await ccmcTree.assertEventInstanceNodeChecked("Solar Flare Predictions", "AMOS", "C+ 77.15%");
      await ccmcTree.assertEventInstanceNodeChecked("Solar Flare Predictions", "MAG4 Sharp FE", "M: 77.15%");
      await ccmcTree.assertEventInstanceNodeUnchecked("Solar Flare Predictions", "MAG4 Sharp FE", "M: 34.05%");

      // Assert all checked markers need to be visible or not
      await ccmcTree.assertEventVisible("Type:C 11");
      await ccmcTree.assertEventVisible("Type:C 12");
      await ccmcTree.assertEventVisible("C+ 34.05%");
      await ccmcTree.assertEventVisible("C+ 77.15%");
      await ccmcTree.assertEventVisible("M: 77.15%");
      await ccmcTree.assertEventNotVisible("M: 34.05%");

      // Action 6 : Trigger check none
      await ccmcTree.checkNone();

      // Assert now all markers before checked now not checked
      await ccmcTree.assertFrmNodeUnchecked("DONKI", "CME");
      await ccmcTree.assertFrmNodeUnchecked("Solar Flare Predictions", "AMOS");
      await ccmcTree.assertEventInstanceNodeUnchecked("DONKI", "CME", "Type:C 11");
      await ccmcTree.assertEventInstanceNodeUnchecked("DONKI", "CME", "Type:C 12");
      await ccmcTree.assertEventInstanceNodeUnchecked("Solar Flare Predictions", "AMOS", "C+ 34.05%");
      await ccmcTree.assertEventInstanceNodeUnchecked("Solar Flare Predictions", "AMOS", "C+ 77.15%");
      await ccmcTree.assertEventInstanceNodeUnchecked("Solar Flare Predictions", "MAG4 Sharp FE", "M: 77.15%");
      await ccmcTree.assertEventInstanceNodeUnchecked("Solar Flare Predictions", "MAG4 Sharp FE", "M: 34.05%");

      // Assert all markers should be hidden
      await ccmcTree.assertEventNotVisible("Type:C 11");
      await ccmcTree.assertEventNotVisible("Type:C 12");
      await ccmcTree.assertEventNotVisible("C+ 34.05%");
      await ccmcTree.assertEventNotVisible("C+ 77.15%");
      await ccmcTree.assertEventNotVisible("M: 77.15%");
      await ccmcTree.assertEventNotVisible("M: 34.05%");
    }
  );
});
