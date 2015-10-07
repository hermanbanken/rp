
//// sample-1 ////

Rx.Observable.fromEvent($("#form"), 'submit')
  .subscribe(function(){
    var html = "Input was "+$("#input").val();
    $("#output").html(html);
  });

//////////////////

//// sample-2 ////

Rx.Observable.fromEvent($("#input"), 'keyup')
  .flatMap(function(){
    var data = { q: $("#input").val() };
    return $.getJSON("search", data).promise();
  }).subscribe(displayResults);

//////////////////

//// sample-3 ////

Rx.Observable.fromEvent($("#input"), 'keyup')
  .map(function(){ return $("#input").val() })
  .debounce(200)
  .flatMap(function(query){
    return $.getJSON("search", { q: query }).promise();
  }).subscribe(displayResults);

//////////////////
