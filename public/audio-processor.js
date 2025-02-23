class AudioRecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    this.port.postMessage(new Float32Array(inputs[0][0]));
    return true;
  }
}

registerProcessor('audio-recorder', AudioRecorderProcessor);
