export declare function id<T>(a: T): T;
export declare function prefix<T>(pre: T): <M>(arg: M) => [T, M];
export declare class Language {
    title: string;
    file: string;
    highlight: string;
    constructor(title: string, file: string, highlight: string);
    load(): boolean;
}
