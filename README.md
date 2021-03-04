# babel-plugin-storybook-csf-title

[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

A [Babel plugin](https://babeljs.io/docs/en/plugins/) to generate titles for [Storybook CSF](https://storybook.js.org/docs/formats/component-story-format/) stories at _compile time_, typically based on the story file's file name.

## Usage

The plugin adds a `title` property to all transformed files, based on the result of a `toTitle` function that is to be provided as an option to the plugin.

Assuming `toTitle: () => 'foo'`, there are three general scenarios:

#### 1️⃣ The file does not provide a default export

In this scenario, the plugin creates a default export `{ title: "foo" }`.

E.g., 

```js
import React from 'react';
import Component from './index';

export const Example = () => <Component />;
```

is transformed into

```js
import React from 'react';
import Component from './index';

export const Example = () => <Component />;

export default { title: 'foo' };
```

#### 2️⃣ The file provides an object as its default export

In this scenario, the plugin adds a `title: foo` property to the existing export.

E.g., 

```js
import React from 'react';
import Component from './index';

export default { 
    something: 'something'
};

export const Example = () => <Component />;
```

is transformed into

```js
import React from 'react';
import Component from './index';

export default { 
    title: 'foo'
    something: 'something'
};

export const Example = () => <Component />;
```

If the existing export already contains a `title` property, an error is thrown.

#### 3️⃣ The file provides a non-object as its default export

If the `renameDefaultExportsTo` option is set, the plugin assumes that the default export is a component, and moves this component to a named export of the name `${renameDefaultExportsTo}`. It then creates a default export `{ title: "foo" }`. 

E.g., assuming `renameDefaultExportsTo` is `"Default"`,

```js
import React from 'react';
import Component from './index';

export default () => <Component />;
```

is transformed into

```js
import React from 'react';
import Component from './index';

export const Default = () => <Component />;

export default { 
    title: 'foo'
};
```

If a `${renameDefaultExportsTo}` export already exists, an error is thrown.

## Installation

Install the plugin e.g. via `yarn`;

```
yarn add --dev babel-plugin-storybook-csf-title
```

In your Babel configuration, add `babel-plugin-storybook-csf-title` as a plugin:

```js
plugins: [
    ['babel-plugin-storybook-csf-title', { toTitle: require('./your-to-title-function') }],
]
```

Note that the plugin really only makes sense for story files. You will want to make sure it is only applied to exactly these files, e.g. like this:

```js
/* add plugin to babel, however disable it by default */
plugins: [
    ['babel-plugin-storybook-csf-title', false], 
],
/* enable the plugin for all files that match your story name pattern */
overrides: [{ 
    include: /\/stories\.(ts|tsx)$/, 
    plugins: [
        ['babel-plugin-storybook-csf-title', { toTitle: require('./your-to-title-function') }]
    ]
}]
```

## Options

The plugin takes three options, `toTitle` (required), `ifFound` (optional), and `renameDefaultExportsTo` (optional):

- `toTitle` is a function that, for every story file that is transformed, recieves Babel's `state` object, and must return the story file's title as a string. Most `toTitle` implementations will make decisions based on `state.filename`.

- `ifFound` is an optional string value that may either be set to:
  -  `'skip'` - skips adding a title if it has already been manually specified in the code
  -  `'overwrite'` - overwrites any title already manually specified in the code
  -  `undefined` (or any other value) - raise an error if processing a file that already defines a title

- `renameDefaultExportsTo` is an optional string value that controls scenario 3 as described above. It is `undefined` by default.

## Generating meaningful story names

In most cases, the story name will be generated based on the story file's file name. Here's a possible implementation of `toTitle` for a `yarn workspaces`-style monorepo setup:

```js
const path = require('path');
const pkgUp = require('pkg-up');

module.exports = (state) => {

    // find the closest package.json
    const packageJsonPath = pkgUp.sync({ cwd: state.filename });

    // read the package.json
    const packageJson = require(packageJsonPath);

    // get the path of the story file relative to the package root
    const { dir: packageJsonDir } = path.parse(packageJsonPath);
    const { dir: fileDir, name: fileName } = path.parse(path.relative(packageJsonDir, state.filename));

    const storybookPath = [
        // package name; "/" has meaning to storybook, hence replace a possible "/" by "|"
        packageJson.name.replace('/', '|'),

        // file dir
        ...fileDir.split(path.sep),
    ];

    // handle file names
    if (fileName === 'examples' || fileName === 'stories') {
        // nothing to do
    } else if (fileName.endsWith('.stories')) {
        storybookPath.push(fileName.slice(0, '.stories'.length + 1));
    } else if (fileName.endsWith('.examples')) {
        storybookPath.push(fileName.slice(0, '.examples'.length + 1));
    }

    return storybookPath.join('/');
}
```

## Contributions

Contributions to `babel-plugin-storybook-csf-title` are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details. 


## License

Copyright (c) 2020 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

<br/> 

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-with-thanks.png)](https://www.atlassian.com)
