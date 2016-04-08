'use strict';

// set up SVG for D3
var width  = 500,
    height = 300,
    colors = d3.scale.category10();

var svg = d3.select('body')
  .append('svg')
  .attr('oncontextmenu', 'return false;')
  .attr('width', width)
  .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [
    {id: 0, reflexive: false, value: '' },
    {id: 1, reflexive: true , value: '' },
    {id: 2, reflexive: false, value: '' }
  ],
  lastNodeId = 2,
  links = [
    {source: nodes[0], target: nodes[2], left: false, right: true },
    {source: nodes[1], target: nodes[2], left: false, right: true }
  ];

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-500)
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
    var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 34 : 29,
        targetPadding = d.right ? 34 : 29,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });

  // remove old links
  path.exit().remove();

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  circle.select('text').text(function(d) { return d.value });

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', function(d) { return colors(d.id); })
    .classed('reflexive', function(d) { return d.reflexive; });

  // add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 30)
    .style('fill', function(d) { return  d3.rgb(colors(d.id)).brighter().toString(); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .classed('reflexive', function(d) { return d.reflexive; })
    .on('mouseover', function(d) {
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      // unenlarge target node
      d3.select(this).attr('transform', '');
    });

  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 10)
      .attr('class', 'id')
      .text(function(d) { return d.value; });

  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();
}

// app starts here
restart();

var numbers = Rx.Observable.interval(1000).map(function (i) { return i % 10 });
var alphabet = Rx.Observable.interval(500).map(function(i) { return (i % 26) + 97 }).map(function(v) { return (String.fromCharCode(v)) });
var combined = Rx.Observable.combineLatest(alphabet, numbers, function(s, n) { return s + n });

numbers.subscribe (function(s) { nodes[0].value = s });
alphabet.subscribe(function(s) { nodes[1].value = s });
combined.subscribe(function(s) {
  (nodes[2].value = s,
  restart(),
  console.log(s))
});
