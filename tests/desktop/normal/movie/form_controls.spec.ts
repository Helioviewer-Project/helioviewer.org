import { test, expect } from "@playwright/test";
import { Helioviewer } from "../../../page_objects/helioviewer";
import * as fs from "fs";

// loading of wrong url , is creating problems
test("Movie button should toggle movie drawer", async ({ page, context }, info) => {
  let hv = new Helioviewer(page);

  await hv.Load();
  await hv.CloseAllNotifications();

  await hv.movie.toggleMovieDrawer();

  expect(await page.screenshot()).toMatchSnapshot("movie-list-drawer.png");

  await hv.movie.toggleMovieDrawer();

  expect(await page.screenshot()).toMatchSnapshot("movie-no-drawer.png");
});

// This tests applies steps for movie drawers , check cancel and form functionalities
test("Play with movie drawer and controls", async ({ page, context, browserName }, info) => {
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
  expect(await page.screenshot()).toMatchSnapshot("movie-form-drawer.png");

  // Action 4 : CANCEL MOVIE CREATION
  await page.getByLabel("Cancel").click();

  // Now we should be seeing movie history lists
  expect(await page.screenshot()).toMatchSnapshot("movie-list-drawer.png");

  // Action 5 : CLICK PARTIAL SCREEN MOVIE
  await hv.movie.selectPartialScreenMovie();

  // Now we should be seeing movie make form
  expect(await page.screenshot()).toMatchSnapshot("partial-movie-selection.png", { maxDiffPixelRatio: 0.01 });

  // Action 4 : CANCEL PARTIAL SELECTION
  await page.locator("#cancel-selecting-image").getByText("Cancel").click();

  // Now we should be seeing movie history lists again
  expect(await page.screenshot()).toMatchSnapshot("movie-list-drawer.png");
});
