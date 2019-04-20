# NSFW Image Filter browser extension
Cross browser extension that detects and blurs NSFW images

This extension uses the [nsfwjs project](https://github.com/infinitered/nsfwjs) and the model from the [nsfw model project](https://github.com/gantman/nsfw_model). The extension structure was based on the [tensorflow-image-recognition-chrome-extension](https://github.com/JK0N/tensorflow-image-recognition-chrome-extension).

The extension right now runs quite slow on pages with many pages.

## Run

First install the needed npm modules
```
npm i
```

Then build it
```
npm run build
```


## Examples

Good filter example
![example](https://raw.githubusercontent.com/GramThanos/NSFW-Image-Filter-Browser-Extension/master/examples/Screenshot-2.png)

False filter example
![example](https://raw.githubusercontent.com/GramThanos/NSFW-Image-Filter-Browser-Extension/master/examples/Screenshot-5.png)

