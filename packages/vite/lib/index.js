"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUseClientDirective = removeUseClientDirective;
function removeUseClientDirective() {
    return {
        name: 'remove-use-client-directive',
        transform: function (code, id) {
            if (id.endsWith('.js') ||
                id.endsWith('.jsx') ||
                id.endsWith('.ts') ||
                id.endsWith('.tsx')) {
                return {
                    code: code.replace(/['"]use client['"];/g, ''),
                    map: null, // Maintain source map if necessary
                };
            }
            return;
        },
    };
}
