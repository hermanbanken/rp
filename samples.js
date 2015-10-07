
//// sample-1 ////

$("#form").on("submit", function (evt) {
  var html = "Input was "+$("#input").val();
  $("#output").html(html);
});

//////////////////

//// sample-2 ////

$("#input").on("keyup", function (evt){
  var data = { q: $("#input").val() };
  $.getJSON("search", data, function (r) {
    displayResults(r);
  });  
});

//////////////////

//// sample-3 ////

var timeout;
$("#input").on("keyup", function (evt) {
  var data = { q: $("#input").val() };
  timeout && clearTimeout(timeout);
  timeout = setTimeout(function () {
    $.getJSON("search", data, displayResults);
  }, 200);
});

//////////////////
