import _ from 'lodash';
import { convertHLSLString } from 'milkdrop-shader-converter';
import milkdropParser from 'milkdrop-eel-parser';
import {
  splitPreset,
  prepareShader,
  processOptimizedShader,
  createBasePresetFuns
} from 'milkdrop-preset-utils';
import optimizeEquations from './optimize';

function processShader (shader) {
  if (_.isEmpty(shader)) {
    return '';
  }

  const processedShader = _.replace(shader, 'shader_body', 'xlat_main');
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

export function convertPresetShader (shader) {
  const processedShader = processShader(prepareShader(shader));
  if (!_.isEmpty(processedShader)) {
    const convertedShader = convertHLSLString(processedShader) || '';
    return convertedShader.toString();
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
    warp: processOptimizedShader(warpShader),
    comp: processOptimizedShader(compShader),
  });

  if ((_.isEmpty(presetOutput.warp) && !_.isEmpty(presetParts.warp)) ||
      (_.isEmpty(presetOutput.comp) && !_.isEmpty(presetParts.comp))) {
    throw new Error('error translating shaders');
  }

  return presetOutput;
}

export function convertPreset (preset, optimize = true) {
  let mainPresetText = _.split(preset, '[preset00]')[1];
  mainPresetText = _.replace(mainPresetText, /\r\n/g, '\n');
  const presetParts = splitPreset(mainPresetText);

  return convertPresetMap(presetParts, optimize);
}
