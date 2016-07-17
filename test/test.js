/**
 * Created by tommyZZM.OSX on 16/7/17.
 */
"use strict";
const path = require("path");
const browserify = require("browserify");
const through = require("through2");
const mocha = require("mocha");
const expect = require("chai").expect;
const describe = mocha.describe;
const alias = require("../");

describe('test', function() {
    it("alias global.*",function(done){
        let b = browserify({entries:path.resolve(__dirname,"./src/index.js")})
            .plugin(alias,{
                vue:"global.Vue"
            })

        let check = (curr) => next => expect(curr).to.be.equal(next)
        b.pipeline.get("deps").push(through.obj(function (chunk, enc, next) {
            next(null,chunk)
            if (chunk.entry) {
                check = check(chunk.deps["vue"])
            } else {
                check(chunk.id)
            }
        }))

        return b.bundle().on("end",_=>done()).pipe(through())
    })
})
