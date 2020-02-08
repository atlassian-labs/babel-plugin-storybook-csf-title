const tester = require('babel-plugin-tester/pure').default;
const plugin = require('..');
const outdent = require('outdent');

tester({
    plugin,
    tests: [
        {
            title: "Default export object without title",
            code: outdent`
              import React from 'react';
              import { Component } from './index';
              export default {
                something: "something"
              };
              export const Default = () => <Component />;
            `,
            output: outdent`
              import React from 'react';
              import { Component } from './index';
              export default {
                something: "something",
                title: "bar"
              };
              export const Default = () => <Component />;
            `
        },
        {
            title: "Non-object default export",
            code: outdent`
              import React from 'react';
              import { Component } from './index';
              export default () => <Component />;
            `,
            output: outdent`
              import React from 'react';
              import { Component } from './index';
              export default {
                title: "bar",
                component: () => <Component />
              };      
            `
        },
        {
            title: "No default export",
            code: outdent`
              import React from 'react';
              import { Component } from './index';
              export const Default = () => <Component />;
            `,
            output: outdent`
              import React from 'react';
              import { Component } from './index';
              export const Default = () => <Component />;
              export default {
                title: "bar"
              };
            `
        },
        {
            title: "Title is already set",
            code: outdent`
              import React from 'react';
              import { Component } from './index';
              export default {
                title: "something"
              };
              export const Default = () => <Component />;
            `,
            error: "Default export object has a 'title' property; the title should, however, be generated. Please remove 'title'.",
        }
    ],
    pluginOptions: {
        title: 'bar',
        toTitle: (state) => state.opts.title,
    },
    babelOptions: {
      plugins: ["@babel/plugin-syntax-jsx"],
    }
});