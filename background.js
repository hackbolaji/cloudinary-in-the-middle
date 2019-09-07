const CLOUDINARY_CLOUD_NAME = 'cext'
const PREFIX = 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME + '/image/fetch/f_auto,q_auto/'

browser.webRequest.onBeforeRequest.addListener(function(details) {
	return new Promise(function(resolve, reject) {
	if (details.url.startsWith('data')) {
		console.log('Not doing', details.url)
		resolve(undefined)
		return
	}
	if (details.url.startsWith(PREFIX)) {
		resolve(undefined)
		return
	}

	// TODO: Ideally check HTTP Accept header, but we are pre-request
	// so we don't really know what the browser will use for Accept.
	// Alternateively, use "onBeforeSendHeaders" but not clear if
	// redirecting is possible that late...
	// See:
	//  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders
	//  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
	if (details.url.endsWith('.svg')) {
		resolve(undefined)
		return
	}

	console.log(details)

	try {
		//console.log("Redirecting", details)
		resolve({ "redirectUrl": PREFIX + details.url })
		return
	} catch (err) {
		console.log("e: "+err);
		reject(err)
		return
	}
	})
},
	{urls: ["http://*/*", "https://*/*"],
	// For details on types, see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
	types: ["image", "object", "imageset"]},
);
