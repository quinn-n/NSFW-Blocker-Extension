import { ModuleDetectionKind } from "../node_modules/typescript/lib/typescript";
import { getElementByClassName } from "./common.mjs";

enum UrlDisplayMode {
    Output,
    Input
}

// Add a new blank rule to the list
function addNewRule() {
    const ruleList = document.getElementById("rulelist") as HTMLUListElement | undefined;
    if (ruleList === undefined) {
        console.error("Could not get rulelist element.");
        return;
    }
    const newRule = createRuleDiv();
    ruleList.appendChild(newRule);
    setUrlMode(newRule, UrlDisplayMode.Input);
}

// Add an existing rule to the list
function addExistingRule(ruleDiv: HTMLDivElement) {
    const ruleList = document.getElementById("rulelist") as HTMLUListElement | undefined;
    if (ruleList === undefined) {
        console.error("Could not get rulelist element.");
        return;
    }
    ruleList.appendChild(ruleDiv);
}

function createRuleDiv() {
    const ruleDiv = document.createElement("div");
    ruleDiv.className = "listrule";

    const urlOutput = document.createElement("output");
    urlOutput.className = "ruleurloutput";
    ruleDiv.appendChild(urlOutput);
    urlOutput.addEventListener("click", () => setUrlMode(ruleDiv, UrlDisplayMode.Input));

    const urlInput = document.createElement("input");
    urlInput.className = "ruleurlinput";
    urlInput.hidden = true;
    urlInput.addEventListener("focusout", saveUrl);
    ruleDiv.appendChild(urlInput);

    const sensitivityDisplay = document.createElement("input");
    sensitivityDisplay.className = "sensitivitydisplay";
    sensitivityDisplay.value = "95";
    sensitivityDisplay.addEventListener("change", () => updateRule(ruleDiv, sensitivityDisplay));
    ruleDiv.appendChild(sensitivityDisplay);

    const ruleSensitivity = document.createElement("input");
    ruleSensitivity.className = "rulesensitivity"
    ruleSensitivity.type = "range";
    ruleSensitivity.min = "0";
    ruleSensitivity.max = "100";
    ruleSensitivity.value = "95";
    ruleSensitivity.addEventListener("change", () => updateRule(ruleDiv, ruleSensitivity));
    ruleSensitivity.addEventListener("pointermove", () => updateSensitivityDisplay(ruleDiv));
    ruleDiv.appendChild(ruleSensitivity);

    const ruleDelete = document.createElement("button");
    ruleDelete.className = "ruledeletebutton";
    ruleDelete.addEventListener("click", deleteRuleCallback);
    ruleDiv.appendChild(ruleDelete);

    return ruleDiv;
}

// Saves a new url
function saveUrl(this: HTMLInputElement) {
    const ruleDiv = this.parentElement as HTMLDivElement | null;
    if (ruleDiv === null) {
        console.error("urlInput", this, "has no parent element.");
        return;
    }
    const urlOutput = ruleDiv.getElementsByClassName("ruleurloutput")[0] as HTMLOutputElement | undefined;
    if (urlOutput === undefined) {
        console.error("ruleDiv", ruleDiv, "missing urlOutput");
        return;
    }
    if (this.value === "") {
        deleteRule(ruleDiv);
    }
    chrome.storage.sync.remove(urlOutput.value);
    urlOutput.value = this.value;
    setUrlMode(ruleDiv, UrlDisplayMode.Output);
    return updateRule(ruleDiv);
}

// Updates the rule display when the slider is slid
function updateSensitivityDisplay(ruleDiv: HTMLDivElement) {
    const thresholdSlider = getElementByClassName(ruleDiv, "rulesensitivity") as HTMLInputElement | undefined;
    const thresholdDisplay = getElementByClassName(ruleDiv, "sensitivitydisplay") as HTMLInputElement | undefined;
    if (thresholdSlider === undefined || thresholdDisplay === undefined) {
        return;
    }
    thresholdDisplay.value = thresholdSlider.value;
}

// Updates rule settings in storage
function updateRule(ruleDiv: HTMLDivElement, inputElement?: HTMLInputElement) {
    const urlInput = getElementByClassName(ruleDiv, "ruleurlinput") as HTMLInputElement | undefined;
    const thresholdSlider = getElementByClassName(ruleDiv, "rulesensitivity") as HTMLInputElement | undefined;
    const thresholdDisplay = getElementByClassName(ruleDiv, "sensitivitydisplay") as HTMLInputElement | undefined;
    if (urlInput === undefined || thresholdSlider === undefined || thresholdDisplay === undefined) {
        return;
    }
    if (inputElement === undefined) {
        inputElement = thresholdSlider;
    }
    const url = urlInput.value;
    const threshold = inputElement.value;
    thresholdSlider.value = threshold;
    thresholdDisplay.value = threshold;
    return chrome.storage.sync.set({[url]: threshold});
}

// Swaps the url widget between the input one and the output one
function setUrlMode(ruleDiv: HTMLDivElement, mode: UrlDisplayMode) {
    const urlOutput = getElementByClassName(ruleDiv, "ruleurloutput") as HTMLOutputElement;
    const urlInput = getElementByClassName(ruleDiv, "ruleurlinput") as HTMLInputElement;
    if (urlOutput === undefined || urlInput === undefined) {
        return;
    }

    switch (mode) {
        case UrlDisplayMode.Input:
            urlOutput.hidden = true;
            urlInput.hidden = false;
            urlInput.select();
            break;
        case UrlDisplayMode.Output:
            urlOutput.hidden = false;
            urlInput.hidden = true;
            break;
    };
}

// Deletes an existing rule
function deleteRuleCallback(this: HTMLButtonElement, ev: MouseEvent): any {
    const ruleDiv = this.parentElement as HTMLDivElement | null;
    if (ruleDiv === null) {
        console.error("deleteRuleCallback got no parent element");
        return;
    }
    deleteRule(ruleDiv);
}

function deleteRule(ruleDiv: HTMLDivElement) {
    // Remove rule from storage
    const ruleInput = ruleDiv.getElementsByClassName("ruleurlinput")[0] as HTMLInputElement | undefined;
    if (ruleInput === undefined) {
        console.error("Got missing ruleInput when deleting rule");
        return;
    }
    chrome.storage.sync.remove(ruleInput.value).then(
        function() {
            // Delete elements from document
            for (const element of ruleDiv.children) {
                element.remove();
            }
            ruleDiv.remove();
        }
    )
}

export {addExistingRule, addNewRule, createRuleDiv};
