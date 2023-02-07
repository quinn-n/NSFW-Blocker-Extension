
addStorageChangedListener();
addRequestListeners();

function addStorageChangedListener() {
    chrome.storage.sync.onChanged.addListener(
        function(changes) {
            console.log("Got storage changes", changes);
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
            /*
            for (const url in rules) {
                urls.push(url + "/*");
            }
            */
            chrome.webRequest.onBeforeRequest.addListener(blockNSFWRequestCallback, {urls: urls, types: ["image"]});
            console.log("Added listener for urls", urls);
        }
    );
}

// Blocks a request if a rule disallows it
function blockNSFWRequestCallback(details: chrome.webRequest.WebRequestBodyDetails) {
    console.log("Got request url", details.url);
    const requestUrl = "https://youtubenotifier.com:8000/?url=" + details.url;
    // Temporary value
    const safeThreshold = 90;
    fetch(requestUrl).then(
        function(response) {
            if (response.status !== 200) {
                console.warn("Got non-200 response from server", response.status);
                return;
            }
            response.json().then(
                function(responseJson) {
                    console.log("Got responseJson", responseJson);
                    console.log("Got image safe rating:", responseJson.data.neutral + responseJson.data.drawings, details.url);
                    // Tell content script to unhide image
                },
                function(reason) {
                    console.error("Failed to parse json for reason", reason);
                }
            );
        }
    );
}
