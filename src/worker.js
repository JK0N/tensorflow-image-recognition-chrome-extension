import 'babel-polyfill';
import * as nsfwjs from './nsfw_wrapper.js';
import * as tf from '@tensorflow/tfjs'

self.HTMLImageElement = function(){};
self.HTMLCanvasElement = function(){};
self.HTMLVideoElement = function(){};

self.model_path = null;
self.model = null;

var init = function() {
	//tf.setBackend('cpu');
	nsfwjs.load(self.model_path).then((model) => {
		self.model = model;
		self.postMessage({action:'initialized'});
	});
}

var classify = function(id, img) {
	self.model.classify(img).then((predictions) => {
		self.postMessage({
			action : 'result',
			data : {
				id : id,
				predictions : predictions
			}
		});
	})
}

// Listen messages
self.addEventListener('message', function(e) {
	if (!e.data || !e.data.action) return;
	switch(e.data.action) {

		case 'init':
			self.model_path = e.data.data;
			init();
			break;

		case 'job':
			classify(e.data.data.id, tf.tensor(e.data.data.img.data, e.data.data.img.shape, e.data.data.img.dtype));
			break;

	}
}, false);
