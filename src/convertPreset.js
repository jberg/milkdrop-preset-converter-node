const fs = require('fs');
const path = require('path');
const milkdropPresetConverter = require('../dist/milkdrop-preset-converter-node.min');

const args = process.argv.slice(2);
const presetPath = `${args[0]}/${args[2]}`;
const presetName = path.basename(presetPath);
const presetOutputName = presetName.replace('.milk', '.json');
const outputPath = `${args[1]}/${presetOutputName}`;

if (!fs.existsSync(outputPath)) {
  const preset = fs.readFileSync(presetPath, 'utf8');
  const presetOutput = milkdropPresetConverter.convertPreset(preset);
  fs.writeFileSync(outputPath, JSON.stringify(presetOutput));
} else {
  console.log('Skipping ', presetName);
}
