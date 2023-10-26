/**
 * See https://github.com/Helioviewer-Project/helioviewer.org/issues/493
 * Due to a database issue, many screenshots were taken and added to user's lists,
 * but these screenshots are broken and result in an API error when opened.
 * This unit test tests the code which notifies the user that they were affected and broken links were removed.
 */

const {
  _BrokenScreenshotNotifier,
} = require("../Patches/broken_screenshots_493.js");

// Mock global Helioviewer object for testing
global.Helioviewer = {
  userSettings: {
    get: jest.fn(),
    set: jest.fn(),
  },
};
// Mock jquery trigger
let trigger = jest.fn();
let bind = jest.fn();
global.$ = () => {
  return { trigger: trigger, bind: bind };
};
global.document = null;

describe("Broken screenshot patch", () => {
  it("Should count the number of broken screenshots in the list", () => {
    // Set test data to be returned to have one valid and one invalid screenshot
    Helioviewer.userSettings.get.mockReturnValueOnce([
      { id: 1 },
      { id: false },
    ]);
    // Expect the patch to count the 1 invalid screenshot correctly
    let patch = new _BrokenScreenshotNotifier();
    expect(patch.num_broken_screenshots).toBe(1);

    // Repeat the test with 3 invalid screenshots
    Helioviewer.userSettings.get.mockReturnValueOnce([
      { id: false },
      { id: false },
      { id: false },
    ]);
    patch = new _BrokenScreenshotNotifier();
    expect(patch.num_broken_screenshots).toBe(3);

    // Repeat the test with no invalid screenshots
    Helioviewer.userSettings.get.mockReturnValueOnce([
      { id: 0 },
      { id: 1 },
      { id: 2 },
    ]);
    patch = new _BrokenScreenshotNotifier();
    expect(patch.num_broken_screenshots).toBe(0);
  });

  it("Should remove broken screenshots from the history list", () => {
    // Set test data to 3 invalid screenshots and one valid
    Helioviewer.userSettings.get.mockReturnValueOnce([
      { id: false },
      { id: false },
      { id: false },
      { id: 1337 },
    ]);
    let patch = new _BrokenScreenshotNotifier();
    patch.Apply();
    // Expect the patch to set the screenshots list to the one valid screenshot
    expect(Helioviewer.userSettings.set.mock.calls.length).toBe(1);
    expect(Helioviewer.userSettings.set.mock.calls[0][0]).toBe(
      "history.screenshots",
    );
    expect(Helioviewer.userSettings.set.mock.calls[0][1]).toStrictEqual([
      { id: 1337 },
    ]);
  });

  it("Should notify the user that N items were removed from their screenshot list", () => {
    Helioviewer.userSettings.get.mockReturnValueOnce([
      { id: false },
      { id: false },
      { id: false },
      { id: 1337 },
    ]);
    let patch = new _BrokenScreenshotNotifier();
    patch.NotifyIfAffected();
    // Expect a call to schedule the jgrowl notification via bind
    expect($().bind.mock.calls.length).toBe(1);
    expect($().bind.mock.calls[0][0]).toBe("helioviewer-ready");
    // Call the bound function to simulate the helioviewer-ready function being called.
    $().bind.mock.calls[0][1]();
    expect($().trigger.mock.calls.length).toBe(1);
    expect($().trigger.mock.calls[0][0]).toBe("message-console-log");
    expect($().trigger.mock.calls[0][1][0]).toContain(
      "3 of your recent screenshots",
    );
  });
});
