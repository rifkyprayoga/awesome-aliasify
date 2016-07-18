# awesome-aliasify

`awesome-aliasify` is browserify plugin let you customize redirect specific module

### Usage

```javascript
"use strict";
var vue = require("Vue")
```

```
"use strict";
const browserify = require("browserify")
const alias = require("awesome-aliasify");

let b = browserify({ entries: "./src/index.js" })
    .plugin(alias,{
        vue: "global.Vue"
    })
    
b.bundle()
/* .pipe(...) */
```

plugin will transform `vue` module in to `module.exports = global.Vue`
