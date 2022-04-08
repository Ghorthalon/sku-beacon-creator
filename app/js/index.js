import { DegreesToVector, StatusLog, bufferToWave} from "./funcs.js";
const { writeFileSync, mkdirSync, fstat} = require("fs");

const filename = "beacon9";
const maxDistance = -30;
const angleStep = 5;




document.getElementById("start-btn").addEventListener("click", startConversion);
StatusLog(`App ready. Waiting for start.`);

async function startConversion() {
    const context = new OfflineAudioContext(2, 1 * 48000, 48000);
    StatusLog(`Starting...`);
    const file = await fetch(`input/${filename}.wav`);
    const data = await file.arrayBuffer();
    const decoded = await context.decodeAudioData(data);
    mkdirSync(`${__dirname}/output/${filename}`);
    for (let i = -180; i <= 180; i += angleStep) {
        for (let j = 0; j >= maxDistance; j--) {
            StatusLog(`Creating file for Angle ${i} at volume ${j}`);
            const vec = DegreesToVector(i);
            const context = new OfflineAudioContext(2, 0.1 * 48000, 48000);

            const listener = context.listener;
            listener.setOrientation(vec[0], vec[1], vec[2], vec[3], vec[4], vec[5]);
            const gain = context.createGain();
            gain.connect(context.destination);
            const volume = Math.abs(j) / Math.abs(maxDistance);
            
            let actualVolume = 1 - volume;
            if (actualVolume < 0.1) actualVolume = 0.1;
            gain.gain.setValueAtTime(actualVolume, 0);
            const panner = context.createPanner();
            panner.connect(gain);
            panner.setPosition(0, 1, 0);
            panner.panningModel = "HRTF";
            const source = context.createBufferSource();
            source.buffer = decoded;
            source.connect(panner);
            source.start(0);
            const res = await context.startRendering();
            const blob = bufferToWave(res, context.length);
            const array = new Int8Array(await blob.arrayBuffer());

            writeFileSync(`${__dirname}/output/${filename}/${filename};${i};${Math.abs(j)}.wav`, array);
        }
    }
    StatusLog(`Rendering finished.`);
}