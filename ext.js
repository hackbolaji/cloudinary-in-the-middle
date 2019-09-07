document.body.style.border = "5px solid blue";
console.log('Hello!')

const PREFIX = 'https://res.cloudinary.com/cext/image/fetch/f_auto,q_auto/'

for (const img of document.getElementsByTagName('img')) {
	//console.log('Replacing URL', img)
	img.src = PREFIX + img.src
}
