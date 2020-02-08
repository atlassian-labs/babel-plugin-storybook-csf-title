# babel-plugin-storybook-csf-title

A Babel plugin to generate titles for [Storybook CSF](https://storybook.js.org/docs/formats/component-story-format/) stories at _compile time_, typically based on the story file's file name.

## Usage

The plugin adds a `title` property to all transformed files, based on the result of a `toTitle` function that is to be provided as an option to the plugin.

Assuming `toTitle: () => 'foo'`, there are three general scenarios:

#### 1️⃣ The file provides an object as its default export

In this scenario, the plugin adds a `title: foo` property to this default export.

E.g., 

```js
import React from 'react';
import Component from './index';

export default { 
    component: () => <Component />
};
```

is transformed into

```js
import React from 'react';
import Component from './index';

export default { 
    component: () => <Component />,
    title: 'foo'
};
```

#### 2️⃣ The file provides a non-object as its default export

In this scenario, the plugin assumes that the default export is a component, and moves this default export into the `component` property of a default export object as expected by Storybook.

E.g., 

```js
import React from 'react';
import Component from './index';

export default () => <Component />;
```

is transformed into

```js
import React from 'react';
import Component from './index';

export default { 
    component: () => <Component />,
    title: 'foo'
};
```

#### 3️⃣ The file does not provide any default export

In this scenario, the plugin creates a default export with `title: "foo"`.

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

## Options

The plugin takes a single `toTitle` option. `toTitle` is a function that, for every story file that is transformed, recieves Babel's `state` object, and must return the story file's title as a string. Most `toTitle` implementations will make decisions based on `state.filename`. 

To configure the respective `toTitle` implementation, you may want to provide additional options to the plugin. These options are then available to the `toTitle` implementation via the `state.opts` object.

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