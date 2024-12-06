import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import { getRandomInt } from "../../../utils/utils";

/**
 * Test Steps for checking recently shared videos are rendered correctly
 * 1 ) Mock some data for recently shared youtube videos:
 * 2 ) Open youtube drawer
 * 3 ) Assert all videos mocked before are visible in viewport with correct links and titles
 */
test("Recently shared youtube videos should be rendered correctly with correct link and title", async ({
  page
}, info) => {
  let hv = new Helioviewer(page, info);

  const mockedMovies = [];
  const mockedMoviesData = [];
  const moviesLength = getRandomInt(1, 40);

  // Prepare some mock data for the recently shared youtube videos
  for (let i = 0; i < moviesLength; i++) {
    const hoursAgo = getRandomInt(1, 100);

    const id = Math.random().toString(36).substring(2, 7); // Generate random id
    const startDate = new Date(Date.now() - hoursAgo * 3600000).toISOString(); // n hours ago for startdate
    const publishedDate = startDate; // same as startdate
    const endDate = new Date().toISOString(); // now

    mockedMovies.push({
      id: id,
      url: `http://foo.com/watch?v=${id}`,
      thumbnails: {
        icon: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        small: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        medium: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        large: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        full: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png"
      },
      published: publishedDate,
      title: `AIA 131 (${startDate} - ${endDate} UTC)`,
      description: `This movie was mocked by playwright tests`,
      keywords: "SDO,AIA,131,1",
      imageScale: "0.915297",
      dataSourceString: `[SDO,AIA,131,1,86,0,60,1,2024-01-10T18:46:22.000Z]`,
      eventSourceString: "",
      movieLength: (Math.random() * 10).toFixed(5),
      width: "1552",
      height: "760",
      startDate: startDate,
      endDate: endDate
    });

    // Remember what we have mocked so we can assert them later
    mockedMoviesData.push({
      id: id,
      hoursAgo: hoursAgo
    });
  }

  // 0. Mock API requests
  await page.route("*/**/?action=getUserVideos*", async (route) => {
    await route.fulfill({ json: mockedMovies });
  });

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();

  // 2. CLICK YOUTUBE BUTTON TO SHOW YOUTUBE VIDOS
  await hv.toggleYoutubeVideosDrawer();
  await hv.WaitForLoadingComplete();

  // Assert youtube drawer is open and correct number of videos visible in drawer
  await hv.youtubeDrawer.assertDrawerOpen();
  await hv.youtubeDrawer.assertYoutubeSharedVideoCount(mockedMoviesData.length);

  // Assert all mocked videos are visibile with correct links and title
  for (const mov of mockedMoviesData) {
    let title = `${mov.hoursAgo} hours ago`;

    if (mov.hoursAgo == 1) {
      title = "1 hour ago";
    }

    let daysAgo = Math.floor(mov.hoursAgo / 24);

    if (mov.hoursAgo >= 24) {
      title = `${daysAgo} day ago`;
    }

    if (mov.hoursAgo >= 48) {
      title = `${daysAgo} days ago`;
    }

    await hv.youtubeDrawer.assertYoutubeSharedVideoVisibleWithTitle(mov.id, title);
    await hv.youtubeDrawer.assertYoutubeSharedVideoGoesToLink(mov.id, `http://foo.com/watch?v=${mov.id}`);
  }
});

/**
 * Test Steps for checking visibility of a friendly message when there is no recently shared videos.
 * 1 ) Mock empty data response for recently shared youtube videos:
 * 2 ) Open youtube drawer
 * 3 ) Assert all no videos should be visible
 * 4 ) Assert the visibility of friendly no video message
 */
test("If there is no youtube movies then there should be a friendly message", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 0. Mock API requests for no videos
  await page.route("*/**/?action=getUserVideos*", async (route) => {
    await route.fulfill({ json: [] });
  });

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();

  // 2. CLICK NEWS BUTTON TO SHOW YOUTUBE VIDOS
  await hv.toggleYoutubeVideosDrawer();
  await hv.WaitForLoadingComplete();

  // 3) Assert no videos in the drawer
  await hv.youtubeDrawer.assertYoutubeSharedVideoCount(0);

  // 4) Assert no video message is visible
  await hv.youtubeDrawer.assertNoYoutubeSharedVideoMessage();
});

/**
 * Test Steps for checking observation date shared videos are rendered correctly
 * 1 ) Mock some data for observation date shared youtube videos:
 * 2 ) Open youtube drawer
 * 3 ) Toggle visibility for observation date shared videos accordion inside drawer
 * 4 ) Assert all videos mocked before are visible in viewport with correct links and titles
 */
test("Youtube movies around observation date should be rendered correctly", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  const mockedMovies = [];
  const mockedMoviesData = [];
  const moviesLength = getRandomInt(1, 40);

  // Prepare some mock data for the recently shared youtube videos
  for (let i = 0; i < moviesLength; i++) {
    const hoursAgo = getRandomInt(1, 100);

    const id = Math.random().toString(36).substring(2, 7); // Generate random id
    const startDate = new Date(Date.now() - hoursAgo * 3600000).toISOString(); // n hours ago
    const publishedDate = startDate; // n hours ago
    const endDate = new Date().toISOString(); // now

    mockedMovies.push({
      id: id,
      url: `http://anotherfoo.com/watch?v=${id}`,
      thumbnails: {
        icon: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        small: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        medium: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        large: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        full: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png"
      },
      published: publishedDate,
      title: `AIA 131 (${startDate} - ${endDate} UTC)`,
      description: `This movie was mocked by playwright tests`,
      keywords: "SDO,AIA,131,1",
      imageScale: "0.915297",
      dataSourceString: `[SDO,AIA,131,1,86,0,60,1,2024-01-10T18:46:22.000Z]`,
      eventSourceString: "",
      movieLength: (Math.random() * 10).toFixed(5),
      width: "1552",
      height: "760",
      startDate: startDate,
      endDate: endDate,
      roi: {
        top: Math.floor(Math.random() * (600 - 300 + 1)) + 300, // Random between 300 and 600
        left: Math.floor(Math.random() * (-700 - -1000 + 1)) + -1000, // Random between -1000 and -700
        bottom: Math.floor(Math.random() * (1400 - 1100 + 1)) + 1100, // Random between 1100 and 1400
        right: Math.floor(Math.random() * (700 - 500 + 1)) + 500, // Random between 500 and 700
        imageScale: parseFloat((Math.random() * (1.5 - 1.0) + 1.0).toFixed(5)), // Random between 1.0 and 1.5
        width: Math.floor(Math.random() * (1600 - 1400 + 1)) + 1400, // Random between 1400 and 1600
        height: Math.floor(Math.random() * (750 - 650 + 1)) + 650 // Random between 650 and 750
      }
    });

    // Remember what we have mocked so we can assert them later
    mockedMoviesData.push({
      id: id,
      startDate: startDate,
      endDate: endDate
    });
  }

  // 0. Mock API requests
  await page.route("*/**/?action=getObservationDateVideos*", async (route) => {
    await route.fulfill({ json: mockedMovies });
  });

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();

  // 2. CLICK YOUTUBE BUTTON TO SHOW YOUTUBE VIDOS
  await hv.toggleYoutubeVideosDrawer();

  // 3 TOGGLE VISIBILITY FOR OBSERVATION DATE SHARED VIDEOS ACCORDION INSIDE DRAWER
  await hv.youtubeDrawer.toggleObservationDateYoutubeSharedAccordion();
  await hv.WaitForLoadingComplete();

  // Assert correct number of videos visible in drawer
  await hv.youtubeDrawer.assertObservationDateYoutubeSharedVideoCount(mockedMoviesData.length);

  // Assert all mocked videos are visibile with correct links and title
  for (const mov of mockedMoviesData) {
    await hv.youtubeDrawer.assertObservationDateYoutubeSharedVideoVisibleWithTitle(
      mov.id,
      `AIA 131  (${mov.startDate} ${mov.endDate} UTC)`
    );
    await hv.youtubeDrawer.assertObservationDateYoutubeSharedVideoGoesToLink(
      mov.id,
      `http://anotherfoo.com/watch?v=${mov.id}`
    );
  }
});

/**
 * Test Steps for checking visibility of a friendly message when there is no observation date youtube shared videos.
 * 1 ) Mock empty data response for observation date shared youtube videos:
 * 2 ) Open youtube drawer
 * 3 ) Toggle visibility for observation date shared videos accordion inside drawer
 * 4 ) Assert all no videos should be visible
 * 5 ) Assert the visibility of friendly no video message
 */
test("If there is no youtube movies around observation date then there should be a friendly message", async ({
  page
}, info) => {
  let hv = new Helioviewer(page, info);

  // 0. Mock API requests
  await page.route("*/**/?action=getObservationDateVideos*", async (route) => {
    await route.fulfill({ json: [] });
  });

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();

  // 2. CLICK NEWS BUTTON TO SHOW YOUTUBE VIDEOS
  await hv.toggleYoutubeVideosDrawer();

  // 3.  Toggle visibility for observation date shared videos accordion inside drawer
  await hv.youtubeDrawer.toggleObservationDateYoutubeSharedAccordion();
  // 4.  Assert all no videos should be visible
  await hv.youtubeDrawer.assertObservationDateYoutubeSharedVideoCount(0);

  // 5.  Assert the visibility of friendly no video message
  await hv.youtubeDrawer.assertNoObservationDateYoutubeSharedVideoMessage();
});

/**
 * Test Steps for checking observation date shared video location markers visibility can be controlled from ui checkbox
 * 1 ) Mock some data for observation date shared youtube videos:
 * 2 ) Open youtube drawer
 * 3 ) Toggle visibility for observation date shared videos accordion inside drawer
 * 4 ) Check checkbox for showing location markers for videos
 * 5 ) Assert all markers are visible for the mocked videos
 * 4 ) Uncheck checkbox for showing location markers for videos
 * 5 ) Assert no markers are visible for the mocked videos
 */
test("Youtube movies around observation date should show markers if the 'show in viewport' checkbox is checked", async ({
  page
}, info) => {
  let hv = new Helioviewer(page, info);

  const mockedMovies = [];
  const mockedMoviesData = [];
  const moviesLength = getRandomInt(1, 40);

  // Mock some data for shared videos
  for (let i = 0; i < moviesLength; i++) {
    const hoursAgo = getRandomInt(1, 100);

    const id = Math.random().toString(36).substring(2, 7); // Generate random id
    const startDate = new Date(Date.now() - hoursAgo * 3600000).toISOString(); // n hours ago
    const publishedDate = startDate; // n hours ago
    const endDate = new Date().toISOString(); // now

    mockedMovies.push({
      id: id,
      url: `http://anotherfoo.com/watch?v=${id}`,
      thumbnails: {
        icon: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        small: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        medium: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        large: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png",
        full: "https://helioviewer.org/resources/images/viewyoutube_icon_transp.png"
      },
      published: publishedDate,
      title: `AIA ${id} (${startDate} - ${endDate} UTC)`,
      description: `This movie was mocked by playwright tests`,
      keywords: "SDO,AIA,131,1",
      imageScale: "0.915297",
      dataSourceString: `[SDO,AIA,131,1,86,0,60,1,2024-01-10T18:46:22.000Z]`,
      eventSourceString: "",
      movieLength: (Math.random() * 10).toFixed(5),
      width: "1552",
      height: "760",
      startDate: startDate,
      endDate: endDate,
      roi: {
        top: Math.floor(Math.random() * (600 - 300 + 1)) + 300, // Random between 300 and 600
        left: Math.floor(Math.random() * (-700 - -1000 + 1)) + -1000, // Random between -1000 and -700
        bottom: Math.floor(Math.random() * (1400 - 1100 + 1)) + 1100, // Random between 1100 and 1400
        right: Math.floor(Math.random() * (700 - 500 + 1)) + 500, // Random between 500 and 700
        imageScale: parseFloat((Math.random() * (1.5 - 1.0) + 1.0).toFixed(5)), // Random between 1.0 and 1.5
        width: Math.floor(Math.random() * (1600 - 1400 + 1)) + 1400, // Random between 1400 and 1600
        height: Math.floor(Math.random() * (750 - 650 + 1)) + 650 // Random between 650 and 750
      }
    });

    mockedMoviesData.push({
      id: id,
      startDate: startDate,
      endDate: endDate
    });
  }

  await page.route("*/**/?action=getObservationDateVideos*", async (route) => {
    await route.fulfill({ json: mockedMovies });
  });

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();

  // 2. CLICK YOUTUBE BUTTON TO SHOW YOUTUBE VIDOS
  await hv.toggleYoutubeVideosDrawer();
  await hv.WaitForLoadingComplete();

  // 3 TOGGLE VISIBILITY FOR OBSERVATION DATE SHARED VIDEOS ACCORDION INSIDE DRAWER
  await hv.youtubeDrawer.toggleObservationDateYoutubeSharedAccordion();
  await hv.WaitForLoadingComplete();

  // 4 Check checkbox for showing location markers for videos
  await hv.youtubeDrawer.showSunLocationMarkersForForObservationDateVideos();

  // 5 Assert all markers are visible for the mocked videos
  for (const mov of mockedMoviesData) {
    await hv.youtubeDrawer.assertObservationDateYoutubeSharedVideoMarkersVisibleWithTitle(`AIA ${mov.id}`);
  }

  // 6 Check checkbox again for hiding location markers for videos
  await hv.youtubeDrawer.hideSunLocationMarkersForForObservationDateVideos();

  // 7 Assert all markers are NOT visible for the mocked videos
  for (const mov of mockedMoviesData) {
    await hv.youtubeDrawer.assertObservationDateYoutubeSharedVideoMarkersNotVisibleWithTitle(`AIA ${mov.id}`);
  }
});

/**
 * Test Steps for checking observation date shared videos are updated when the observation date changes
 * 1) Load hv
 * 2) Open youtube drawer
 * 3) Toggle visibility for observation date shared videos accordion inside drawer
 * 4) Set observation date to one week back of current datetime
 * 5) Expect a request to be made to fetch new videos for observation date
 */
test("Youtube observation date videos should be updated with the observation date change ", async ({ page }, info) => {
  let hv = new Helioviewer(page, info);

  // 1. LOAD HV
  await hv.Load();
  await hv.CloseAllNotifications();

  // 2. Open Sidebar to control date
  await hv.OpenImageLayerDrawer();

  // 3. Open youtube drawer
  await hv.toggleYoutubeVideosDrawer();
  await hv.WaitForLoadingComplete();

  // 4. Open observation date videos accordion
  await hv.youtubeDrawer.toggleObservationDateYoutubeSharedAccordion();

  // Calculate observation date to one week before the current date
  const initialDate = await hv.GetLoadedDate();
  const oneWeekOfSeconds = 604800;
  const oneWeekBeforeDate = new Date(initialDate.getTime() - oneWeekOfSeconds * 1000);
  const oneWeekBeforeDateURLEncoded = encodeURIComponent(oneWeekBeforeDate.toISOString().slice(0, 19));

  // 5. Expect a request to be made to fetch new youtube videos around new observation date
  const fetchNewObservationDateYoutubeRequestPromise = page.waitForRequest(
    new RegExp(`\\?action=getObservationDateVideos\\&date=${oneWeekBeforeDateURLEncoded}`)
  );

  // 6. Set the observation date one week back ,
  await hv.JumpBackwardsDateWithSelection(oneWeekOfSeconds); // Go one week backwards

  await fetchNewObservationDateYoutubeRequestPromise;
});
