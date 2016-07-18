/**
 * Created by tommyZZM.OSX on 16/7/17.
 */
"use strict";
const Promise = require("bluebird");
const path = require("path");
const through = require("through2");
const bresolve = require('browser-resolve');
const md5 = require("./lib/md5");

const _empty = path.join(__dirname, './lib/_empty.js');

const regexGlobalAlia = /global\.[a-zA-Z]\w+/;

module.exports = function (b, alias) {
    let aliasPackages = Object.keys(alias).reduce((final,key)=>{
        final[key] = {
            id:md5(key,10),
            source:alias[key],
            deps:{}
        }
        return final
    },{})

    b._bresolve = function (id, parent, cb) {
        if (alias[id]) {
            return cb(null,_empty,{})
        }
        return bresolve(id,parent,cb)
    }

    resetPipeline(b);
    b.on('reset',()=>resetPipeline(b))

    function resetPipeline(b) {

        b.pipeline.get("deps").push(through.obj(function (chunk, enc, next) {
            // console.log("deps:transform")
            Object.keys(chunk.deps).forEach(key=>{
                let pkg = aliasPackages[key];
                if (pkg) {
                    chunk.deps[key] = pkg.id
                }
            });
            return (chunk.id === _empty)?
                next():next(null,chunk)
        },function (flush) {
            Promise.all(Object.keys(aliasPackages).map(key=>new Promise((done)=>{
                let pkg = aliasPackages[key];
                let source = new Buffer("");
                transformSource(pkg.source)
                    .pipe(b._mdeps.getTransforms(pkg.id,{},{builtin:true}))
                    .pipe(through(function (buf,_,next) {
                        source = Buffer.concat([source,buf])
                        next(null,buf)
                    },function (flush) {
                        let { id, deps } = pkg;
                        done({
                            id
                            , deps
                            , source:source.toString()
                        })
                        flush()
                    }))
            }))).then((alias)=>{
                alias.forEach(pkg=>this.push(pkg))
                flush()
            })
        }))

    }
}

function transformSource(source) {
    if (regexGlobalAlia.test(source)) {
        return stringStream("module.exports = "+ source);
    }

    return stringStream("module.exports = void 0")

    function stringStream(input) {
        let st = through();
        st.push(input);
        st.push(null);
        return st
    }
}
