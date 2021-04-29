
// Get browser API
var browser = chrome || browser;

// 
var nsfw = {

	// Initialize the extension
	init : function() {
		this.updateTimeout = null;
		this.data = {};
		this.addListener();

		// Add style on page
		window.addEventListener('DOMContentLoaded', () => {
			// Add svg
			let filters = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			filters.setAttribute('style', 'position: absolute; top: -99999px');
			// Red : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAALAgMAAAAcrnVjAAAACVBMVEUAAAD/AAD///9nGWQeAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+MEFhUCN0yQyxkAAAA8SURBVAjXY1gFBgsYpoaCQALDLDA/gWHGooYGpUUgWqtrEYhWaupapASkm1Y0LGgCiTOBxWHqYfqh5gEA5x4oFe15PC8AAAAASUVORK5CYII=
			// Black : data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAALAQMAAABbDg+zAAAABlBMVEUAAAD///+l2Z/dAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAADRJREFUCNdj+P///wGGBgYGB4b9//87MKztiAUS1XcdGJbOvurAsPLFSSBX+i5UFqwOpAMAyvIZ4LH0uDMAAAAASUVORK5CYII=
			filters.innerHTML = '\
				<filter id="nsfw-filter-blocked" x="0" y="0">\
					<feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur"/>\
					<feImage xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAALAgMAAAAcrnVjAAAACVBMVEUAAAD/AAD///9nGWQeAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+MEFhUCN0yQyxkAAAA8SURBVAjXY1gFBgsYpoaCQALDLDA/gWHGooYGpUUgWqtrEYhWaupapASkm1Y0LGgCiTOBxWHqYfqh5gEA5x4oFe15PC8AAAAASUVORK5CYII=" x="20" y="20" width="26" height="11" result="logo"/>\
					<feMerge x="0%" y="0%" result="result">\
						<feMergeNode in="blur"/>\
						<feMergeNode in="logo"/>\
					</feMerge>\
				</filter>\
				<filter id="nsfw-filter-analyzing" x="0" y="0">\
					<feGaussianBlur in="SourceGraphic" stdDeviation="25" result="blur"/>\
					<feImage xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAALAQMAAADhrYfTAAAABlBMVEUAAAD///+l2Z/dAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAENJREFUCNdj+A8G/xgaGECAiWE/mP+LYXPO3Qvdzr8Y1mbHXr8dD6S143bfDP7FsNAjvvZWNEjcuaDbaRVcPUw/1DwAd5swvnCFq9QAAAAASUVORK5CYII=" x="20" y="20" width="55" height="11" result="logo"/>\
					<feMerge x="0%" y="0%" result="result">\
						<feMergeNode in="blur"/>\
						<feMergeNode in="logo"/>\
					</feMerge>\
				</filter>\
			';
			document.head.appendChild(filters);

			let style = document.createElement('style');
			style.type = 'text/css';
			style.innerHTML = "\
				.nsfw-filter-blocked  {\
					filter: url(#nsfw-filter-blocked);\
				}\
				.nsfw-filter-analyzing  {\
					filter: url(#nsfw-filter-analyzing);\
				}\
			";
			document.head.appendChild(style);
		}, false);
	},

	addListener : function() {
		browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			if (message && message.action === 'NSFW-IMAGE-ANALYSIS-REPORT') {
				let url = message.payload.url;
				if (this.data.hasOwnProperty(url) && this.data[url].analyzed) return;
				this.data[url] = {
					analyzed : true,
					block : (this.shouldBlock(message.payload.predictions)) ? true : false
				};
				clearTimeout(this.updateTimeout);
				this.updateTimeout = setTimeout(() => {this.updatePageImages();}, 100);
			}
		});
		window.addEventListener('load', () => {
			setInterval(() => {
				this.updatePageImages();
			}, 1000);
			this.updatePageImages();
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
		// Get all images
		let images = document.getElementsByTagName('img');
		// For each image
		for (let i = 0; i < images.length; i++) {
			// Get image url
			let url = images[i].src;
			// If url not empty
			if (url && url.length > 0) {

				// If we have handled the image
				if (this.data.hasOwnProperty(url)) {

					// If image should be blocked
					if (this.data[url].block) {
						if (images[i].classList.contains("nsfw-filter-analyzing")) {
							images[i].classList.replace("nsfw-filter-analyzing", "nsfw-filter-blocked");
						}
						else {
							images[i].classList.add("nsfw-filter-blocked");
						}
					}
					// If image was analized
					else if (this.data[url].analyzed) {
						images[i].classList.remove("nsfw-filter-analyzing");
					}

				}

				// Send image for analysis
				else {

					// Log image
					this.data[url] = {analyzed : false};
					// Display as analysing
					images[i].classList.add("nsfw-filter-analyzing");
					// Send image to the backend
					browser.extension.sendMessage({
						action: 'NSFW-IMAGE-FOR-ANALYSIS',
						payload: {url : url},
					});

				}

			}
		}
	}
};

nsfw.init();
