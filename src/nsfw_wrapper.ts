import * as tf from '@tensorflow/tfjs'
import { NSFW_CLASSES } from './nsfw_classes'
import * as SuperGif from 'libgif'

interface frameResult {
  index: number
  totalFrames: number
  predictions: Array<Object>
}

interface classifyConfig {
  topk?: number
  onFrame?: (result: frameResult) => {}
  setGifControl?: (gifControl: typeof SuperGif) => {}
}

const BASE_PATH = 'https://s3.amazonaws.com/ir_public/nsfwjs/'
const IMAGE_SIZE = 299

export async function load(base = BASE_PATH) {
  if (tf == null) {
    throw new Error(
      `Cannot find TensorFlow.js. If you are using a <script> tag, please ` +
        `also include @tensorflow/tfjs on the page before using this model.`
    )
  }

  const nsfwnet = new NSFWJS(base)
  await nsfwnet.load()
  return nsfwnet
}

export class NSFWJS {
  public endpoints: string[]

  private path: string
  private model: tf.LayersModel
  private intermediateModels: { [layerName: string]: tf.LayersModel } = {}

  private normalizationOffset: tf.Scalar

  constructor(base: string) {
    this.path = `${base}model.json`
    this.normalizationOffset = tf.scalar(255)
  }

  async load() {
    // this is a Layers Model
    this.model = await tf.loadLayersModel(this.path)
    this.endpoints = this.model.layers.map(l => l.name)

    // Warmup the model.
    const result = tf.tidy(() =>
      this.model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]))
    ) as tf.Tensor
    await result.data()
    result.dispose()
  }

  /**
   * Infers through the model. Optionally takes an endpoint to return an
   * intermediate activation.
   *
   * @param img The image to classify. Can be a tensor or a DOM element image,
   * video, or canvas.
   * @param endpoint The endpoint to infer through. If not defined, returns
   * logits.
   */
  infer(
    img:
      | tf.Tensor3D
      | ImageData
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement,
    endpoint?: string
  ): tf.Tensor {
    if (endpoint != null && this.endpoints.indexOf(endpoint) === -1) {
      throw new Error(
        `Unknown endpoint ${endpoint}. Available endpoints: ` +
          `${this.endpoints}.`
      )
    }

    return tf.tidy(() => {
      if (!(img instanceof tf.Tensor)) {
        img = tf.browser.fromPixels(img)
      }

      // Normalize the image from [0, 255] to [0, 1].
      const normalized = img
        .toFloat()
        .div(this.normalizationOffset) as tf.Tensor3D

      // Resize the image to
      let resized = normalized
      if (img.shape[0] !== IMAGE_SIZE || img.shape[1] !== IMAGE_SIZE) {
        const alignCorners = true
        resized = tf.image.resizeBilinear(
          normalized,
          [IMAGE_SIZE, IMAGE_SIZE],
          alignCorners
        )
      }

      // Reshape to a single-element batch so we can pass it to predict.
      const batched = resized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3])

      let model: tf.LayersModel
      if (endpoint == null) {
        model = this.model
      } else {
        if (this.intermediateModels[endpoint] == null) {
          const layer = this.model.layers.find(l => l.name === endpoint)
          this.intermediateModels[endpoint] = tf.model({
            inputs: this.model.inputs,
            outputs: layer.output
          })
        }
        model = this.intermediateModels[endpoint]
      }

      // return logits
      return model.predict(batched) as tf.Tensor2D
    })
  }

  /**
   * Classifies an image from the 5 classes returning a map of
   * the most likely class names to their probability.
   *
   * @param img The image to classify. Can be a tensor or a DOM element image,
   * video, or canvas.
   * @param topk How many top values to use. Defaults to 5
   */
  async classify(
    img:
      | tf.Tensor3D
      | ImageData
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement,
    topk = 5
  ): Promise<Array<{ className: string; probability: number }>> {
    const logits = this.infer(img) as tf.Tensor2D

    const classes = await getTopKClasses(logits, topk)

    logits.dispose()

    return classes
  }

  /**
   * Classifies a gif from the 5 classes returning a map of
   * the most likely class names to their probability.
   *
   * @param gif The gif to classify. DOM element image
   * @param config param configuration for run
   */
  async classifyGif(
    gif: HTMLImageElement,
    config: classifyConfig = { topk: 5 }
  ): Promise<Array<Array<{ className: string; probability: number }>>> {
    let gifObj = new SuperGif({ gif })
    return new Promise(resolve => {
      gifObj.load(async () => {
        const arrayOfClasses = []
        const gifLength = gifObj.get_length()
        for (let i = 1; i <= gifLength; i++) {
          gifObj.move_to(i)
          const classes = await this.classify(gifObj.get_canvas(), config.topk)
          // Update to onFrame
          if (config.onFrame)
            config.onFrame({
              index: i,
              totalFrames: gifLength,
              predictions: classes
            })
          // Store the goods
          arrayOfClasses.push(classes)
        }
        // save gifObj if needed
        config.setGifControl && config.setGifControl(gifObj);
        // try to clean up
        gifObj = null
        resolve(arrayOfClasses)
      })
    })
  }
}

async function getTopKClasses(
  logits: tf.Tensor2D,
  topK: number
): Promise<Array<{ className: string; probability: number }>> {
  const values = await logits.data()

  const valuesAndIndices = []
  for (let i = 0; i < values.length; i++) {
    valuesAndIndices.push({ value: values[i], index: i })
  }
  valuesAndIndices.sort((a, b) => {
    return b.value - a.value
  })
  const topkValues = new Float32Array(topK)
  const topkIndices = new Int32Array(topK)
  for (let i = 0; i < topK; i++) {
    topkValues[i] = valuesAndIndices[i].value
    topkIndices[i] = valuesAndIndices[i].index
  }

  const topClassesAndProbs = []
  for (let i = 0; i < topkIndices.length; i++) {
    topClassesAndProbs.push({
      className: NSFW_CLASSES[topkIndices[i]],
      probability: topkValues[i]
    })
  }
  return topClassesAndProbs
}
