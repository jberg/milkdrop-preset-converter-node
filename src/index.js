import tmp from 'tmp';
import { writeFileSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import _ from 'lodash';
import milkdropParser from 'milkdrop-eel-parser';
import {
  splitPreset,
  prepareShaderForDX11,
  processDX11ConvertedShader,
  createBasePresetFuns
} from 'milkdrop-preset-utils';
import optimizeEquations from './optimize';

function processShader (shader) {
  if (_.isEmpty(shader)) {
    return '';
  }

  const processedShader = _.replace(shader, 'shader_body', 'xlat_main');
  // processedShader = _.replace(processedShader, /sampler2D/g, 'Texture2D');
  // processedShader = _.replace(processedShader, /sampler3D/g, 'Texture3D');
  // processedShader = _.replace(processedShader, /tex2D/g, 'texture2d.Sample');
  // processedShader = _.replace(processedShader, /tex3D/g, 'texture3d.Sample');

  return processedShader;
}

function optimizePresetEquations (preset) {
  const presetMap = Object.assign({}, preset);
  /* eslint-disable max-len */
  presetMap.init_eqs_str = presetMap.init_eqs_str ? optimizeEquations(presetMap.init_eqs_str) : '';
  presetMap.frame_eqs_str = presetMap.frame_eqs_str ? optimizeEquations(presetMap.frame_eqs_str) : '';
  presetMap.pixel_eqs_str = presetMap.pixel_eqs_str ? optimizeEquations(presetMap.pixel_eqs_str) : '';

  for (let i = 0; i < presetMap.shapes.length; i++) {
    if (presetMap.shapes[i].baseVals.enabled !== 0) {
      presetMap.shapes[i].init_eqs_str = presetMap.shapes[i].init_eqs_str ? optimizeEquations(presetMap.shapes[i].init_eqs_str) : '';
      presetMap.shapes[i].frame_eqs_str = presetMap.shapes[i].frame_eqs_str ? optimizeEquations(presetMap.shapes[i].frame_eqs_str) : '';
    }
  }

  for (let i = 0; i < presetMap.waves.length; i++) {
    if (presetMap.waves[i].baseVals.enabled !== 0) {
      presetMap.waves[i].init_eqs_str = presetMap.waves[i].init_eqs_str ? optimizeEquations(presetMap.waves[i].init_eqs_str) : '';
      presetMap.waves[i].frame_eqs_str = presetMap.waves[i].frame_eqs_str ? optimizeEquations(presetMap.waves[i].frame_eqs_str) : '';
      presetMap.waves[i].point_eqs_str = presetMap.waves[i].point_eqs_str ? optimizeEquations(presetMap.waves[i].point_eqs_str) : '';
    }
  }
  /* eslint-enable max-len */

  return presetMap;
}

function convertPresetShader (shader) {
  const processedShader = processShader(prepareShaderForDX11(shader));
  if (!_.isEmpty(processedShader)) {
    const fileInput = tmp.fileSync();
    const fileOutput = tmp.fileSync();
    writeFileSync(fileInput.fd, processedShader);
    execFileSync(`${process.cwd()}/ShaderConductorCmd`, [
      '-E', 'xlat_main', '-I', fileInput.name, '-O', fileOutput.name, '-T', 'essl', '-S', 'ps', '-V', '300'
    ]);
    const convertedShader = readFileSync(fileOutput.fd).toString();
    return convertedShader;
  }

  return '';
}

export function convertPresetMap (presetParts, optimize = true) {
  const parsedPreset = milkdropParser.convert_preset_wave_and_shape(presetParts.presetVersion,
                                                                    presetParts.presetInit,
                                                                    presetParts.perFrame,
                                                                    presetParts.perVertex,
                                                                    presetParts.shapes,
                                                                    presetParts.waves);
  let presetMap = createBasePresetFuns(parsedPreset,
                                       presetParts.shapes,
                                       presetParts.waves);
  if (optimize) {
    presetMap = optimizePresetEquations(presetMap);
  }

  const warpShader = convertPresetShader(presetParts.warp);
  const compShader = convertPresetShader(presetParts.comp);

  const presetOutput = Object.assign({ baseVals: presetParts.baseVals }, presetMap, {
    warp: processDX11ConvertedShader(warpShader),
    comp: processDX11ConvertedShader(compShader),
  });

  if ((_.isEmpty(presetOutput.warp) && !_.isEmpty(presetParts.warp)) ||
      (_.isEmpty(presetOutput.comp) && !_.isEmpty(presetParts.comp))) {
    throw new Error('error translating shaders');
  }

  return presetOutput;
}

export function convertPreset (preset, presetName, optimize = false) {
  let mainPresetText = _.split(preset, '[preset00]')[1];
  mainPresetText = _.replace(mainPresetText, /\r\n/g, '\n');
  const presetParts = splitPreset(mainPresetText);
  const presetMap = convertPresetMap(presetParts, optimize);
  presetMap.name = presetName;
  return presetMap;
}
