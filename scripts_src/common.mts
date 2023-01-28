
// Returns a promise with the current tab's url
function getCurrentTabUrl() {
    const p = new Promise<string>(
        function(resolve, reject) {
            chrome.tabs.query({active: true, currentWindow: true}).then(
                function([tab]) {
                    if (tab.url === undefined) {
                        reject("Tab url is undefined.");
                        return;
                    }
                    const url = new URL(tab.url);
                    resolve(url.origin);
                },
                reject,
            );
        }
    );
    return p;
}

export {getCurrentTabUrl};
