import { addCallbacks } from "./callbacks.mjs";
import { getCurrentTabUrl } from "./common.mjs";
import { loadSiteSettings } from "./load.mjs";

getCurrentTabUrl().then(
    loadSiteSettings
)
addCallbacks();
