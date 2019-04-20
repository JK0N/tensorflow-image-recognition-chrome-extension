"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var tf = require("@tensorflow/tfjs");
var nsfw_classes_1 = require("./nsfw_classes");
var SuperGif = require("libgif");
var BASE_PATH = 'https://s3.amazonaws.com/ir_public/nsfwjs/';
var IMAGE_SIZE = 299;
function load(base) {
    if (base === void 0) { base = BASE_PATH; }
    return __awaiter(this, void 0, void 0, function () {
        var nsfwnet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (tf == null) {
                        throw new Error("Cannot find TensorFlow.js. If you are using a <script> tag, please " +
                            "also include @tensorflow/tfjs on the page before using this model.");
                    }
                    nsfwnet = new NSFWJS(base);
                    return [4, nsfwnet.load()];
                case 1:
                    _a.sent();
                    return [2, nsfwnet];
            }
        });
    });
}
exports.load = load;
var NSFWJS = (function () {
    function NSFWJS(base) {
        this.intermediateModels = {};
        this.path = base + "model.json";
        this.normalizationOffset = tf.scalar(255);
    }
    NSFWJS.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, result;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4, tf.loadLayersModel(this.path)];
                    case 1:
                        _a.model = _b.sent();
                        this.endpoints = this.model.layers.map(function (l) { return l.name; });
                        result = tf.tidy(function () {
                            return _this.model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]));
                        });
                        return [4, result.data()];
                    case 2:
                        _b.sent();
                        result.dispose();
                        return [2];
                }
            });
        });
    };
    NSFWJS.prototype.infer = function (img, endpoint) {
        var _this = this;
        if (endpoint != null && this.endpoints.indexOf(endpoint) === -1) {
            throw new Error("Unknown endpoint " + endpoint + ". Available endpoints: " +
                (this.endpoints + "."));
        }
        return tf.tidy(function () {
            if (!(img instanceof tf.Tensor)) {
                img = tf.browser.fromPixels(img);
            }
            var normalized = img
                .toFloat()
                .div(_this.normalizationOffset);
            var resized = normalized;
            if (img.shape[0] !== IMAGE_SIZE || img.shape[1] !== IMAGE_SIZE) {
                var alignCorners = true;
                resized = tf.image.resizeBilinear(normalized, [IMAGE_SIZE, IMAGE_SIZE], alignCorners);
            }
            var batched = resized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3]);
            var model;
            if (endpoint == null) {
                model = _this.model;
            }
            else {
                if (_this.intermediateModels[endpoint] == null) {
                    var layer = _this.model.layers.find(function (l) { return l.name === endpoint; });
                    _this.intermediateModels[endpoint] = tf.model({
                        inputs: _this.model.inputs,
                        outputs: layer.output
                    });
                }
                model = _this.intermediateModels[endpoint];
            }
            return model.predict(batched);
        });
    };
    NSFWJS.prototype.classify = function (img, topk) {
        if (topk === void 0) { topk = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var logits, classes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logits = this.infer(img);
                        return [4, getTopKClasses(logits, topk)];
                    case 1:
                        classes = _a.sent();
                        logits.dispose();
                        return [2, classes];
                }
            });
        });
    };
    NSFWJS.prototype.classifyGif = function (gif, config) {
        if (config === void 0) { config = { topk: 5 }; }
        return __awaiter(this, void 0, void 0, function () {
            var gifObj;
            var _this = this;
            return __generator(this, function (_a) {
                gifObj = new SuperGif({ gif: gif });
                return [2, new Promise(function (resolve) {
                        gifObj.load(function () { return __awaiter(_this, void 0, void 0, function () {
                            var arrayOfClasses, gifLength, i, classes;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        arrayOfClasses = [];
                                        gifLength = gifObj.get_length();
                                        i = 1;
                                        _a.label = 1;
                                    case 1:
                                        if (!(i <= gifLength)) return [3, 4];
                                        gifObj.move_to(i);
                                        return [4, this.classify(gifObj.get_canvas(), config.topk)];
                                    case 2:
                                        classes = _a.sent();
                                        if (config.onFrame)
                                            config.onFrame({
                                                index: i,
                                                totalFrames: gifLength,
                                                predictions: classes
                                            });
                                        arrayOfClasses.push(classes);
                                        _a.label = 3;
                                    case 3:
                                        i++;
                                        return [3, 1];
                                    case 4:
                                        gifObj = null;
                                        resolve(arrayOfClasses);
                                        return [2];
                                }
                            });
                        }); });
                    })];
            });
        });
    };
    return NSFWJS;
}());
exports.NSFWJS = NSFWJS;
function getTopKClasses(logits, topK) {
    return __awaiter(this, void 0, void 0, function () {
        var values, valuesAndIndices, i, topkValues, topkIndices, i, topClassesAndProbs, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, logits.data()];
                case 1:
                    values = _a.sent();
                    valuesAndIndices = [];
                    for (i = 0; i < values.length; i++) {
                        valuesAndIndices.push({ value: values[i], index: i });
                    }
                    valuesAndIndices.sort(function (a, b) {
                        return b.value - a.value;
                    });
                    topkValues = new Float32Array(topK);
                    topkIndices = new Int32Array(topK);
                    for (i = 0; i < topK; i++) {
                        topkValues[i] = valuesAndIndices[i].value;
                        topkIndices[i] = valuesAndIndices[i].index;
                    }
                    topClassesAndProbs = [];
                    for (i = 0; i < topkIndices.length; i++) {
                        topClassesAndProbs.push({
                            className: nsfw_classes_1.NSFW_CLASSES[topkIndices[i]],
                            probability: topkValues[i]
                        });
                    }
                    return [2, topClassesAndProbs];
            }
        });
    });
}
//# sourceMappingURL=index.js.map