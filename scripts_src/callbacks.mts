import { getCurrentTabUrl } from "./common.mjs";

function addCallbacks() {
    const enableSwitch = document.getElementById("enableswitch");
    enableSwitch?.addEventListener("change", updateEnabled);

    const thresholdSlider = document.getElementById("thresholdslider");
    thresholdSlider?.addEventListener("change", updateThreshold);
}

function updateEnabled(ev: Event) {
    updateSiteSettings();
}

function updateThreshold() {
    updateSiteSettings();
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
