class _BrokenScreenshotNotifier {
    constructor() {
        this.screenshots = Helioviewer.userSettings.get("history.screenshots");
        this.num_broken_screenshots = this.CountBrokenScreenshots();
    }

    CountBrokenScreenshots() {
        return this.screenshots.filter((screenshot) => screenshot.id === false).length;
    }

    Apply() {
        if (this.num_broken_screenshots > 0) {
            // The issue resulted in a screenshot id of "false". So remove those from the list.
            let okScreenshots = this.screenshots.filter((screenshot) => screenshot.id !== false);
            // Write back the updated list to the history
            Helioviewer.userSettings.set("history.screenshots", okScreenshots);
        }
    }

    NotifyIfAffected() {
        if (this.num_broken_screenshots > 0) {
            // Options for the jGrowl notification
            let jGrowlOpts = {
                sticky: true,
                header: "Just now"
            };

            let message = `Due to some recent database issues, we were unable to store ${this.num_broken_screenshots} of your recent screenshots. These have been removed from your screenshot history.`;

            // Schedule notification to appear when the notification system is ready.
            $(document).bind("helioviewer-ready", () => {
                $(document).trigger('message-console-log', [message, jGrowlOpts, true, true]);
            });
        }
    }
};

function ApplyPatch493_RemoveBrokenScreenshots() {
    let patch = new _BrokenScreenshotNotifier();
    patch.Apply();
    patch.NotifyIfAffected();
}

if (typeof module !== 'undefined') {
    module.exports = { _BrokenScreenshotNotifier }
}