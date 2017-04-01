(function(){

var svg, path, xas, yas, ytext, xtext;
function continuousDiscrete(selector) {
  var margin = {top: 10, right: 20, bottom: 40, left: 35},
    width = $(selector).closest("p").width() - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  var parse = d3.timeFormat("%b %Y").parse;

  var x = d3.scaleLinear().domain([0, 1]).range([0, width]);
  var y = d3.scaleLinear().domain([-1, 1]).range([height, 0]);
  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);

  // A line generator, for the dark stroke.
  var line = d3.line()
    .curve(d3.curveLinear)
    .x(function(d,i) { return x(d.x); })
    .y(function(d,i) { return y(d.y); });

  var canvas = d3.select(selector)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  svg = svg || canvas
    .append("g")

  svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  xas = xas || svg.append("g")
  xas
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  xtext = xtext || xas.append("text")
  xtext
    .attr("x", 4)
    .attr("dy", "2.4em")
    .style("text-anchor", "end")
    .text("x");

  yas = yas || svg.append("g")
  yas
    .attr("class", "y axis")
    .call(yAxis);

  ytext = ytext || yas.append("text")
  ytext
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".91em")
    .style("text-anchor", "end")
    .text("y");

  path = path || svg.append("path")
  path
    .datum(sinusdata)
    .attr("class", "line")
    .attr("d", line);

  var cs = svg
    .selectAll('circle')
    .data(sinusdata)
  cs.enter().append("circle")
  cs.exit().remove()
  cs.attr("cx", function(d){ return x(d.x) })
    .attr("cy", function(d){ return y(d.y) })
    .attr("r", 3)
    .style("stroke", "red")
    .style("fill", "transparent")

  var ls = svg.selectAll("line.linedown")
    .data(sinusdata)
  ls.enter().append("line")
    .attr("class", "linedown")
  ls.exit().remove()
  ls.attr("x1", function(d){ return x(d.x) })
    .attr("y1", function(d){ return y(d.y) })
    .attr("x2", function(d){ return x(d.x) })
    .attr("y2", function(d){ return y(0/*-Math.PI*.5*/) })
    .style("stroke", "red")
    .style("fill", "transparent")

  function sinusdata(){
    var points = width / 10;
    var sin = [];
    for (var i = 0; i < points; i++) {
      sin.push({x: i / points, y: Math.sin(i/points*3*Math.PI)});
    }
    return sin
  }
}

$(window)
  .on("resize", continuousDiscrete.bind(window, "#continuous-discrete"))
  .on("load", () => $(window).trigger("resize"));

})();
