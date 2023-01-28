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
    getCurrentTabUrl().then(
        function(root_url) {
            chrome.storage.sync.set({
                [root_url]: {
                    "enabled": enableSwitch?.checked,
                    "threshold": thresholdSlider?.value
                }
            });
        }
    );
}

export {addCallbacks};
