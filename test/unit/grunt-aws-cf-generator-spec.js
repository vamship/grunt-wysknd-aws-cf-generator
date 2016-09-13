/* jshint node:true, expr:true */
'use strict';

const _sinon = require('sinon');
const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));
const expect = _chai.expect;

const _gruntAwsCfGenerator = require('../../tasks/grunt-aws-cf-generator');

describe('[AWS CF Generator Task]', () => {

    describe('[init]', () => {
        expect(_gruntAwsCfGenerator).to.be.a('function');
    });
});
