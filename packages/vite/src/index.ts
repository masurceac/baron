export function removeUseClientDirective() {
  return {
    name: 'remove-use-client-directive',
    transform(code: string, id: string) {
      if (
        id.endsWith('.js') ||
        id.endsWith('.jsx') ||
        id.endsWith('.ts') ||
        id.endsWith('.tsx')
      ) {
        return {
          code: code.replace(/['"]use client['"];/g, ''),
          map: null, // Maintain source map if necessary
        };
      }
      return;
    },
  };
}
