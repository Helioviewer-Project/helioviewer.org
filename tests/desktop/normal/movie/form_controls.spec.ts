import { test, expect } from '@playwright/test';
import { Helioviewer } from '../../../page_objects/helioviewer'
import * as fs from 'fs';

// loading of wrong url , is creating problems
test('Movie button should toggle movie drawer', async ({ page, context }, info) => {

  let hv = new Helioviewer(page);

  await hv.Load();
  await hv.CloseAllNotifications();

  await hv.movie.toggleMovieDrawer();

  expect(await page.screenshot()).toMatchSnapshot('movie-list-drawer.png');

  await hv.movie.toggleMovieDrawer();

  expect(await page.screenshot()).toMatchSnapshot('movie-no-drawer.png');

});

// This tests applies steps for movie drawers , check cancel and form functionalities 
test('Play with movie drawer and controls', async ({ page, context, browserName }, info) => {

  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : CLICK MOVIE TAB BUTTON
  await hv.movie.toggleMovieDrawer();

  // Action 3 : CLICK FULLSCREEN MOVIE
  await hv.movie.selectFullScreenMovie();

  // Now we should be seeing movie make form
  expect(await page.screenshot()).toMatchSnapshot('movie-form-drawer.png');

  // Action 4 : CANCEL MOVIE CREATION
  await page.getByLabel('Cancel').click();

  // Now we should be seeing movie history lists
  expect(await page.screenshot()).toMatchSnapshot('movie-list-drawer.png');

  // Action 5 : CLICK PARTIAL SCREEN MOVIE
  await hv.movie.selectPartialScreenMovie();

  // Now we should be seeing movie make form
  expect(await page.screenshot()).toMatchSnapshot('partial-movie-selection.png');

  // Action 4 : CANCEL PARTIAL SELECTION
  await page.locator('#cancel-selecting-image').getByText('Cancel').click();
  
  // Now we should be seeing movie history lists again
  expect(await page.screenshot()).toMatchSnapshot('movie-list-drawer.png');
});

// Test For checking each time range should go in to the API request to calculate range
const hourInMilliSeconds = 60 * 60 * 1000;
const dayInMilliSeconds = 24 * hourInMilliSeconds;

[
  { label: '1 hour', milliseconds : hourInMilliSeconds },
  { label: '3 hours', milliseconds : 3 * hourInMilliSeconds },
  { label: '6 hours', milliseconds : 6 * hourInMilliSeconds },
  { label: '12 hours', milliseconds : 12 * hourInMilliSeconds },
  { label: '1 day', milliseconds : dayInMilliSeconds },
  { label: '2 days', milliseconds : 2 * dayInMilliSeconds }, 
  { label: '1 week', milliseconds : 7 * dayInMilliSeconds }, 
  { label: '28 days', milliseconds : 28 * dayInMilliSeconds }, 

].forEach(({ label, milliseconds }) => {

  test('Movie range "'+label+'" should correctly rely to API in Requests', async ({ page }) => {

    let hv = new Helioviewer(page);

    // load helioviewer
    // Action 1 : BROWSE TO HELIOVIEWER
    await hv.Load();
    await hv.CloseAllNotifications();

    // Action 2 : USE MOVIE FORM
    await hv.movie.toggleMovieDrawer();
    await hv.movie.selectFullScreenMovie();
    
    // Action 3 : Set Duration
    await page.getByLabel('Duration', { exact: true }).selectOption({label : label});

    // Expect postMovie POST Request
    const postMoviePromise = page.waitForRequest(/\?action=postMovie/); 
    await page.getByLabel('Submit').click();
    const postMovieRequest = await postMoviePromise;
    const movieJSON = await postMovieRequest.postDataJSON();

    const observationDate = new Date(movieJSON.reqObservationDate).setMilliseconds(0); 
    const startDateTime = new Date(movieJSON.startTime).setMilliseconds(0); 
    const endDateTime = new Date(movieJSON.endTime).setMilliseconds(0); 

    await expect(endDateTime - startDateTime).toBe(milliseconds);
    await expect(observationDate - startDateTime).toBe(milliseconds / 2);
    await expect(endDateTime - observationDate).toBe(milliseconds / 2);
  })

});
