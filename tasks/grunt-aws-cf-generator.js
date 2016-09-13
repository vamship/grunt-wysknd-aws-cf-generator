'use strict';

const _fs = require('fs');
const _path = require('path');
const _clone = require('clone');
const DirInfo = require('wysknd-aws-cf-generator').DirInfo;
const TemplateBuilder = require('wysknd-aws-cf-generator').TemplateBuilder;

module.exports = function(grunt) {
    const taskName = 'generate_cf_template';
    grunt.log.debug(`Loading task: [${taskName}]`);
    grunt.registerTask(taskName, function() {
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
        if (typeof options.output.dir !== 'string' ||
            options.output.dir.length <= 0) {
            throw new Error('Invalid output directory specified (options.output.dir)');
        }
        if (typeof options.output.fileName !== 'string' ||
            options.output.fileName.length <= 0) {
            throw new Error('Invalid output file name specified (options.output.fileName)');
        }
        grunt.log.debug('Task options:\n', JSON.stringify(options, null, 4));

        const tokens = _clone(options.tokens);
        const rootDir = options.input.rootDir;
        const templateDir = options.input.templateDir;

        const dirInfo = new DirInfo(rootDir, templateDir);
        const builder = new TemplateBuilder(dirInfo);
        grunt.log.writeln('Compiling cloud formation resources');

        builder.build().then((resources) => {
            const resourceMap = {};
            grunt.log.writeln(`Extracting exported properties`);
            resources.forEach((resource) => {
                for (let prop in resource.exportedProperties) {
                    const propValue = resource.exportedProperties[prop];
                    tokens[prop] = propValue;
                }
            });

            grunt.log.writeln('Finalizing templates');
            resources.forEach((resource) => {
                grunt.log.debug(`${resource.key} (${resource.type})`);
                resourceMap[resource.key] = resource.finalize(tokens);
            });

            grunt.log.writeln('Generating template payload');
            const payload = JSON.stringify({
                Description: options.description,
                Resources: resourceMap
            }, null, 4);

            const filePath = _path.join(options.output.dir,
                options.output.fileName);
            grunt.log.writeln(`Writing template to file: [${filePath}]`);
            grunt.file.mkdir(options.output.dir);
            grunt.file.write(filePath, payload);

            grunt.log.ok('Done');
        }).catch((ex) => {
            grunt.log.error(`Error generating template. Details: [${ex}]`);
        }).finally(() => {
            done();
        });
    });
};
