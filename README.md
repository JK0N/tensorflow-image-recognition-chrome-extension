# NSFW Image Filter browser extension
Cross browser extension that detects and blurs NSFW images

**This extension is experimental. It is usable but it needs some UI improvements and a settings system so that the user can personalize it.**

The aim of this extension is to block inapropriate images on the web page using machine learing. By using the [nsfwjs project](https://github.com/infinitered/nsfwjs) and the TensorFlow javascript libray in combination with the [nsfw model](https://github.com/gantman/nsfw_model), we run web images through the trained network and deside if the image should be blocked.

Keep in mind that in pages with many images the results will be quite slow.

## Requirements

Any modern browser that supports the WebExtensions API (so that you can load the extension) and support for WebGL (for the TensorFlow library).

## Load extension

Download this repo and then load the `dist` folder as an unpacked extension on your Google Chrome, your Firefox or your Opera. 


## Build and Run

First install the needed npm modules
```
npm i
```

Then build it
```
npm run build
```

You can then load the dist folder as an unpacked extension.


## Examples

Example with good results
![example](https://raw.githubusercontent.com/GramThanos/NSFW-Image-Filter-Browser-Extension/master/examples/Screenshot-1.png)

Example with some false positive results
![example](https://raw.githubusercontent.com/GramThanos/NSFW-Image-Filter-Browser-Extension/master/examples/Screenshot-2.png)

