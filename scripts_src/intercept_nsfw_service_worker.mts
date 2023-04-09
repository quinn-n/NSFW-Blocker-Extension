import { Cache } from "./cache.mjs";

namespace NSFWServiceWorker {

    addMessageListener();

    function addMessageListener() {
        chrome.runtime.onMessage.addListener(
            function(message: string, sender, sendResponse) {
                shouldBlockImage(message).then(
                    function(value) {
                        sendResponse(value)
                    }
                );
                return true;
            }
        );
    }


    // Returns a promise which resolves to a boolean correlating to whether or not an image should be displayed
    function shouldBlockImage(url: string) {
        const p = new Promise<boolean>(function(resolve, reject) {
            const thresholdPromise = getRuleForUrl(url);
            // Get safe value from server
            getImageNSFWData(url).then(
                function(data) {
                    if (data === undefined) {
                        console.log("got undefined data for url", url, "assuming safe non-image");
                        resolve(false);
                        return;
                    }
                    const safeValue = data.drawings + data.neutral;
                    thresholdPromise.then(
                        function(rule) {
                            const [ruleUrl, safeThreshold] = rule;
                            resolve(safeValue < safeThreshold);
                        }
                    )
                },
                (reason) => reject(reason)
            );
        });
        return p;
    }


    // Returns a promise which resolves to a dict containing nsfw information from the server
    const getImageNSFWData = Cache.asyncCache<string, NSFWResponseData>(30 * 60)(
        (url: string) => {
            const requestUrl = "https://youtubenotifier.com:8000/detect";
            // Get safe value from server
            const p = new Promise<NSFWResponseData>(function(resolve, reject) {
                const headers = new Headers({"url": url});
                fetch(requestUrl, {headers}).then(
                    function(response) {
                        if (response.status !== 200) {
                            reject("Got non-200 response from server " + String(response.status) + " for url " + String(url));
                        }
                        response.json().then(
                            (responseJson: NSFWRawResponseData) => resolve(responseJson.data),
                            (reason) => reject("Failed to parse JSON for reason" + String(reason))
                        );
                    }
                );
            });
            return p;
        }
    );


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
};
