#!./node_modules/.bin/babel-node
import os from 'os';
import path from 'path';
import { fill } from 'myrmidon';
import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import multi from '@rollup/plugin-multi-entry';
import babel from '@rollup/plugin-babel';
import fs from 'fs-extra';
import uuid from 'uuid';

const isMain = !module.parent;

async function replaceWithTemplate(templatePath, context, destPath) {
    const content = await fs.readFile(templatePath);
    const filled = fill(content.toString(), context);
    const backupPath = path.resolve(os.tmpdir(), uuid.v4());

    await fs.move(destPath, backupPath);
    await fs.writeFile(destPath, filled);

    return backupPath;
}

async function run() {
    try {
        const backup = await replaceWithTemplate(path.resolve('tests/entry.static.js'), { entry: '../tmp/package/lib' }, path.resolve('tests/entry.js'));

        try {
            const bundle = await rollup({
                input   : 'tests/**/*test.js',
                plugins : [
                    babel({ exclude: 'node_modules/**' }),
                    resolve({ preferBuiltins: true }),
                    commonjs({
                        include   : [ /node_modules/ ],
                        sourceMap : false
                    }),
                    json({
                        include : 'node_modules/**',
                        compact : true
                    }),
                    multi()
                ]
            });

            console.log(bundle.watchFiles);
            await bundle.write({
                file   : 'tmp/tests.js',
                format : 'cjs'
            });
        } catch (error) {
            console.error('ROLLUP ERROR');
            throw error;
        } finally {
            await fs.move(backup, path.resolve('tests/entry.js'), { overwrite: true });
        }
        console.log('Done');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}


if (isMain) run(process.argv.slice(2));