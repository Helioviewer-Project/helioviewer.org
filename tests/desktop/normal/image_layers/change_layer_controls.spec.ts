import { expect, test } from '@playwright/test';
import { Helioviewer } from '../../../page_objects/helioviewer';

/**
 * This test tries to validate switching observatory for image layers.
 * It first loads SDO layer initially takes a screenshot of the SUN
 * then try to load SOHO waits then loads SDO again  ,
 * compare latest sdo screenshot and initial screenshot.
 */
test('Image Layer Controls | play with observatory', async ({page}, info) => {

    let hv = new Helioviewer(page, info);

    // 1. LOAD HV 
    await hv.Load();
    await hv.CloseAllNotifications();
    await hv.OpenSidebar();

    // 2. TAKE SUNSCREENSOT
    const initialScreenshotSDO = await hv.sunScreenshot("initial_sdo");

    // 3. CHANGE LAYER 0 , SWITCH TO SOHO
    const layer = await hv.getImageLayer(0);
    await layer.set('Observatory:', 'SOHO');
    await hv.WaitForLoadingComplete();
    await hv.CloseAllNotifications();

    // 4. GO BACK TO SDO AGAIN
    await layer.set('Observatory:', 'SDO');

    // TODO : Fix possible problem of Measurement selection
    await layer.set('Measurement:', '304');

    await hv.WaitForLoadingComplete();
    await hv.CloseAllNotifications();

    const revisitScreenshotSDO = await hv.sunScreenshot("revisit_sdo");

    // SCRENSHOTS SHOULD MATCH
    expect(revisitScreenshotSDO).toBe(initialScreenshotSDO);

});
