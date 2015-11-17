interface RegExp {
 	matchAll(input: String): any[][];
}

RegExp.prototype.matchAll = function(input: string){
  var m: any[], ar: any[][] = [];
  while((m = this.exec(input)) != null)
    ar.push(m);
  return ar;
}
