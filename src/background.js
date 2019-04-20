import 'babel-polyfill';
import * as nsfwjs from './nsfw_wrapper.js';

var browser = chrome || browser;

const MODEL_PATH = browser.extension.getURL('model/');
const IMG_MIN_WIDTH = 32;
const IMG_MIN_HEIGHT = 32;


class Cache {
	constructor() {
		this.table = {};

		const timeout = 5 * 60 * 1000;
		setInterval(() => {
			this.clean(timeout);
		}, timeout);
	}

	get(id) {
		if (!this.table.hasOwnProperty(id)) {
			return null;
		}
		this.table[id].timestamp = new Date().getTime();
		return this.table[id];
	}

	set(id, data) {
		this.table[id] = {
			id : id,
			data : data,
			timestamp : new Date().getTime()
		};
	}

	clean(timeout) {
		const threshold = new Date().getTime() - timeout;
		for (let id in this.table) {
			if (this.table.hasOwnProperty(id) && this.table[id].timestamp < threshold) {
				delete this.table[id];
			}
		}
	}
}

class NSFW_Processing {

	constructor() {
		this.model = null;
		this.cache = new Cache();

		// Listen for images
		this.addListeners();
		// Load NSFW model
		this.loadModel();
	}

	addListeners() {
		// Listen for images requests
		browser.webRequest.onCompleted.addListener(req => {
			if (req && req.tabId > 0) {
				this.handleImage(req.url, req.tabId);
			}
		}, {urls: ["<all_urls>"], types: ["image"]});

		// Listen for content script requests
		browser.runtime.onMessage.addListener((message, sender) => {
			if (message && message.action === 'NSFW-IMAGE-FOR-ANALYSIS') {
				//console.log('@@@', message.payload, sender.tab.id);
				this.handleImage(message.payload.url, sender.tab.id);
			}
		});
	}

	handleImage(url, tabId) {
		// Ignore if exists
		let meta = this.cache.get(url);
		if (meta && meta.tabs) {
			// If results
			if (meta.analyzed) {
				this.reportImageAnalysis(tabId, meta);
				return;
			}
			// If tab is not on the list
			if (meta.tabs.indexOf(tabId) == -1) {
				meta.tabs.push(tabId);
			}
			return;
		}

		// Save info
		meta = {
			tabs : [tabId],
			url : url,
			analyzed : false,
			predictions : null
		};
		this.cache.set(meta.url, meta);
		this.analyzeImage(meta);
	}

	async loadModel() {
		console.log('Loading model...');
		const startTime = performance.now();
		this.model = await nsfwjs.load(MODEL_PATH);
		const totalTime = Math.floor(performance.now() - startTime);
		console.log(`Model loaded and initialized in ${totalTime}ms...`);
	}

	async analyzeImage(meta) {
		// If model not yet loaded
		if (!this.model) {
			//console.log('Model not loaded yet, delaying...');
			setTimeout(() => {this.analyzeImage(meta);}, 5 * 1000);
			return;
		}

		// Load image
		const img = await this.loadImage(meta.url);
		if (!img) return;

		// Analyze image
		meta.predictions = await this.predict(img);
		if (!meta.predictions) return;
		meta.analyzed = true;

		//console.log('analyzeImage', meta);

		// Report analysis
		var tabs = meta.tabs;
		meta.tabs = [];
		for (let i = tabs.length - 1; i >= 0; i--) {
			this.reportImageAnalysis(tabs[i], meta);
		}
	}

	reportImageAnalysis(tab, meta) {
		//console.log('reportImageAnalysis', tab, meta);
		// Send to tab
		browser.tabs.sendMessage(tab, {
			action: 'NSFW-IMAGE-ANALYSIS-REPORT',
			payload: meta,
		});
	}


	async loadImage(src) {
		return new Promise(resolve => {
			var img = document.createElement('img');
			img.crossOrigin = "anonymous";
			img.onerror = function(e) {
				resolve(null);
			};
			img.onload = function(e) {
				if ((img.height && img.height > IMG_MIN_HEIGHT) || (img.width && img.width > IMG_MIN_WIDTH)) {
					resolve(img);
				}
				// Let's skip all tiny images
				resolve(null);
			}
			img.src = src;
		});
	}

	async predict(imgElement) {
		//console.log('Predicting...');
		//const startTime = performance.now();
		const predictions = await this.model.classify(imgElement);
		//const totalTime = Math.floor(performance.now() - startTime);
		//console.log(`Prediction done in ${totalTime}ms:`, predictions);
		return predictions;
	}
}

var bg = new NSFW_Processing();
