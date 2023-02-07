
addStorageChangedListener();
addRequestListeners();

function addStorageChangedListener() {
    chrome.storage.sync.onChanged.addListener(
        function(changes) {
            for (const url in changes) {
                const change = changes[url];
                // Just a threshold change, no need to update the listener
                if ("oldValue" in change && "newValue" in change) {
                    continue;
                }
                updateRequestListenerUrls();
            }
        }
    );
}

// Updates the request listener with new urls
function updateRequestListenerUrls() {
    chrome.webRequest.onBeforeRequest.removeListener(blockNSFWRequestCallback);
    addRequestListeners();
}

// Registers request listeners
function addRequestListeners() {
    chrome.storage.sync.get().then(
        function(rules) {
            const urls = Object.keys(rules).map((value) => value + "/*");
            chrome.webRequest.onBeforeRequest.addListener(blockNSFWRequestCallback, {urls: urls, types: ["image"]});
        }
    );
}

// Blocks a request if a rule disallows it
function blockNSFWRequestCallback(details: chrome.webRequest.WebRequestBodyDetails) {
    const requestUrl = "https://youtubenotifier.com:8000/?url=" + details.url;
    const thresholdPromise = getRuleForUrl(details.url);
    // Get safe value from server
    fetch(requestUrl).then(
        function(response) {
            if (response.status !== 200) {
                console.warn("Got non-200 response from server", response.status, "for url", details.url);
                return;
            }
            response.json().then(
                function(responseJson) {
                    if (responseJson.data == undefined) {
                        console.log("got undefined data:", responseJson);
                    }
                    const safeValue = responseJson.data.drawings + responseJson.data.neutral;
                    // Tell the content script to unhide safe images
                    thresholdPromise.then(
                        function(rule) {
                            const [ruleUrl, safeThreshold] = rule;
                            if (safeValue >= safeThreshold) {
                                chrome.tabs.sendMessage(details.tabId, details.url);
                            } else {
                                console.info("Blocking image at", details.url);
                            }
                        }
                    )
                },
                function(reason) {
                    console.error("Failed to parse json for reason", reason);
                }
            );
        }
    );
}


// Returns a promise that resolves to a rule for a given url, if one exists.
function getRuleForUrl(url: string) {
    const p = new Promise<[string, number]>(
        function(resolve, reject) {
            chrome.storage.sync.get().then(
                function(rules) {
                    for (const ruleUrl in rules) {
                        if (url.includes(ruleUrl)) {
                            resolve([ruleUrl, rules[ruleUrl]]);
                            return;
                        }
                    }
                },
                (reason) => reject(reason)
            );
        }
    );
    return p;
}
