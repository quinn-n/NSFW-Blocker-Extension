

/*
This script works in two basic steps:
1. Hide all images with applicable rules.
2. Un-hides images as the service worker marks them as "safe".
*/

hideImagesAffectedByRules();
hideAddedImages();

unhideSafeImages();

// Hids all images loaded on page with an applicable rule
function hideImagesAffectedByRules() {
    getUrlRules().then(
        function(urls) {
            const images = document.getElementsByTagName("img");
            for (const img of images) {
                for (const url of urls) {
                    if (img.currentSrc.includes(url)) {
                        img.hidden = true;
                    }
                }
            }
        }
    );
}

// Hides all images added to the DOM after page load with an applicable rule
function hideAddedImages() {
    getUrlRules().then(
        function(ruleUrls) {
            const observer = new MutationObserver(
                function(mutationList) {
                    for (const mutation of mutationList) {
                        for (const addedNode of mutation.addedNodes) {
                            if (addedNode.nodeName !== "IMG") {
                                continue;
                            }
                            const img = addedNode as HTMLImageElement;
                            for (const url of ruleUrls) {
                                if (img.src.includes(url)) {
                                    img.hidden = true;
                                }
                            }
                        }
                    }
                }
            );

            observer.observe(document, {childList: true, subtree: true});
        }
    );
}

// Sets up the callbacks to unhide images marked safe by the content script
function unhideSafeImages() {
    chrome.runtime.onMessage.addListener(
        function(url) {
            unhideImage(url);
        }
    );
}

// Unhides all images with a matching src in the document
function unhideImage(src: string) {
    for (const img of document.getElementsByTagName("img")) {
        if (img.src === src) {
            console.log("Unhiding image ", img);
            img.hidden = false;
        }
    }
}

// Returns a promise with the url rules when it resolves
function getUrlRules() {
    const p = new Promise<string[]>(
        function(resolve, reject) {
            chrome.storage.sync.get().then(
                (values) => {resolve(Object.keys(values))},
                (reason) => reject(reason)
            );
        }
    );
    return p;
}
