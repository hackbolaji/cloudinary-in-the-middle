if (browser === undefined) {
	browser = require('webextension-polyfill');
}

const OPTIONS = [
	{ id: 'CLOUDINARY_CLOUD_NAME', defaultValue: 'cext' },
	{ id: 'CLOUDINARY_TRANSFORMATION', defaultValue: 'f_auto,q_auto' },
]

function setConfigById(id) {
	const node = document.querySelector('#' + id)
	const { value } = node
	console.log(value)
	const setting = {}
	setting[id] = value
	return browser.storage.sync.set(setting)
}

async function saveOptions(e) {
	e.preventDefault()
	for (const x of OPTIONS) {
		await setConfigById(x.id)
	}
	const page = browser.extension.getBackgroundPage()
	if (page != undefined && page != null) {
		console.log('Rebooting...')
		page.disable()
		page.enable()
	} else {
		console.log('Could not get background page.')
		browser.runtime.sendMessage({})
	}
}

async function restoreOption(id, defaultValue) {
	const value = await browser.storage.sync.get(id)
	const restoredValue = value === undefined ? defaultValue : value[id]
	document.querySelector('#' + id).value = restoredValue
	console.log('Restoring', id, 'to', restoredValue)
}

function restoreOptions() {
	OPTIONS.forEach(x => restoreOption(x.id, x.defaultValue))
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.querySelector('form').addEventListener('submit', saveOptions)
