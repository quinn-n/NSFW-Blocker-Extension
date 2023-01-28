
// Loads settings for the current site into the elements
function loadSiteSettings(site: string) {
    chrome.storage.sync.get(site).then(
        function(site_settings) {
            const enableSwitch = document.getElementById("enableswitch") as HTMLInputElement | null;
            const thresholdSlider = document.getElementById("thresholdslider") as HTMLInputElement | null;
            if (enableSwitch === null || thresholdSlider === null) {
                return;
            }
            enableSwitch.checked = site_settings[site]["enabled"];
            thresholdSlider.value = site_settings[site]["threshold"];
        }
    );
}

export {loadSiteSettings};
