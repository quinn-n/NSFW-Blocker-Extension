import { getCurrentTabUrl } from "./common.mjs";

// Adds callbacks to widgets
function addCallbacks() {
    const enableSwitch = document.getElementById("enableswitch");
    enableSwitch?.addEventListener("change", updateSiteSettings);

    const thresholdSlider = document.getElementById("thresholdslider");
    thresholdSlider?.addEventListener("change", updateSiteSettings);
}

// Updates site settings in storage
function updateSiteSettings() {
    const enableSwitch = document.getElementById("enableswitch") as HTMLInputElement | null;
    const thresholdSlider = document.getElementById("thresholdslider") as HTMLInputElement | null;
    if (enableSwitch === null || thresholdSlider === null) {
        console.error("enableSwitch or thresholdSlider not defined");
        return;
    }

    const enabled = enableSwitch.checked;

    getCurrentTabUrl().then(
        function(root_url) {
            if (enabled) {
                chrome.permissions.request({
                    origins: [root_url + "/*"],
                },
                function(permissionsGranted) {
                    if (permissionsGranted) {
                        chrome.storage.sync.set({
                            [root_url]: {
                                "enabled": true,
                                "threshold": thresholdSlider.valueAsNumber
                            }
                        });
                    }
                });
            } else {
                chrome.permissions.remove({
                    origins: [root_url + "/*"],
                });

                chrome.storage.sync.set({
                    [root_url]: {
                        "enabled": false,
                        "threshold": thresholdSlider.valueAsNumber
                    }
                });
            }
        }
    );
}

export {addCallbacks};
