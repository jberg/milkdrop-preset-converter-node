const fs = require('fs');
const path = require('path');
const milkdropPresetConverter = require('../dist/milkdrop-preset-converter-node');

const args = process.argv.slice(2);
const presetPath = `${args[0]}/${args[2]}`;
const presetName = path.basename(presetPath);
const presetNameNoExt = presetName.substring(0, presetName.length - 5);
const presetOutputName = `${presetNameNoExt}.json`;
const outputPath = `${args[1]}/${presetOutputName}`;

if (!fs.existsSync(outputPath)) {
  try {
    const preset = fs.readFileSync(presetPath, 'utf8');
    const presetOutput = milkdropPresetConverter.convertPreset(preset, presetNameNoExt);
    fs.writeFileSync(outputPath, JSON.stringify(presetOutput));
  } catch (e) {
    console.error('Failed converting, ', presetName);
    console.error(e);
  }
} else {
  console.log('Skipping ', presetName);
}
