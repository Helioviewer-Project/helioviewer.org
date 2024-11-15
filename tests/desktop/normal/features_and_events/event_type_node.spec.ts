import { test } from "@playwright/test";
import { mockEvents } from "../../../utils/events";
import { MobileView, DesktopView, HelioviewerFactory, MobileInterface } from "page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  /**
   * This test mocks some random events for CCMC
   * then selects some specific event_type,
   * then asserts all of the childnodes of event_tree , should be checked,
   * also asserts all of the other nodes, should be unchecked
   */
  test(
    `[${view.name}] Checked event type should check all of its child frms and event_instances`,
    { tag: view.tag },
    async ({ page, browser }, info) => {
      // mocked event data
      const events = {
        CCMC: {
          et1: {
            et1frm1: {
              et1frm1ei1: {},
              et1frm1ei2: {}
            }
          },
          et2: {
            et2frm1: {
              et2frm1ei1: {},
              et2frm1ei2: {},
              et2frm1ei3: {}
            },
            et2frm2: {
              et2frm2ei1: {},
              et2frm2ei2: {}
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

      // Parse event tree pieces
      const ccmc = hv.parseTree("CCMC");

      // Action 3 : Check et2
      await ccmc.toggleCheckEventType("et2");

      // Action 4: Assert all event markers of et2 to be visible,
      // also et1 not to be visible
      await ccmc.assertEventVisible("et2frm1ei1");
      await ccmc.assertEventVisible("et2frm1ei2");
      await ccmc.assertEventVisible("et2frm1ei3");
      await ccmc.assertEventVisible("et2frm2ei1");
      await ccmc.assertEventVisible("et2frm2ei2");
      // this one shouldn't be visible at all , since they are et1
      await ccmc.assertEventNotVisible("et1frm1ei1");
      await ccmc.assertEventNotVisible("et1frm1ei2");

      // Action 5: Open up all frm branches
      await ccmc.toggleBranchFRM("et1", "et1frm1");
      await ccmc.toggleBranchFRM("et2", "et2frm1");
      await ccmc.toggleBranchFRM("et2", "et2frm2");

      // Action 6: Assert which frm and eventtype nodes are checked
      await ccmc.assertEventTypeNodeChecked("et2");
      await ccmc.assertFrmNodeChecked("et2", "et2frm1");
      await ccmc.assertFrmNodeChecked("et2", "et2frm2");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm1", "et2frm1ei1");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm1", "et2frm1ei2");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm1", "et2frm1ei3");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm2", "et2frm2ei1");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm2", "et2frm2ei2");

      // Action 7: Assert which frm and eventtype nodes are unchecked
      await ccmc.assertEventTypeNodeUnchecked("et1");
      await ccmc.assertFrmNodeUnchecked("et1", "et1frm1");
      await ccmc.assertEventInstanceNodeUnchecked("et1", "et1frm1", "et1frm1ei1");
      await ccmc.assertEventInstanceNodeUnchecked("et1", "et1frm1", "et1frm1ei2");

      // Action 8 : Toggle again to uncheck all child nodes
      await ccmc.toggleCheckEventType("et2");

      // Action 9: Assert et2 nodes are unchecked
      await ccmc.assertEventTypeNodeUnchecked("et2");
      await ccmc.assertFrmNodeUnchecked("et2", "et2frm1");
      await ccmc.assertFrmNodeUnchecked("et2", "et2frm2");
      await ccmc.assertEventInstanceNodeUnchecked("et2", "et2frm1", "et2frm1ei1");
      await ccmc.assertEventInstanceNodeUnchecked("et2", "et2frm1", "et2frm1ei2");
      await ccmc.assertEventInstanceNodeUnchecked("et2", "et2frm1", "et2frm1ei3");
      await ccmc.assertEventInstanceNodeUnchecked("et2", "et2frm2", "et2frm2ei1");
      await ccmc.assertEventInstanceNodeUnchecked("et2", "et2frm2", "et2frm2ei2");
    }
  );

  /**
   * This test mocks some random events for CCMC
   * then selects some specific event_type,
   * then reloads the page and validates event_types should still be checked,
   */
  test(
    `[${view.name}] Selected event_types should still be selected after page reload`,
    { tag: view.tag },
    async ({ page, browser }, info) => {
      // mocked event data
      const events = {
        CCMC: {
          et0: {
            et0frm1: {
              et0frm1ei1: {},
              et0frm1ei2: {}
            }
          },
          et1: {
            et1frm1: {
              et1frm1ei1: {},
              et1frm1ei2: {}
            }
          },
          et2: {
            et2frm1: {
              et2frm1ei1: {},
              et2frm1ei2: {},
              et2frm1ei3: {}
            },
            et2frm2: {
              et2frm2ei1: {},
              et2frm2ei2: {}
            }
          },
          et3: {
            et3frm1: {
              et3frm1ei1: {},
              et3frm1ei2: {}
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

      // Parse event tree pieces
      const ccmc = hv.parseTree("CCMC");

      // Action 3 : Check some event_types
      await ccmc.toggleCheckEventType("et0");
      await ccmc.toggleCheckEventType("et2");

      // Action 4 : Refresh page
      await hv.Load();
      await hv.CloseAllNotifications();
      // On mobile we need to re-open the drawer to check for checked events.
      if (view == MobileView) {
        hv.OpenEventsDrawer();
      }

      // Action 5: Assert all event_type nodes should still be same after refresh
      await ccmc.assertEventTypeNodeChecked("et0");
      await ccmc.assertEventTypeNodeUnchecked("et1");
      await ccmc.assertEventTypeNodeChecked("et2");
      await ccmc.assertEventTypeNodeUnchecked("et3");
    }
  );
});
