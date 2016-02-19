angular.module('myApp.directives')
  .constant('_', window._) // inject lodash
  .constant('d3', window.d3) // inject d3

  // Bar graph directive
  .directive('d3Bars', ['_', 'dataFactory','d3', 
    function(_, dataFactory, d3, $window) {
      return {
        restrict: 'EA',
        scope: {},
        link: function(scope, element, attrs) {
          // Get data from factory - implement some sort of caching in the future perhaps
          dataFactory.getData().then(function(data){

            meta = {
              "mean": _.mean(data.map(function(d){ return d.value;})), // Mean across all entries
              "data": {} // Key: operation number, value: number of data entries
            };
            data = _.groupBy(data, 'operation');
            // Find the mean for operations with more than one entry
            data = _.forEach(data, function(value, key){
              data[key] = _.mean(value.map(function(d){ return d.value}));
              meta.data[key] = value.length // Also find out how number of entries for each operation
            })
            data = _.toPairs(data)
            // Graph it!
            drawGraph(scope, element, attrs, data, meta);
          });
        }
      }
    }
  ])
  // Pie graph directive
  .directive("d3Pies",['_','dataFactory','d3',
    function(_, dataFactory, d3, $window){
      return {
        restrict: 'EA',
        scope:{},
        link: function(scope, element, attrs){
          dataFactory.getData().then(function(data){
            // data - total value amount for each location
            // data1 - total number of data entries for each location
            data = _.groupBy(data, 'location');
            data1 = {}
            data = _.forEach(data, function(value, key){
              data[key] = _.sum(value.map(function(d){ return d.value}));
              data1[key] = value.length;
            });
            data = _.toPairs(data)
            data1 = _.toPairs(data1)

            meta = {'title': "Total value per location",
                    'subtitle': "Value: "};
            meta1 = {'title': "Number of data entries per location",
                    'subtitle': "Count: "};
            // Graph them!
            drawPie(scope, element, attrs, data, meta);
            drawPie(scope, element, attrs, data1, meta1);
          })
        }
      }
    }]);

var drawPie = function(scope, element, attrs, data, meta){
  // hardcode values TODO: use params
  var width = 960,
      height = 500,
      radius = Math.min(width, height) / 2;
  var color = d3.scale.category20();
  var arc = d3.svg.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);
  var labelArc = d3.svg.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);
  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d[1]; });

  // use d3-tip for on hover tooltips
  var tip = d3.tip()
      .attr("class","d3-tip")
      .offset([-10,0])
      .html(function(d){
        return "Location: " + d.data[0] +
        "<br>" +meta.subtitle + d.data[1];
      })
  // setup svg
  var svg = d3.select(element[0]).append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .call(tip);

  scope.data = data

  // Watch for resize event
  scope.$watch(function() {
    return angular.element(window).innerWidth;
  }, function() {
    scope.render(scope.data);
  });

  // Render with d3
  scope.render = function(data){
    var g = svg.selectAll(".arc")
        .data(pie(data))
      .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data[0]); })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
    
    // Add title
    g.append("text")
        .attr("x", 0)             
        .attr("y", 0)
        .attr("text-anchor", "middle")  
        .style("font-size", "20px") 
        .text(meta.title);
    };
    scope.$apply();
}

var drawGraph = function(scope, element, attrs, data, meta){
  // Hardcode values for now; TODO: use params
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = window.innerWidth - margin.left - margin.right,
      height = window.innerHeight/2 - margin.top - margin.bottom;
  var x = d3.scale.ordinal()
      .rangeBands([0, width], .1, 5);
  var y = d3.scale.linear()
      .range([height, 0]);
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");
  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  // Use d3-tip for on hover tooltips
  var tip = d3.tip()
      .attr("class","d3-tip")
      .offset([-10,0])
      .html(function(d){
        return "Operation: " + d[0] +
        "<br>Average value: " + d[1]+ 
        "<br>Count: " + meta.data[d[0]];
      })

  // Setup svg
  var svg = d3.select(element[0]).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(tip);

  scope.data = data

  // Watch for resize event
  scope.$watch(function() {
    return angular.element(window).innerWidth;
  }, function() {
    scope.render(scope.data);
  });

  // Render with d3
  scope.render = function(data) {
    svg.selectAll('*').remove();

    // If we don't pass any data, return out of the element
    if (!data) return;

    // Use data to set domains 
    x.domain(data.map(function(d){return d[0];}));
    y.domain(d3.extent(data.map(function(d){return d[1];}))).nice();

    // Add various axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class","x axis zero");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Value");

    // Add mean line
    svg.append("line")
      .attr("x1",x(data[0][0])).attr("x2",x(data[data.length-1][0]))
      .attr("y1",y(meta.mean)).attr("y2",y(meta.mean))
      .attr("stroke-width",1).attr("stroke","black");

    // Draw bars
    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return d[1] < 0 ? y(0) : y(d[1]); })
        .attr("height", function(d) { return Math.abs(y(d[1]) - y(0)); })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);
  };
  scope.$apply();
        
};
