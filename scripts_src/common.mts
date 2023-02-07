
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

// Gets an element by class name. Returns undefined if the element does not exist.
function getElementByClassName(div: HTMLDivElement, className: string) {
    const element = div.getElementsByClassName(className)[0];
    if (element === undefined) {
        console.error("got undefined element", className, "in", div);
    }
    return element;
}

export {getCurrentTabUrl, getElementByClassName};
