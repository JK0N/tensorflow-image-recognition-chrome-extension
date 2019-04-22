# NSFW Image Filter browser extension
Cross browser extension that detects and blurs NSFW images

This extension is experimental. It is usable but it needs some UI improvements and a settings system so that the user can personalize it.

This project uses the [nsfwjs project](https://github.com/infinitered/nsfwjs) and the model from the [nsfw model project](https://github.com/gantman/nsfw_model). The initial extension's structure was based on the [tensorflow-image-recognition-chrome-extension](https://github.com/JK0N/tensorflow-image-recognition-chrome-extension).

Keep in mind that in pages with many images the results will be quite slow.

## Load extension

Download this repo and then load the disc folder as an unpacked extension on your Google Chrome, your Firefox or your Opera. 


## Build and Run

First install the needed npm modules
```
npm i
```

Then build it
```
npm run build
```

Now, you can load the dist folder as an unpacked extension.


## Examples

Example with good results
![example](https://raw.githubusercontent.com/GramThanos/NSFW-Image-Filter-Browser-Extension/master/examples/Screenshot-1.png)

Example with some false positive results
![example](https://raw.githubusercontent.com/GramThanos/NSFW-Image-Filter-Browser-Extension/master/examples/Screenshot-2.png)

