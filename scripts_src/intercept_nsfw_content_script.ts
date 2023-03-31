

/*
This script works in two basic steps:
1. Hide all images with applicable rules.
2. Un-hides images as the service worker marks them as "safe".
*/

hideAddedImages();
hideImagesAddedOnPageLoad();


type NSFWResponseData = {
    drawings: number;
    hentai: number;
    neutral: number;
    porn: number;
    sexy: number;
    is_nsfw: boolean;
};

type NSFWRawResponseData = {
    data: NSFWResponseData;
};


// Hids all images loaded on page with an applicable rule
function hideImagesAddedOnPageLoad() {
    getUrlRules().then(
        (urls) => {
            // NOTE: This is pretty slow, but there doesn't seem to be a good way to filter by
            // backgroundImage
            const nodes = document.getElementsByTagName("*");
            verifyNodes(nodes, urls);
        }
    );
}

// Hides all images added to the DOM after page load with an applicable rule
function hideAddedImages() {
    getUrlRules().then(
        (ruleUrls) => {
            const observer = new MutationObserver(
                (mutationList) => {
                    for (const mutation of mutationList) {
                        if (mutation.attributeName === "style" || mutation.target.nodeName === "IMG") {
                            /*
                            If there's a difference between the old style's hidden attribute and the new style's hidden attribute
                            skip the mutation to avoid infinite loops.
                            */
                            if (!shouldProcessMutation(mutation)) {
                                continue;
                            }
                            if (nodeHasRule(mutation.target, ruleUrls)) {
                                verifyNode(mutation.target);
                            }
                        }
                        verifyNodes(mutation.addedNodes, ruleUrls);
                    }
                }
            );
            observer.observe(document, {childList: true, subtree: true, attributes: true, attributeFilter: ["style", "src"], attributeOldValue: true});
        }
    );
}

// Returns true if a style mutation should be processed, or false if it should be skipped.
function shouldProcessMutation(mutation: MutationRecord) {
    if (mutation.oldValue === null) {
        return true;
    }
    const oldStyle = mutation.oldValue.split(" ");
    const oldHidden = oldStyle.includes("visibility")? oldStyle[oldStyle.indexOf("visibility") + 1] === "hidden;" : false;

    const ele = mutation.target as HTMLElement;
    const newHidden = ele.style.visibility === "hidden";

    return newHidden !== oldHidden;
}

// Recursively hides and verifies all images with an applicable ruleUrl
function verifyNodes(nodes: NodeList | HTMLCollectionOf<Element>, ruleUrls: string[]) {
    for (const node of nodes) {
        if (nodeHasRule(node, ruleUrls)) {
            verifyNode(node);
        }
    }
}

// Verifies that an image is SFW before displaying it
function verifyNode(node: Node) {
    const url = getNodeURL(node);
    if (url === undefined) {
        return new Promise((resolve, reject) => reject("Undefined node url"));
    }
    hideNode(node);
    return shouldBlockImage(url).then(
        (shouldBlock) => {
            if (!shouldBlock) {
                unhideNode(node);
            }
        },
        (reason) => console.log(reason)
    );
}

// Queries a service worker about a given url
function shouldBlockImage(url: string): Promise<boolean> {
    return chrome.runtime.sendMessage(url);
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

// Returns true if a node has an applicable rule
function nodeHasRule(node: Node, ruleUrls: string[]) {
    const nodeUrl = getNodeURL(node);
    if (nodeUrl === undefined) {
        return false;
    }
    const element = node as HTMLElement;

    for (const url of ruleUrls) {
        if (nodeUrl.includes(url)) {
            if (element.style.visibility !== "" && element.style.visibility !== "hidden") {
                console.warn("Got non-empty visibility", element.style.visibility);
            }
            return true;
        }
    }
    return false;
}


// Gets the URL from either an image element or an element with a background-image
// Returns undefined if there is no image
function getNodeURL(node: Node) {
    if (node.nodeName === "IMG") {
        const img = node as HTMLImageElement;
        return img.src;
    } else {
        const element = node as HTMLElement;
        var style;
        try {
            style = document.defaultView?.getComputedStyle(element);
        } catch (error) {
            return undefined;
        }
        if (style?.backgroundImage === "none") {
            return undefined;
        }
        return style?.backgroundImage.substring(5, style.backgroundImage.length - 2);
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
