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
		
		function stringToArrayBuffer(str) {
			var buf = new ArrayBuffer(str.length);
			var bufView = new Uint8Array(buf);

			for (var i=0, strLen=str.length; i<strLen; i++) {
				bufView[i] = str.charCodeAt(i);
			}

			return buf;
		}
		
		function getImageType(encoded) {
			var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}


			// Decode the string
			var decoded = Base64.decode(encoded);
			console.log(decoded);

			// if the file extension is unknown
			var extension = undefined;
			// do something like this
			var lowerCase = decoded.toLowerCase();
			if (lowerCase.indexOf("jfif") !== -1) extension = "jepg"
			else if (lowerCase.indexOf("png") !== -1) extension = "png"
			else if (lowerCase.indexOf("jpg") !== -1 || lowerCase.indexOf("jpeg") !== -1)
				extension = "jepg"
			else extension = "tiff";
			
			return extension;
		}

		const redirectUrl = prefix + url;
		console.log('trying redirect: ', url, '->', redirectUrl);
		var xmlHttp = new XMLHttpRequest();
		var r = {obj:{}};
		xmlHttp.onreadystatechange=function(){
			if (xmlHttp.readyState==4 && xmlHttp.status==200) {
				console.log('redirect successfull, sending data as string.');
				console.log(xmlHttp);
				const codes = new Uint8Array(stringToArrayBuffer(xmlHttp.response));
				const blob = new Blob([codes])
				console.log(blob);
				
				const urlCreator = window.URL || window.webkitURL;
				const imageUrl = urlCreator.createObjectURL(blob);
				console.log(imageUrl);
				r.obj = { "redirectUrl": imageUrl };
			} else if (xmlHttp.status >=400){
				console.log('redirect failed, downloading the real url');
				r.obj = {"redirectUrl": url };
			} else if (xmlHttp.status > 0){
				console.log(xmlHttp.status);
			}
		}
		xmlHttp.open('GET', redirectUrl, false);
		xmlHttp.send(null);

		const result = r.obj;
		console.log(result)
		return result
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
