import { test } from "@playwright/test";
import { mockEvents } from "../../../utils/events";
import { MobileView, DesktopView, HelioviewerFactory, MobileInterface } from "page_objects/helioviewer_interface";

[MobileView, DesktopView].forEach((view) => {
  /**
   * This test mocks some random events for CCMC
   * then selects some specific event instances,
   * then asserts all event markers for matching event instances, should be visible
   * also asserts all of the other nodes, should be unchecked
   */
  test(
    `[${view.name}] Event instances should control visibility of event markers`,
    { tag: view.tag },
    async ({ page, browser }, info) => {
      // mocked event data
      const events = {
        CCMC: {
          aet1: {
            aet1frm1: {
              aet1frm1ei1: {},
              aet1frm1ei2: {}
            }
          },
          bet2: {
            bet2frm1: {
              bet2frm1ei1: {},
              bet2frm1ei2: {},
              bet2frm1ei3: {}
            },
            bet2frm2: {
              bet2frm2ei1: {},
              bet2frm2ei2: {}
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

      // Action 3 : Open up all frm branches
      await ccmc.toggleBranchFRM("aet1", "aet1frm1");
      await ccmc.toggleBranchFRM("bet2", "bet2frm1");
      await ccmc.toggleBranchFRM("bet2", "bet2frm2");

      // Action 4: Select some of the event instances
      await ccmc.toggleCheckEventInstance("aet1", "aet1frm1", "aet1frm1ei2");
      await ccmc.toggleCheckEventInstance("bet2", "bet2frm1", "bet2frm1ei3");
      await ccmc.toggleCheckEventInstance("bet2", "bet2frm2", "bet2frm2ei1");

      // Action 5: Assert all event markers belong to matching event instances should be visible,
      await ccmc.assertEventVisible("aet1frm1ei2");
      await ccmc.assertEventVisible("bet2frm1ei3");
      await ccmc.assertEventVisible("bet2frm2ei1");

      // Action 6: Assert all event markers DOES NOT belong to matching event instances should NOT be visible,
      await ccmc.assertEventNotVisible("aet1frm1ei1");
      await ccmc.assertEventNotVisible("bet2frm1ei1");
      await ccmc.assertEventNotVisible("bet2frm1ei2");
      await ccmc.assertEventNotVisible("bet2frm2ei2");

      // Action 7: Select again same event instances to not to select them
      await ccmc.toggleCheckEventInstance("aet1", "aet1frm1", "aet1frm1ei2");
      await ccmc.toggleCheckEventInstance("bet2", "bet2frm1", "bet2frm1ei3");
      await ccmc.toggleCheckEventInstance("bet2", "bet2frm2", "bet2frm2ei1");

      // Action 8: Now matching markers should NOT be visible
      await ccmc.assertEventNotVisible("aet1frm1ei2");
      await ccmc.assertEventNotVisible("bet2frm1ei3");
      await ccmc.assertEventNotVisible("bet2frm2ei1");
    }
  );
});
