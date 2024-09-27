import { expect, test } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";

/**
 * This test downloads jp2 image for the SOHO layer
 * and validates downloaded file has correct filename and correct content with image/jp2
 */
test("Image Layer | Download image button for layer should download jpeg2000 image with correct name", async ({
  page
}, info) => {
  // Trying to avoid inclusion issue
  // SEE: https://github.com/ipfs/js-ipfs/issues/4138
  const { fileTypeFromStream } = await import("file-type");

  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();
  await hv.OpenSidebar();

  // 2. LAYER 0 , SWITH TO SOHO
  const layer = await hv.getImageLayer(0);
  await layer.set("Observatory:", "SOHO");
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 3. GO NEWEST IMAGE
  await hv.UseNewestImage();
  await hv.WaitForLoadingComplete();
  await hv.CloseAllNotifications();

  // 4. DOWNLOAD JP2 IMAGE
  const jp2Image = await layer.downloadJp2();

  // 5. ASSERT DOWNLOAD FILENAME
  expect(jp2Image.suggestedFilename()).toMatch(
    /\d{4}_\d{2}_\d{2}__\d{2}_\d{2}_\d{2}_442__SOHO_LASCO_C2_white-light.jp2/
  );

  const mimeInfo = await fileTypeFromStream(await jp2Image.createReadStream());

  // 6. ASSERT MIMETYPE OF FILE AS JPEG2000
  expect(mimeInfo.mime).toBe("image/jp2");
});
