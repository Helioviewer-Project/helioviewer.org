import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

// Test For checking each time range should go in to the API request to calculate range
const hourInMilliSeconds = 60 * 60 * 1000;
const dayInMilliSeconds = 24 * hourInMilliSeconds;

[
  { label: "1 hour", milliseconds: hourInMilliSeconds },
  { label: "3 hours", milliseconds: 3 * hourInMilliSeconds },
  { label: "6 hours", milliseconds: 6 * hourInMilliSeconds },
  { label: "12 hours", milliseconds: 12 * hourInMilliSeconds },
  { label: "1 day", milliseconds: dayInMilliSeconds },
  { label: "2 days", milliseconds: 2 * dayInMilliSeconds },
  { label: "1 week", milliseconds: 7 * dayInMilliSeconds },
  { label: "28 days", milliseconds: 28 * dayInMilliSeconds }
].forEach(({ label, milliseconds }) => {
  test('Movie range "' + label + '" should correctly rely to API in Requests', async ({ page }) => {
    let hv = new Helioviewer(page);

    // load helioviewer
    // Action 1 : BROWSE TO HELIOVIEWER
    await hv.Load();
    await hv.CloseAllNotifications();

    // Action 2 : USE MOVIE FORM
    await hv.movie.toggleMovieDrawer();
    await hv.movie.selectFullScreenMovie();

    // Action 3 : Set Duration
    await page.getByLabel("Duration", { exact: true }).selectOption({ label: label });

    // Expect postMovie POST Request
    const postMoviePromise = page.waitForRequest(/\?action=postMovie/);
    await page.getByLabel("Submit").click();
    const postMovieRequest = await postMoviePromise;
    const movieJSON = await postMovieRequest.postDataJSON();

    const observationDate = new Date(movieJSON.reqObservationDate).setMilliseconds(0);
    const startDateTime = new Date(movieJSON.startTime).setMilliseconds(0);
    const endDateTime = new Date(movieJSON.endTime).setMilliseconds(0);

    await expect(endDateTime - startDateTime).toBe(milliseconds);
    await expect(observationDate - startDateTime).toBe(milliseconds / 2);
    await expect(endDateTime - observationDate).toBe(milliseconds / 2);
  });
});

[{ frame_per_sec: 15 }, { frame_per_sec: 25 }].forEach(({ frame_per_sec }) => {
  test('Set frame per second : "' + frame_per_sec + '" should correctly rely to API in Requests', async ({ page }) => {
    let hv = new Helioviewer(page);

    // load helioviewer
    // Action 1 : BROWSE TO HELIOVIEWER
    await hv.Load();
    await hv.CloseAllNotifications();

    // Action 2 : USE MOVIE FORM
    await hv.movie.toggleMovieDrawer();
    await hv.movie.selectFullScreenMovie();

    // Action 3 : Set Frame per Second
    await page.getByRole("spinbutton", { name: "Frames/Sec" }).fill(frame_per_sec.toString());

    // Expect postMovie POST Request
    const postMoviePromise = page.waitForRequest(/\?action=postMovie/);
    await page.getByLabel("Submit").click();
    const postMovieRequest = await postMoviePromise;
    const movieJSON = await postMovieRequest.postDataJSON();

    expect(movieJSON).toEqual(expect.objectContaining({ frameRate: frame_per_sec }));
  });
});

[{ length: 20 }, { length: 40 }].forEach(({ length }) => {
  test('Set length : "' + length + '" should correctly rely to API in Requests', async ({ page }) => {
    let hv = new Helioviewer(page);

    // load helioviewer
    // Action 1 : BROWSE TO HELIOVIEWER
    await hv.Load();
    await hv.CloseAllNotifications();

    // Action 2 : USE MOVIE FORM
    await hv.movie.toggleMovieDrawer();
    await hv.movie.selectFullScreenMovie();

    // Action 3 : Set Video Length
    await page.getByRole("radio", { name: "Length (s)" }).check();
    await page.getByRole("spinbutton", { name: "Length (s)" }).fill(length.toString());

    // Expect postMovie POST Request
    const postMoviePromise = page.waitForRequest(/\?action=postMovie/);
    await page.getByLabel("Submit").click();
    const postMovieRequest = await postMoviePromise;
    const movieJSON = await postMovieRequest.postDataJSON();

    expect(movieJSON).toEqual(expect.objectContaining({ movieLength: length }));
  });
});

test("Display youtube movies icons checkbox sould correctly rely to API in Requests", async ({ page }) => {
  let hv = new Helioviewer(page);

  // load helioviewer
  // Action 1 : BROWSE TO HELIOVIEWER
  await hv.Load();
  await hv.CloseAllNotifications();

  // Action 2 : USE MOVIE FORM
  await hv.movie.toggleMovieDrawer();
  await hv.movie.selectFullScreenMovie();

  // Action 3 : Set display movie icons checkbox
  await page.getByLabel("Display YouTube movies icons").check();

  // Expect postMovie POST Request
  const postMoviePromise = page.waitForRequest(/\?action=postMovie/);
  await page.getByLabel("Submit").click();
  const postMovieRequest = await postMoviePromise;
  const movieJSON = await postMovieRequest.postDataJSON();

  expect(movieJSON).toEqual(expect.objectContaining({ movieIcons: true }));
});
