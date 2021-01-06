const fork = require('child_process').fork;
const fs = require('fs');
const rxjs = require('../lib/rxjs.umd.min');

const { from } = rxjs;
const { filter, mergeMap } = rxjs.operators;

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(
    'not enough arguments: yarn run convert preset-directory output-directory presets-in-parallel shaders-only'
  );
  process.exit(1);
}

let optimize = true;
let shadersOnly = false;
if (args.length > 3) {
  optimize = (args[3] === 'true');
  shadersOnly = (args[4] === 'true');
}

function convertPreset (item) {
  return new Promise((resolve, reject) => {
    const cp = fork('src/convertPreset.js', [args[0], args[1], item, optimize, shadersOnly]);
    cp.on('error', reject)
      .on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

fs.readdir(args[0], (err, items) => {
  from(items)
    .pipe(
      filter((item) => item.endsWith('.milk')),
      mergeMap(
        async (item) => {
          try {
            await convertPreset(item);
          } catch (e) {
            console.log('err %O: %O', item, e);
          }
        },
        (item) => item,
        parseInt(args[2], 10) || 1
      )
    )
    .subscribe((item) => console.log('finished: %O', item));
});
