(function(){

var svg, path, xas, yas, ytext, xtext;
function discrete(element) {
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

  var cs = svg
    .selectAll('circle')
    .data(sinusdata)
  cs.enter().append("circle")
  cs.exit().remove()
  cs.attr("cx", function(d){ return x(d.x) })
    .attr("cy", function(d){ return y(0) })
    .attr("r", 3)
    .style("stroke", "black")
    .style("fill", "transparent")

	svg.selectAll("text")
		.data(sinusdata)
		.enter()
		.append("text")
		.text(function(d) {
				return ~~(Math.random() * 200) + "x" + ~~(Math.random() * 500);
		})

  function sinusdata(){
    var points = width / 50;
    var sin = [];
		let x = 0
    for (var i = 0; i < points; i++) {
      sin.push({x});
			x += Math.random() / 4
    }
    return sin
  }
}

let script = document.currentScript
let div = document.createElementNS("http://www.w3.org/2000/svg", "svg");
script.parentNode.insertBefore(div, script)
$(window)
  .on("resize", discrete.bind(null, div))
  .on("load", () => $(window).trigger("resize"));

})();