# tensorflow-image-recognition-chrome-extension
Chrome browser extension for using TensorFlow image recognition on web pages

This is a simple test on how to use TensorFlow.js image recognition in Google Chrome extension. This extension is intercepting all image fetch requests made by the browser and pushing them to TensorFlow pretrained ImageNet model (mobilenet_v1_0.25_224) to recognize items in images. The model is downloaded when the extension is started. After that it will start automatically modifying IMG element title (mouse hover text) html attribute to display image URL, original title and prediction results.

It will only run the recognition if width or height of the image is larger than 128px. It fails to update the title sometimes when there is some fancy lazyloading module (or some other js manipulation) used on page or the images are embedded (data:image/png;base64, ...). You can inspect the background page view (on chrome extensions page) to see more information about what is happening behind the scenes.

## How to try it?

```sh
git clone https://github.com/JK0N/tensorflow-image-recognition-chrome-extension.git
```

```sh
cd tensorflow-image-recognition-chrome-extension/
```

```sh
npm i
```

```sh
npm run build
```

- Open Google Chrome extensions page: chrome://extensions/

- Enable developer mode

- Click [LOAD UNPACKED]

- Select tensorflow-image-recognition-chrome-extension/dist/ -folder!

- Hover over images on web pages to display image recognition details.


## Examples

<p>
  <img src="https://raw.githubusercontent.com/JK0N/tensorflow-image-recognition-chrome-extension/master/examples/lion-fish.png" />
  <b>Lion fish</b>
</p>

<p>
  <img src="https://raw.githubusercontent.com/JK0N/tensorflow-image-recognition-chrome-extension/master/examples/hotdog.png" />
  <b>Hot dog</b>
</p>
