const PREFIX = 'https://res.cloudinary.com/cext/image/fetch/f_auto,q_auto/'

browser.webRequest.onBeforeRequest.addListener(function(details) {
	try{
		return { "redirectUrl": PREFIX + details.url }
	} catch(err){
		console.log("e: "+err);
	}
}, {urls: ["http://*/*", "https://*/*"], types: ["image", "object"]}, ["blocking"]);
