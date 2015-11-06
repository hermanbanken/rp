
//// sample-1 ////

function display (evt) {
  var html = "Input was "+$("#input").val();
  $("#output").html(html);
}

$("#form").on("submit", display);

//////////////////

//// sample-2 ////

function displayResults() { ... }

var timeout, lastXhr, lastQuery;
$("#input").on("keyup", function (evt) {
  var data = { 
    q: $("#input").val() 
  };
  
  if(data.q == lastQuery)
    return;
  lastQuery = data.q;

  timeout && clearTimeout(timeout);
  timeout = setTimeout(function () {
    lastXhr = $.getJSON("search", data, (r, xhr) => {
      if (xhr == lastXhr)
        displayResults(r);
    });
  }, 200);
});

//////////////////