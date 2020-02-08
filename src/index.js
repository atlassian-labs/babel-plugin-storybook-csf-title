const TITLE_KEY = 'title';
const COMPONENT_KEY = 'component';

const fixObjectDefaultExport = (path, state, t) => {
    if (path.node.declaration.properties) {

        const titleProperty = path.node.declaration.properties.find(node =>
            node.key && node.key.name === TITLE_KEY
        );

        if (!titleProperty) {
            const title = state.opts.toTitle(state);
            path.get('declaration').pushContainer(
                'properties', 
                t.objectProperty(t.identifier(TITLE_KEY), t.stringLiteral(title))
            );
        } else {
            throw new Error(
                `Default export object has a '${TITLE_KEY}' property; the title should, however, be generated. Please remove '${TITLE_KEY}'.`
            )
        }
    } else {
        throw new Error('Default export object does not have properties.');
    }
}

const fixNonObjectDefaultExport = (path, state, t) => {
    const title = state.opts.toTitle(state);
    path.replaceWith(
        t.exportDefaultDeclaration(t.objectExpression([
            t.objectProperty(t.identifier(TITLE_KEY), t.stringLiteral(title)),
            t.objectProperty(t.identifier(COMPONENT_KEY), path.node.declaration)
        ]))
    );
}

const insertDefaultExport = (programPath, state, t) => {
    const title = state.opts.toTitle(state);
    programPath.pushContainer(
        'body',
        t.exportDefaultDeclaration(t.objectExpression([
            t.objectProperty(t.identifier(TITLE_KEY), t.stringLiteral(title))
        ]))
    );
}

const plugin = (babel) => {
    const { types: t } = babel;

    return ({
        name: 'Storybook CSF title generation',
        inherits: require("@babel/plugin-syntax-jsx").default,
        visitor: {
            ExportDefaultDeclaration: (path, state) => {
                if (path.node.declaration.type === 'ObjectExpression') {
                    fixObjectDefaultExport(path, state, t);
                } else {
                    fixNonObjectDefaultExport(path, state, t);
                }
                state.handled = true;
                path.stop();
            },
            Program: {
                exit: (path, state) => {
                    if (state.handled) {
                        return;
                    }
                    insertDefaultExport(path, state, t);
                    path.stop();
                }
            }
        }
    });
};

module.exports = plugin;