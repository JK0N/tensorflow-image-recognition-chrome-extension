
var browser = chrome || browser;

var nsfw = {

	init : function() {
		this.updateTimeout = null;
		this.data = {};
		this.addListener();
	},

	addListener : function() {
		browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			if (message && message.action === 'NSFW-IMAGE-ANALYSIS-REPORT') {
				let url = message.payload.url;
				if (this.data.hasOwnProperty(url)) return;
				this.data[url] = {
					url : url,
					patched : false,
					predictions : message.payload.predictions,
					block : (this.shouldBlock(message.payload.predictions)) ? true : false
				};
				clearTimeout(this.updateTimeout);
				this.updateTimeout = setTimeout(() => {this.updatePageImages();}, 100);
			}
		});
		window.addEventListener('load', () => {
			this.updatePageImages();
			this.getPageImages();
		}, false);
	},

	shouldBlock : function(predictions) {
		var selected = predictions[0];
		for (let i = 1; i < predictions.length; i++) {
			if (selected.probability < predictions[i].probability) {
				selected = predictions[i];
			}
		}

		switch(selected.className) {
			case 'Porn':
			case 'Sexy':
			case 'Hentai':
				return true;
			case 'Neutral':
			case 'Drawing':
			default:
				return false;
		}

		if (selected.Porn > 0.9 || analysis.Sexy > 0.9 || analysis.Hentai > 0.9) {
			return true;
		}
		return false;
	},

	updatePageImages : function() {
		let images = document.getElementsByTagName('img');
		for (let i = 0; i < images.length; i++) {
			let url = images[i].src;
			if (url && url.length > 0 && this.data.hasOwnProperty(url) && !this.data[url].patched) {
				//images[i].title = url + ':\n\n' + JSON.stringify(this.data[url].predictions);
				//console.log(this.data[url]);
				this.data[url].patched = true;
				if (this.data[url].block) {
					images[i].style.filter = 'blur(25px)';
				}
			}
		}
	},

	getPageImages : function() {
		let images = document.getElementsByTagName('img');
		for (let i = 0; i < images.length; i++) {
			let url = images[i].src;
			if (url && url.length > 0 && !this.data.hasOwnProperty(url)) {
				browser.extension.sendMessage({
					action: 'NSFW-IMAGE-FOR-ANALYSIS',
					payload: {url : url},
				});
			}
		}
	}
};

nsfw.init();
