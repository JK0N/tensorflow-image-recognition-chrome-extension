var imageMeta = {};

const setImageTitles = () => {
  const images = document.getElementsByTagName('img');
  const keys = Object.keys(imageMeta);
  for(u = 0; u < keys.length; u++) {
    var url = keys[u];
    var meta = imageMeta[url];
    for (i = 0; i < images.length; i++) {
      var img = images[i];
      if (img.src === meta.url) {
        img.title = img.src + `:\n\n${img.title}\n\n` + JSON.stringify(meta.predictions);
        delete keys[u];
        delete imageMeta[url];
      }
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.payload && message.action === 'IMAGE_PROCESSED') {
    const { payload } = message;
    if (payload && payload.url) {
      imageMeta[payload.url] = payload;
      setImageTitles();
    }
  }
});

window.addEventListener('load', setImageTitles, false);
