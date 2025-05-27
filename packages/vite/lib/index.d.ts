export declare function removeUseClientDirective(): {
    name: string;
    transform(code: string, id: string): {
        code: string;
        map: null;
    } | undefined;
};
