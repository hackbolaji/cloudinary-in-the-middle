const CLOUDINARY_CLOUD_NAME = 'cext'
const PREFIX = 'https://res.cloudinary.com/' + CLOUDINARY_CLOUD_NAME + '/image/fetch/f_auto,q_auto/'

browser.webRequest.onBeforeRequest.addListener((details) => {
	const { url } = details

	// Prevent looping!
	if (url.startsWith(PREFIX)) {
		return
	}

	if (url.startsWith('data') || url === '') {
		return
	}

	// TODO: Ideally check HTTP Accept header, but we are pre-request
	// so we don't really know what the browser will use for Accept.
	// Alternateively, use "onBeforeSendHeaders" but not clear if
	// redirecting is possible that late...
	// See:
	//  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders
	//  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
	if (url.endsWith('.svg')) {
		return
	}

	return { "redirectUrl": PREFIX + url }
	},
	{urls: ["http://*/*", "https://*/*"],
	// For details on types, see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
	types: ["image", "object", "imageset"]},
	[ "blocking" ]
);
