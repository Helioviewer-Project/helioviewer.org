import { expect, test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test triggers viewing of image headers dialog box
 * Also asserts all headers for different tabs in dialog box
 * also tests headers sorting functionality
 */
test("Image headers dialog box should show layer image headers, also it should show different headers with tab controls with sorting functionality", async ({
  page
}, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // Layer to check controls
  const layer = await hv.getImageLayer(0);

  // 2. TRIGGER SEEING IMAGE HEADER
  await layer.showImageHeader();

  const imageHeaderDialog = await layer.getImageHeaderDialog();

  // 3. VALIDATE THE DIALOG BOX IS VISIBLE
  await imageHeaderDialog.assertVisible();

  // 4. ASSERT THE TITLE
  await imageHeaderDialog.assertTitle("Image Information: AIA 304");

  // 5. ASSERT TABS
  await imageHeaderDialog.assertTabs(["FITS", "Helioviewer"], "FITS");

  // 6 ASSERT VISIBLE HEADERS
  await imageHeaderDialog.assertImageHeaders([
    ["SIMPLE", "1"],
    ["BITPIX", "16"],
    ["NAXIS", "2"],
    ["NAXIS1", "4096"],
    ["NAXIS2", "4096"],
    ["EXTEND", "1"]
  ]);

  // 7 SORT HEADERS
  await imageHeaderDialog.toggleSortHeaders();

  // 8 ASSERT SORTED HEADERS
  await imageHeaderDialog.assertImageHeaders([
    ["ACS_CGT", "GT3"],
    ["ACS_ECLP", "NO"],
    ["ACS_MODE", "SCIENCE"],
    ["ACS_SAFE", "NO"],
    ["ACS_SUNP", "YES"],
    ["AECDELAY", "1537"],
    ["AECMODE", "ON"]
  ]);

  // 9 RESET SORTED HEADERS
  await imageHeaderDialog.toggleSortHeaders();

  // 9 SWITCH TAB TO HELIOVIEWER
  await imageHeaderDialog.switchTab("Helioviewer");

  // 10 ASSERT TAB TITLES ALSO SELECTED ONE
  await imageHeaderDialog.assertTabs(["FITS", "Helioviewer"], "Helioviewer");

  // 11 ASSERT HEADERS WITH THEIR ORDER
  await imageHeaderDialog.assertImageHeaders([
    ["HV_ROTATION", "0.00000"],
    ["HV_JP2GEN_VERSION", "0.8"],
    [
      "HV_JP2GEN_BRANCH_REVISION",
      "No valid revision number found. Bazaar not installed? Using HV_WRITTENBY manually included revision number: 84 [2011/01/10, https://launchpad.net/jp2gen] : % SPAWN: Error managing child process.: No such file or directory"
    ],
    ["HV_HVS_DETAILS_FILENAME", "hvs_version5.pro"],
    ["HV_HVS_DETAILS_FILENAME_VERSION", "5.0"],
    [
      "HV_COMMENT",
      "JP2 file created locally at Lockheed LMSAL using hv_aia_list2jp2_gs2 at Wed Jan  1 14:36:54 2025. Contact Helioviewer LMSAL Franchise (slater@lmsal.com) for more details/questions/comments regarding this JP2 file. HVS (Helioviewer setup) file used to create this JP2 file: hvs_version5.pro (version 5.0). FITS to JP2 source code provided by ESA/NASA Helioviewer Project [contact the Helioviewer Project at webmaster@helioviewer.org][NASA-GSFC] and is available for download at https://launchpad.net/jp2gen. Please contact the source code providers if you suspect an error in the source code. Full source code for the entire Helioviewer Project can be found at https://launchpad.net/helioviewer."
    ]
  ]);

  // 12 SORT AGAIN FOR HELIOVIEWER HEADERS
  await imageHeaderDialog.toggleSortHeaders();

  // 13 ASSERT SORTED HELIOVIEWER HEADERS
  await imageHeaderDialog.assertImageHeaders([
    [
      "HV_COMMENT",
      "JP2 file created locally at Lockheed LMSAL using hv_aia_list2jp2_gs2 at Wed Jan  1 14:36:54 2025. Contact Helioviewer LMSAL Franchise (slater@lmsal.com) for more details/questions/comments regarding this JP2 file. HVS (Helioviewer setup) file used to create this JP2 file: hvs_version5.pro (version 5.0). FITS to JP2 source code provided by ESA/NASA Helioviewer Project [contact the Helioviewer Project at webmaster@helioviewer.org][NASA-GSFC] and is available for download at https://launchpad.net/jp2gen. Please contact the source code providers if you suspect an error in the source code. Full source code for the entire Helioviewer Project can be found at https://launchpad.net/helioviewer."
    ],
    ["HV_HVS_DETAILS_FILENAME", "hvs_version5.pro"],
    ["HV_HVS_DETAILS_FILENAME_VERSION", "5.0"]
  ]);
});
