const fs = require('fs');
const path = require('path');
const milkdropPresetConverter = require('../dist/milkdrop-preset-converter-node.min');

const args = process.argv.slice(2);

const preset = fs.readFileSync(`${args[0]}/${args[2]}`, 'utf8');
const presetOutput = milkdropPresetConverter.convertPreset(preset);

const presetName = path.basename(`${args[0]}/${args[2]}`);
const presetOutputName = presetName.replace('.milk', '.json');
fs.writeFileSync(`${args[1]}/${presetOutputName}`, JSON.stringify(presetOutput));
