export function id<T>(a: T) { return a; }
	
export function prefix<T>(pre: T) { return function<M>(arg: M): [T,M] { return [pre, arg] }; }
	
export class Language {
	constructor(public title: string, public file: string, public highlight: string) {

	}
	load () {
		return this.file && true;
	}
}