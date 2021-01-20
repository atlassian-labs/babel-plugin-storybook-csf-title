const TITLE_KEY = 'title';

const fixObjectDefaultExport = (path, t, title) => {
    if (path.node.declaration.properties) {
        const titleProperty = path.node.declaration.properties.find(node =>
            node.key && node.key.name === TITLE_KEY
        );
        if (!titleProperty) {
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

const replaceDefaultExportPathByNamedDefaultExportPath = (defaultExportPath, t, renameDefaultExportsTo) => {
    if(renameDefaultExportsTo) {
        defaultExportPath.replaceWith(
            t.exportNamedDeclaration(
                t.variableDeclaration(
                    'const',
                    [
                        t.variableDeclarator(
                            t.identifier(renameDefaultExportsTo),
                            defaultExportPath.node.declaration
                        )
                    ],
                ),
                []
            )
        );
    }
    else {
        defaultExportPath.remove();
    }
}

const insertDefaultExport = (programPath, t, title) => {
    programPath.pushContainer(
        'body',
        t.exportDefaultDeclaration(t.objectExpression([
            t.objectProperty(t.identifier(TITLE_KEY), t.stringLiteral(title))
        ]))
    );
}

const plugin = babel => {
    const { types: t } = babel;

    return ({
        name: 'Storybook CSF title generation',
        visitor: {
            ExportDefaultDeclaration: (path, state) => {
                if (state.handled) {
                    return;
                }
                state.defaultExportPath = path;
            },
            ExportNamedDeclaration: (path, state) => {
                if (state.handled) {
                    return;
                }
                if (
                    state.opts.renameDefaultExportsTo &&
                    path.node.declaration &&
                    path.node.declaration.type === 'VariableDeclaration' &&
                    path.node.declaration.declarations &&
                    path.node.declaration.declarations[0] &&
                    path.node.declaration.declarations[0].type === 'VariableDeclarator' &&
                    path.node.declaration.declarations[0].id &&
                    path.node.declaration.declarations[0].id.name === state.opts.renameDefaultExportsTo
                ) {
                    state.namedDefaultExportPath = path;
                }
            },
            Program: {
                exit: (path, state) => {
                    if (state.handled) {
                        return;
                    }

                    state.handled = true;

                    const title = state.opts.toTitle(state);
                    const renameDefaultExportsTo = state.opts.renameDefaultExportsTo;
                    const programPath = path;

                    if (state.defaultExportPath) {
                        if (state.defaultExportPath.node.declaration.type === 'ObjectExpression') {
                            fixObjectDefaultExport(state.defaultExportPath, t, title);
                        } else {
                            if (renameDefaultExportsTo !== void 0) {
                                if (!state.namedDefaultExportPath) {
                                    replaceDefaultExportPathByNamedDefaultExportPath(state.defaultExportPath, t, renameDefaultExportsTo);
                                    insertDefaultExport(programPath, t, title);
                                } else {
                                    throw new Error(
                                        `Default export can't be changed to '${renameDefaultExportsTo}', as a '${renameDefaultExportsTo}' export already exists. Please rename '${renameDefaultExportsTo}'.`
                                    )
                                }
                            } else {
                                throw new Error(`Non-object default export found. Please change to named export.`)
                            }
                        }
                    } else {
                        insertDefaultExport(programPath, t, title);
                    }
                }
            }
        }
    });
};

module.exports = plugin;
