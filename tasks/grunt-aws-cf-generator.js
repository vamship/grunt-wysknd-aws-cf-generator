'use strict';

const _path = require('path');
const DirInfo = require('wysknd-aws-cf-generator').DirInfo;
const TemplateBuilder = require('wysknd-aws-cf-generator').TemplateBuilder;

module.exports = function(grunt) {
    const taskName = 'generate_cf_template';
    grunt.log.debug(`Loading task: [${taskName}]`);
    grunt.registerMultiTask(taskName, function(target) {
        const done = this.async();
        const options = this.options({
            tokens: {},
            input: {
                rootDir: './',
                templateDir: 'template'
            },
            output: {
                dir: './dist',
                fileName: 'template.json'
            }
        });

        const tokens = Object.assign({}, options.tokens, this.data.tokens);
        const input = Object.assign({}, options.input, this.data.input);
        const output = Object.assign({}, options.output, this.data.output);
        const description = options.description || this.data.description || 'na';

        if (typeof output.dir !== 'string' || output.dir.length <= 0) {
            throw new Error('Invalid output directory specified (output.dir)');
        }
        if (typeof output.fileName !== 'string' || output.fileName.length <= 0) {
            throw new Error('Invalid output file name specified (output.fileName)');
        }

        grunt.verbose.debug('Task options: ', JSON.stringify(options, null, 4));
        grunt.verbose.debug('Target options: ', JSON.stringify(this.data, null, 4));
        grunt.verbose.subhead('Consolidated Inputs:');

        grunt.log.debug('Description: ', description);
        grunt.log.debug('Tokens: ', JSON.stringify(tokens, null, 4));
        grunt.log.debug('Input: ', JSON.stringify(input, null, 4));
        grunt.log.debug('Outuput: ', JSON.stringify(output, null, 4));

        const dirInfo = new DirInfo(input.rootDir, input.templateDir);
        const builder = new TemplateBuilder(dirInfo);
        grunt.verbose.subhead('Compiling cloud formation resources');

        builder.build().then((resources) => {
            grunt.log.ok(`Resources compiled successfully`);
            const resourceMap = {};
            grunt.verbose.subhead(`Extracting exported properties`);
            let propCount = 0;
            resources.forEach((resource) => {
                for (let prop in resource.exportedProperties) {
                    const propValue = resource.exportedProperties[prop];
                    tokens[prop] = propValue;
                    propCount++;
                    grunt.verbose.debug(`Extracted property: [${prop} = ${propValue}]`);
                }
            });
            grunt.log.ok(`Extracted property count: [${propCount}]`);

            grunt.verbose.subhead('Finalizing templates');
            resources.forEach((resource) => {
                grunt.log.debug(`${resource.key} (${resource.type})`);
                resourceMap[resource.key] = resource.finalize(tokens);
            });

            grunt.verbose.subhead('Generating template payload');
            const payload = JSON.stringify({
                Description: description,
                Resources: resourceMap
            }, null, 4);
            grunt.log.ok('Template payload generated')

            const filePath = _path.join(output.dir, output.fileName);
            grunt.verbose.subhead(`Writing template to file: [${filePath}]`);
            grunt.file.mkdir(output.dir);
            grunt.file.write(filePath, payload);
            grunt.log.ok(`Template written to file: [${filePath}]`);
        }).catch((ex) => {
            grunt.log.error(`Error generating template. Details: [${ex}]`);
        }).finally(() => {
            done();
        });
    });
};
