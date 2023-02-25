

/*
This script works in two basic steps:
1. Hide all images with applicable rules.
2. Un-hides images as the service worker marks them as "safe".
*/

hideAddedImages();
hideImagesAffectedByRules();

unhideSafeImages();

const mutationObservers = new Map<Node, MutationObserver>();

// Hids all images loaded on page with an applicable rule
function hideImagesAffectedByRules() {
    getUrlRules().then(
        function(urls) {
            // NOTE: This is pretty slow, but there doesn't seem to be a good way to filter by
            // backgroundImage
            const nodes = document.getElementsByTagName("*");
            // console.log("Scanning", nodes.length, "initial nodes.");
            hideImages(nodes, urls);
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
                        hideImages(mutation.addedNodes, ruleUrls);

                        // Remove observers for deleted nodes
                        for (const node of mutation.removedNodes) {
                            removeMutationObserver(node);
                        }
                    }
                }
            );
            observer.observe(document, {childList: true, subtree: true, attributes: true});
        }
    );
}

// Adds a MutationObserver for a node
// Because some sites update the background-image style rule later for some reason?
function addMutationObserver(node: Node) {
    // console.log("Adding mutation observer to", node);
    getUrlRules().then(
        function(ruleUrls) {
            const observer = new MutationObserver((mutations) => hideImagesAddedToElement(mutations, ruleUrls));
            observer.observe(node, {attributes: true});
            mutationObservers.set(node, observer);
        }
    );
}

// Removes a MutationObserver for a node
function removeMutationObserver(node: Node) {
    const observer = mutationObservers.get(node);
    observer?.disconnect();
    mutationObservers.delete(node);
}

// Hides images added to an element after it's been added to the document
function hideImagesAddedToElement(mutationList: MutationRecord[], ruleUrls: string[]) {
    for (const mutation of mutationList) {
        if (mutation.attributeName === "style") {
            console.log("Got mutation to element", mutation.target);
            if (shouldHideNode(mutation.target, ruleUrls)) {
                hideNode(mutation.target);
            }
        }
    }
}

// Sets up the callbacks to unhide images marked safe by the content script
function unhideSafeImages() {
    chrome.runtime.onMessage.addListener(
        function(url) {
            unhideImageByURL(url);
        }
    );
}

// Recursively hides all images with an applicable ruleUrl
function hideImages(nodes: NodeList | HTMLCollectionOf<Element>, ruleUrls: string[]) {
    for (const node of nodes) {
        addMutationObserver(node);
        hideImages(node.childNodes, ruleUrls);
        if (shouldHideNode(node, ruleUrls)) {
            hideNode(node);
        }
    }
}

// Unhides all images with a matching src in the document
function unhideImageByURL(src: string) {
    for (const img of document.getElementsByTagName("img")) {
        if (img.src === src) {
            unhideNode(img);
        }
    }
}

// Verifies that a node is SFW before displaying it
function verifyNode(node: Node) {
    hideNode(node);
}

// Hides a node
function hideNode(node: Node) {
    const element = node as HTMLElement;
    element.style.visibility = "hidden";
}

// Unhides a node
function unhideNode(node: Node) {
    const element = node as HTMLElement;
    element.style.visibility = "";
}

// Returns true if a node should be hidden
function shouldHideNode(node: Node, ruleUrls: string[]) {
    const element = node as HTMLElement;
    var style;
    try {
        style = document.defaultView?.getComputedStyle(element);
    // Filter out elements like scripts that have no style
    } catch (error) {
        return false;
    }
    if (style === undefined) {
        return false;
    }
    if (node.nodeName !== "IMG" && !style.backgroundImage.includes("url")) {
        return false;
    }
    if (node.nodeName === "IMG") {
        const img = node as HTMLImageElement;
        for (const url of ruleUrls) {
            if (img.src.includes(url)) {
                if (img.style.visibility !== "" && img.style.visibility !== "hidden") {
                    console.warn("Got non-empty visibility", img.style.visibility);
                }
                return true;
            }
        }
    } else {
        for (const url of ruleUrls) {
            if (style.backgroundImage.includes(url)) {
                // console.log("Hiding backgroundImage", style.backgroundImage, "for element", element);
                if (element.style.visibility !== "" && element.style.visibility !== "hidden") {
                    console.warn("Got non-empty visibility", element.style.visibility);
                }
                return true;
            }
        }
    }
}

// Returns a promise with the url rules when it resolves
function getUrlRules() {
    const p = new Promise<string[]>(
        function(resolve, reject) {
            chrome.storage.sync.get().then(
                (values) => resolve(Object.keys(values)),
                (reason) => reject(reason)
            );
        }
    );
    return p;
}
