import { getCurrentTabUrl } from "./common.mjs";
import { addNewRule } from "./rules.mjs";

// Adds callbacks to widgets
function addCallbacks() {
    const addRuleButton = document.getElementById("addrulebutton");
    addRuleButton?.addEventListener("click", addNewRule);
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
        function(rootUrl) {
            if (enabled) {
                /*
                chrome.permissions.request({
                    origins: [rootUrl + "/*"],
                },
                function(permissionsGranted) {
                    if (permissionsGranted) {
                        chrome.storage.sync.set({
                            [rootUrl]: {
                                "enabled": true,
                                "threshold": thresholdSlider.valueAsNumber
                            }
                        });
                        console.log("Registering content script for", rootUrl);
                        addContentScriptUrl(rootUrl + "/*");
                    }
                });
                */
                chrome.storage.sync.set({
                    [rootUrl]: {
                        "enabled": true,
                        "threshold": thresholdSlider.valueAsNumber
                    }
                });
                console.log("Registering content script for", rootUrl);
                addListenerForUrl(rootUrl + "/*");
            } else {
                /*
                chrome.permissions.remove({
                    origins: [rootUrl + "/*"],
                });
                */

                chrome.storage.sync.set({
                    [rootUrl]: {
                        "enabled": false,
                        "threshold": thresholdSlider.valueAsNumber
                    }
                });
            }
        }
    );
}

function addListenerForUrl(rootUrl: string) {

}

export {addCallbacks};
