import { expect, test } from "@playwright/test";
import { HvMobile } from "../../page_objects/mobile_hv";

/**
 * The bug here was every time you re-open the shared youtube videos popup,
 * the text "No shared movies found" was appended to the DOM each time.
 * It should only appear once.
 *
 * Test steps:
 *   1. Open the youtube dialog
 *   2. Expect that the text appears once
 *   3. Close and re-open the youtube dialog
 *   4. Expect that the text still appears once
 */
test('[Mobile] "No shared movies found" should not be duplicated', async ({ page }) => {
  let mobile = new HvMobile(page);
  await mobile.Load();
  await mobile.OpenYoutubeVideosDialog();
  await mobile.AssertNoSharedYoutubeVideos();
  await mobile.CloseYoutubeVideosDialog();

  await mobile.OpenYoutubeVideosDialog();
  await mobile.AssertNoSharedYoutubeVideos();
  await mobile.CloseYoutubeVideosDialog();
});

/**
 * During testing, we saw that many youtube videos were overlapping each other.
 * Test Steps:
 *  0. Mock API requests so that content is rendered in the UI.
 *  1. Open the shared videos UI.
 *  2. Perform screenshot test. Screenshotting is used here since this is a visual issue.
 */
test("[Mobile] Youtube videos should be rendered correctly", async ({ page }) => {
  // 0. Mock API requests
  await page.route("*/**/?action=getUserVideos*", async (route) => {
    await route.fulfill({ json: YOUTUBE_VIDEO_JSON });
  });
  await page.route("*/**/?action=getObservationDateVideos*", async (route) => {
    await route.fulfill({ json: OBSERVATION_DATE_VIDEOS_JSON });
  });
  let mobile = new HvMobile(page);
  await mobile.Load();
  // 1. Open shared videos UI
  await mobile.OpenYoutubeVideosDialog();
  // Wait for youtube thumbnails to load.
  await page.waitForLoadState("networkidle");
  // 2. Compare screenshot
  await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.01 });
});

const OBSERVATION_DATE_VIDEOS_JSON = [
  {
    id: "KflW5",
    url: "http://www.youtube.com/watch?v=RupZ4NW0X_I",
    thumbnails: {
      small: "https://i.ytimg.com/vi/RupZ4NW0X_I/default.jpg",
      medium: "https://i.ytimg.com/vi/RupZ4NW0X_I/hqdefault.jpg"
    },
    published: "2024-08-18 05:32:54",
    title: "LASCO C3 (2024-08-14 13:54:08 - 2024-08-18 01:54:07 UTC)",
    description:
      "This movie was produced by Helioviewer.org. See the original at https://api.helioviewer.org/?action=playMovie&id=KflW5&format=mp4&hq=true or download a high-quality version from https://api.helioviewer.org/?action=downloadMovie&id=KflW5&format=mp4&hq=true",
    keywords: "SOHO,LASCO,C3,white-light",
    imageScale: 15.5199,
    dataSourceString: "[SOHO,LASCO,C3,white-light,3,100,0,60,0,2024-06-05T04:03:50.000Z]",
    eventSourceString: "",
    movieLength: "14.2857",
    width: 1582,
    height: 732,
    startDate: "2024-08-14 13:54:08",
    endDate: "2024-08-18 01:54:07",
    roi: {
      top: 783,
      left: -1554,
      bottom: 1514,
      right: 27,
      imageScale: 15.5199,
      width: 1581,
      height: 731
    }
  }
];

const YOUTUBE_VIDEO_JSON = [
  {
    id: "TvlW5",
    url: "http://www.youtube.com/watch?v=wvMXYeot2uk",
    thumbnails: {
      icon: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      small: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      medium: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      large: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      full: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png"
    },
    published: "2024-08-19 15:35:15",
    title: "LASCO C2/C3 (2024-08-17 11:00:07 - 2024-08-19 10:36:07 UTC)",
    description:
      "This movie was produced by Helioviewer.org. See the original at https://api.helioviewer.org/?action=playMovie&id=TvlW5&format=mp4&hq=true or download a high-quality version from https://api.helioviewer.org/?action=downloadMovie&id=TvlW5&format=mp4&hq=true",
    keywords: "SOHO,LASCO,C2,white-light,C3",
    imageScale: "77.4541",
    dataSourceString:
      "[SOHO,LASCO,C2,white-light,2,100,0,60,1,2024-08-18T09:54:09.000Z],[SOHO,LASCO,C3,white-light,3,100,0,60,1,2024-08-19T13:06:09.000Z]",
    eventSourceString: "",
    movieLength: "10",
    width: "1920",
    height: "1080",
    startDate: "2024-08-17 11:00:07",
    endDate: "2024-08-19 10:36:07"
  },
  {
    id: "qvlW5",
    url: "http://www.youtube.com/watch?v=Je_DraAKq34",
    thumbnails: {
      icon: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      small: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      medium: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      large: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      full: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png"
    },
    published: "2024-08-19 15:20:32",
    title: "AIA 304 (2024-08-18 22:09:41 - 2024-08-19 01:09:29 UTC)",
    description:
      "This movie was produced by Helioviewer.org. See the original at https://api.helioviewer.org/?action=playMovie&id=qvlW5&format=mp4&hq=true or download a high-quality version from https://api.helioviewer.org/?action=downloadMovie&id=qvlW5&format=mp4&hq=true",
    keywords: "SDO,AIA,304,1",
    imageScale: "0.60511",
    dataSourceString: "[SDO,AIA,304,1,100,0,60,1,2024-08-08T12:46:22.000Z]",
    eventSourceString: "",
    movieLength: "30",
    width: "1440",
    height: "900",
    startDate: "2024-08-18 22:09:41",
    endDate: "2024-08-19 01:09:29"
  },
  {
    id: "FvlW5",
    url: "http://www.youtube.com/watch?v=W5AC7bFEcVM",
    thumbnails: {
      icon: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      small: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      medium: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      large: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
      full: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png"
    },
    published: "2024-08-19 15:18:47",
    title: "AIA 304 (2024-08-18 23:37:05 - 2024-08-19 05:35:53 UTC)",
    description:
      "This movie was produced by Helioviewer.org. See the original at https://api.helioviewer.org/?action=playMovie&id=FvlW5&format=mp4&hq=true or download a high-quality version from https://api.helioviewer.org/?action=downloadMovie&id=FvlW5&format=mp4&hq=true",
    keywords: "SDO,AIA,304,1",
    imageScale: "0.60511",
    dataSourceString: "[SDO,AIA,304,1,100,0,60,1,2024-08-08T12:46:22.000Z]",
    eventSourceString: "",
    movieLength: "30",
    width: "1440",
    height: "900",
    startDate: "2024-08-18 23:37:05",
    endDate: "2024-08-19 05:35:53"
  }
];
