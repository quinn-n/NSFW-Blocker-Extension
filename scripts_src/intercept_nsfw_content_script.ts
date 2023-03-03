

/*
This script works in two basic steps:
1. Hide all images with applicable rules.
2. Un-hides images as the service worker marks them as "safe".
*/

hideAddedImages();
hideImagesAffectedByRules();


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


const mutationObservers = new Map<Node, MutationObserver>();

// Hids all images loaded on page with an applicable rule
function hideImagesAffectedByRules() {
    getUrlRules().then(
        function(urls) {
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
        function(ruleUrls) {
            const observer = new MutationObserver(
                function(mutationList) {
                    for (const mutation of mutationList) {
                        verifyNodes(mutation.addedNodes, ruleUrls);

                        /*
                        // Remove observers for deleted nodes
                        for (const node of mutation.removedNodes) {
                            removeMutationObserver(node);
                        }
                        */
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
            if (nodeHasRule(mutation.target, ruleUrls)) {
                verifyNode(mutation.target);
            }
        }
    }
}

// Recursively hides and verifies all images with an applicable ruleUrl
function verifyNodes(nodes: NodeList | HTMLCollectionOf<Element>, ruleUrls: string[]) {
    for (const node of nodes) {
        // addMutationObserver(node);
        verifyNodes(node.childNodes, ruleUrls);
        if (nodeHasRule(node, ruleUrls)) {
            verifyNode(node);
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

// Verifies that an image is SFW before displaying it
function verifyNode(node: Node) {
    const url = getNodeURL(node);
    if (url === undefined) {
        return new Promise((resolve, reject) => reject("Undefined node url"));
    }
    hideNode(node);
    return shouldBlockImage(url).then(
        function(shouldBlock) {
            if (!shouldBlock) {
                unhideNode(node);
                // console.log("Showing image", node);
            } else {
                // console.log("Hiding image", node);
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
        return style?.backgroundImage;
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
