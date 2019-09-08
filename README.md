# Cloudinary in the Middle

We reduce the size of images in websites using Cloudinary.

## What it does

Redirects requests for images to Cloudinary, which then fetches the original image and applies transformations to it (configurable) such as heavily compressing the image, or other effects. This can be automatically enabled/disabled depending on the connection speed reported by the browser.

## How we built it

Browser Extension, implemented in JavaScript using APIs to interface with the browser.

## Challenges we ran into

 - Cross-compatibility issues with Chrome and Firefox
 - Strict security restrictions (which are good) enforced by the browsers

## What we learned

 - Using Cloudinary and how it's API works
 - How to implement a Browser Extension (with Settings Page, Content Script and Background Script)
 - Using the Messaging API for Browser Extensions
 - Using the WebRequest API for Browser Extensions
