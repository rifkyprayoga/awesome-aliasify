/**
 * Created by tommyZZM.OSX on 16/7/17.
 */
"use strict";
const path = require("path");
const browserify = require("browserify");
const through = require("through2");
const mocha = require("mocha");
const chai = require("chai");
const spies = require("chai-spies");
const cwd = process.cwd();

const expect = chai.expect;
chai.use(spies);
const describe = mocha.describe;
const alias = require("../");

describe('test', function() {
    it("alias global.*",function(done){
        let b = browserify({entries:path.resolve(__dirname,"./src/index-global.js")})
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

    it("alias global.* with debug=true",function(done){
        let b = browserify({
                entries:path.resolve(__dirname,"./src/index-global.js"),
                debug:true
            })
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

    it("should be reject",function(done){
        let b = browserify({entries:path.resolve(__dirname,"./src/reject.js")})
                .plugin(alias,{
                    vue:"global.Vue"
                })
        let onerror = chai.spy(err=>{
            //console.log(err.message);
        });

        b.bundle().on("error",(err)=>{
            onerror(err);
            expect(onerror).to.have.been.called();
            done();
        }).on("end",_=>{
            done()
        }).pipe(through());

    })

    it("alias to a redirected file (standalone)",function(done){
        let b = browserify({entries:path.resolve(__dirname,"./src/index-redirect-standalone.js")})
            .plugin(alias,{
                vue:"global.Vue",
                redirect:"./test/src/fixture-redirect.js"
            })

        const allChunkIds = []
        b.pipeline.get("deps").push(through.obj(function (chunk, enc, next) {
            if (chunk.entry) {
                const keys = Object.keys(chunk.deps);
            }
            allChunkIds.push(chunk.id);
            next(null,chunk);
        }))

        return b.bundle().on("end",_=>{
            expect(allChunkIds.length).to.be.equal(3);
            expect(allChunkIds).to.include(path.join(cwd, "./test/src/fixture-redirect.js"));
            done();
        }).pipe(through());
    })

    it("alias to a redirected file (multiply)",function(done){
        let b = browserify({entries:path.resolve(__dirname,"./src/index-redirect-multiply.js")})
            .plugin(alias,{
                vue:"global.Vue",
                redirect:"./test/src/fixture-redirect.js"
            })

        b.pipeline.get("deps").push(through.obj(function (chunk, enc, next) {
            next(null,chunk);
            if (chunk.entry) {
                const keys = Object.keys(chunk.deps);
                expect(keys.length).to.be.equal(2);
                expect(chunk.deps[keys[0]]).to.be.equal(chunk.deps[keys[1]]);
            }
        }))

        return b.bundle().on("end",_=>done()).pipe(through())
    })
})
