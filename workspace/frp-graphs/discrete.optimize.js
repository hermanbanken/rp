(function(){

var svg, path, xas, yas, ytext, xtext;
function discreteOptimize(element) {
  var margin = {top: 10, right: 20, bottom: 40, left: 35},
    width = $(element).parent().width() - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

  var parse = d3.time.format("%b %Y").parse;

  var x = d3.scale.linear().domain([0, 1]).range([0, width]);
  var y = d3.scale.linear().domain([-1, 1]).range([height, 0]);
  var xAxis = d3.svg.axis().scale(x).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left");

  // A line generator, for the dark stroke.
  var line = d3.svg.line()
    .interpolate("monotone")
    .x(function(d,i) { return x(d.x); })
    .y(function(d,i) { return y(d.y); });

  var canvas = d3.select(element)
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
    .text("time");

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
    .attr("fill", "none")
    .attr("class", "line")
    .attr("d", line);

  var cs = svg
    .selectAll('circle')
    .data(sinusdata)
  cs.enter()
    .append("circle")
  cs.attr("cx", function(d){ return x(d.x) })
    .attr("cy", function(d){ return y(d.y) })
    .attr("r", 3)
    .style("stroke", function(d){
      return d.dy == 0 ? "green" : "red"
    })
    .style("fill", function(d){
      return d.dy == 0 ? "transparent" : "red"
    })
  cs.exit().remove();

  var ls = svg.selectAll("line.linedown")
    .data(sinusdata)
  ls.enter()
    .append("line")
    .attr("class", "linedown")
  ls.exit().remove();
  ls.attr("x1", function(d){ return x(d.x) })
    .attr("y1", function(d){ return y(d.y) })
    .attr("x2", function(d){ return x(d.x) })
    .attr("y2", function(d){ return y(0) })
    .style("stroke", function(d){
      return d.dy == 0 ? "transparent" : "red"
    })

  function point(i, points){
    if(i/points*2*Math.PI < Math.PI / 2)
      return -1;
    else if(i/points*2*Math.PI > Math.PI * 1.5)
      return 1;
    else
      return -Math.sin(i/points*2*Math.PI);    
  }

  function sinusdata(){
    var points = width / 10;
    var sin = [];
    for (var i = 0; i < points; i++) {
      var y = point(i, points);
      sin.push({
        x: i / points,
        y: y,
        dy: point(i - 1, points) - y
      });
    }
    return sin
  }
}

let script = document.currentScript
let div = document.createElementNS("http://www.w3.org/2000/svg", "svg");
script.parentNode.insertBefore(div, script)
$(window)
  .on("resize", discreteOptimize.bind(null, div))
  .on("load", () => $(window).trigger("resize"));

})();