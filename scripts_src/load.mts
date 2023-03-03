import { getElementByClassName } from "./common.mjs";
import { addExistingRule, createRuleDiv } from "./rules.mjs";

// Loads settings for the current site into the elements
function loadSiteSettings() {
    chrome.storage.sync.get().then(
        function(sites) {
            for (const url in sites) {
                const ruleSensitivity = sites[url];
                const ruleDiv = createRuleDiv();

                const ruleInput = getElementByClassName(ruleDiv, "ruleurlinput") as HTMLInputElement | undefined;
                const ruleOutput = getElementByClassName(ruleDiv, "ruleurloutput") as HTMLOutputElement | undefined;
                const sensitivitySlider = getElementByClassName(ruleDiv, "rulesensitivity") as HTMLInputElement | undefined;
                const sensitivityDisplay = getElementByClassName(ruleDiv, "sensitivitydisplay") as HTMLInputElement | undefined;
                if (ruleInput === undefined || ruleOutput === undefined || sensitivitySlider === undefined || sensitivityDisplay === undefined) {
                    return;
                }
                ruleInput.value = url;
                ruleOutput.value = url;
                sensitivitySlider.value = ruleSensitivity;
                sensitivityDisplay.value = ruleSensitivity;
                addExistingRule(ruleDiv);
            }
        }
    );
}

export {loadSiteSettings};
