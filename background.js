// For details on types, see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
const TYPES = ['image', 'object']

if (!IS_CHROME) {
	TYPES.push('imageset')
}

const FILTER = {
	urls: ['<all_urls>'],
	types: TYPES,
}

// TODO
function haveNetwork() {
	return false
/*
	try {
		return (
			NetworkInformation !== undefined &&
			navigator !== undefined &&
			navigator.connection !== undefined
		)
	} catch (e) {
		return false
	}
*/
}

// Sentinel value to represent that a WebRequest should carry on without
// any modifications/redirects. See
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/BlockingResponse
const CARRY_ON = {}

async function getConfig(name) {
	const value = await browser.storage.sync.get(name)
	return value !== undefined ? value[name] : undefined
}

var registeredListener = undefined

function disable() {
	if (registeredListener !== undefined) {
		browser.webRequest.onBeforeRequest.removeListener(registeredListener)
	}
	registeredListener = undefined
}

async function enable() {
	if (registeredListener !== undefined) {
		return
	}
	const cloudName = await getConfig('CLOUDINARY_CLOUD_NAME')
	const transformation = await getConfig('CLOUDINARY_TRANSFORMATION')

	console.log('Enabling MITM')
	registeredListener = listener({ cloudName, transformation })

	browser.webRequest.onBeforeRequest.addListener(registeredListener, FILTER, [
		'blocking'
	])
}

function handleMessage(request, sender, sendResponse) {
	disable()
	enable()
}

function controlByDownlink() {
	// See
	// https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/downlink
	const downLink = NetworkInformation.downlink
	if (downlink < 4) {
		enable()
	} else {
		disable()
	}
}

function init() {
	enable()
	browser.runtime.onMessage.addListener(handleMessage)

	if (haveNetwork()) {
		navigator.connection.onchange = controlByDownlink
		window.setInterval(controlByDownlink, 10000)
	}
}

function listener(config) {
	const { cloudName, transformation } = config
	console.log(cloudName, transformation)
	return details => {
		const { url } = details

		if (url === '' || url.startsWith('data')) {
			return CARRY_ON
		}

		// TODO: Ideally check HTTP Accept header, but we are pre-request
		// so we don't really know what the browser will use for Accept.
		// Alternateively, use "onBeforeSendHeaders" but not clear if
		// redirecting is possible that late...
		// See:
		//  - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders
		//  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept
		if (url.endsWith('.svg')) {
			return CARRY_ON
		}

		const prefix =
			'https://res.cloudinary.com/' +
			cloudName +
			'/image/fetch/' +
			transformation +
			'/'

		// Prevent looping!
		if (url.startsWith(prefix)) {
			return CARRY_ON
		}

		const redirectUrl = prefix + url
		console.log(url, '->', redirectUrl)
		return { redirectUrl }
	}
}

browser.webRequest.onAuthRequired.addListener(
	() => {
		console.log('authRequired', arguments)
	},
	FILTER,
	['blocking']
)

init()
