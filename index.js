/**
 * Created by tommyZZM.OSX on 16/7/17.
 */
"use strict";
const fs = require("fs");
const Promise = require("bluebird");
const path = require("path");
const through = require("through2");
const bresolve = require('browser-resolve');
const md5 = require("./lib/md5");
const cwd = process.cwd();

const _empty = path.join(__dirname, './lib/_empty.js');

const regexGlobalAlia = /global\.[\w\$_]+/;

const regexPathAlia = /^\.\/.+/;

module.exports = function (b, alias) {
  let aliasPackagesMappingById = {};
  let aliasPackages = Object.keys(alias).reduce((final, key) => {
    let value = alias[key];
    let isRelativePath = regexPathAlia.test(value);
    let pkg = {
      id: isRelativePath ? path.join(cwd, value) : md5(key, 10),
      source: value,
      deps: {},
      isRelativePath
    }

    final[key] = pkg;
    aliasPackagesMappingById[pkg.id] = pkg;
    return final
  }, {});

  b._bresolve = function (id, parent, cb) {
    if ( alias[id] ) {
      return cb(null, _empty, {})
    }
    return bresolve(id, parent, cb)
  }

  resetPipeline(b);
  b.on('reset', () => resetPipeline(b))

  function resetPipeline(b) {
    b.pipeline.get("deps").push(through.obj(function (chunk, enc, next) {
      Object.keys(chunk.deps).forEach(key => {
        let pkg = aliasPackages[key];
        if ( pkg ) {
          chunk.deps[key] = pkg.id
        }
      });

      if ( aliasPackagesMappingById[chunk.id] ) {
        aliasPackagesMappingById[chunk.id].isDependencied = true;
      }

      return (chunk.id === _empty) ? next() : next(null, chunk)
    }, function (flush) {
      Promise.all(Object.keys(aliasPackages).map(key => new Promise((done) => {
        let pkg = aliasPackages[key];
        let source = new Buffer("");

        transformSource(pkg.id, pkg.source)
          .pipe(b._mdeps.getTransforms(pkg.id, {}, { builtin: true }))
          .pipe(through(function (buf, _, next) {
            source = Buffer.concat([source, buf])
            next(null, buf)
          }, function (flush) {
            let { id, deps, isRelativePath } = pkg;

            let file = path.join(__dirname, "./lib/_empty");
            if ( isRelativePath ) {
              file = pkg.id;
            }

            done({
              ...pkg
              , id
              , deps
              , source: source.toString()
              , file
            })

            flush()
          }))
      }))).then((alias) => {
        alias.forEach(pkg => {
          if ( !pkg.isDependencied ) this.push(pkg);
        })
        flush()
      })
    }))

  }
}

function transformSource(id, sourcePath) {
  if ( regexGlobalAlia.test(sourcePath) ) {
    return stringStream("module.exports = " + sourcePath);
  }

  if ( path.isAbsolute(id) ) {
    return fs.createReadStream(id);
  }

  return stringStream("module.exports = void 0")

  function stringStream(input) {
    let st = through();
    st.push(input);
    st.push(null);
    return st
  }
}
