import { test } from "@playwright/test";
import { mockEvents } from "../../../utils/events";
import { MobileView, DesktopView, HelioviewerFactory, MobileInterface } from "page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  /**
   * This test mocks some random events for CCMC
   * then selects some specific frm,
   * then asserts all of the childnodes of frm , should be checked,
   * also asserts all of the other nodes, should be unchecked
   */
  test(
    `[${view.name}] Checked frm should check all of its child event_instances`,
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

      // Action 3 : Check frm et2frm1
      await ccmc.toggleCheckFRM("et2", "et2frm1");

      // Action 4: Assert all event markers belongs to FRM = et2frm1 to be visible,
      await ccmc.assertEventVisible("et2frm1ei1");
      await ccmc.assertEventVisible("et2frm1ei2");
      await ccmc.assertEventVisible("et2frm1ei3");

      // Action 5: Assert all event markers of not selected frms should not be visible,
      await ccmc.assertEventNotVisible("et1frm1ei1");
      await ccmc.assertEventNotVisible("et1frm1ei2");
      await ccmc.assertEventNotVisible("et2frm2ei1");
      await ccmc.assertEventNotVisible("et2frm2ei2");

      // Action 5: Open up all frm branches
      await ccmc.toggleBranchFRM("et1", "et1frm1");
      await ccmc.toggleBranchFRM("et2", "et2frm1");
      await ccmc.toggleBranchFRM("et2", "et2frm2");

      // Action 6: Assert all nodes for branch et2
      await ccmc.assertEventTypeNodeHalfChecked("et2");
      await ccmc.assertFrmNodeChecked("et2", "et2frm1");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm1", "et2frm1ei1");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm1", "et2frm1ei2");
      await ccmc.assertEventInstanceNodeChecked("et2", "et2frm1", "et2frm1ei3");
      await ccmc.assertFrmNodeUnchecked("et2", "et2frm2");
      await ccmc.assertEventInstanceNodeUnchecked("et2", "et2frm2", "et2frm2ei1");
      await ccmc.assertEventInstanceNodeUnchecked("et2", "et2frm2", "et2frm2ei2");

      // Action 7: Assert all nodes for branch et1
      await ccmc.assertEventTypeNodeUnchecked("et1");
      await ccmc.assertFrmNodeUnchecked("et1", "et1frm1");
      await ccmc.assertEventInstanceNodeUnchecked("et1", "et1frm1", "et1frm1ei1");
      await ccmc.assertEventInstanceNodeUnchecked("et1", "et1frm1", "et1frm1ei2");

      // Action 8: Toggle again to uncheck all child nodes of selected frm
      await ccmc.toggleCheckFRM("et2", "et2frm1");

      // Action 9: Assert et2 branch state should be reset now
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
   * then selects some specific frms
   * then reloads the page and validates all selected frms should still be checked,
   */
  test(
    `[${view.name}] Selected FRMs should still be selected after page reload`,
    { tag: view.tag },
    async ({ page, browser }, info) => {
      // mocked event data
      const events = {
        CCMC: {
          et1: {
            et1frm1: {
              et1frm1ei1: {},
              et1frm1ei2: {}
            },
            et1frm2: {
              et1frm2ei1: {},
              et1frm2ei2: {}
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

      // Action 3 : Check some event_types
      await ccmc.toggleCheckFRM("et1", "et1frm2");
      await ccmc.toggleCheckFRM("et2", "et2frm1");
      await ccmc.toggleCheckFRM("et2", "et2frm2");

      // Action 4 : Refresh page
      await hv.Load();
      await hv.CloseAllNotifications();

      // For mobile we need to re-open the events drawer
      if (view == MobileView) hv.OpenEventsDrawer();

      // Action 5: Assert all et1 branch
      await ccmc.assertEventTypeNodeHalfChecked("et1");
      await ccmc.assertFrmNodeUnchecked("et1", "et1frm1");
      await ccmc.assertFrmNodeChecked("et1", "et1frm2");

      // Action 6: Assert all et2 branch
      await ccmc.assertEventTypeNodeChecked("et2");
      await ccmc.assertFrmNodeChecked("et2", "et2frm1");
      await ccmc.assertFrmNodeChecked("et2", "et2frm2");
    }
  );
});
