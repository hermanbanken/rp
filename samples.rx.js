
//// sample-1 ////

function display (evt) {
  var html = "Input was "+$("#input").val();
  $("#output").html(html);
}

Rx.Observable.fromEvent($("#form"), 'submit')
  .subscribe(display);

//////////////////

//// sample-2 ////

function displayResults() { ... }

function search(query){
  return $.getJSON("search", { q: query }).promise();
}

Rx.Observable.fromEvent($("#input"), 'keyup')
  .pluck('target', 'value')
  .debounce(200)
  .distinctUntilChanged()
  .flatMapLatest(search)
  .subscribe(displayResults);

//////////////////
