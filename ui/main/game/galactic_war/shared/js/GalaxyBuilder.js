define(
[
    'shared/PointField', 
    'shared/Graph', 
    'shared/Delaunay'
], 
function(
    PointField, 
    Graph, 
    Delaunay
) {
  "use strict";

  var GalaxyBuilder = function() {
    this.initialize.apply(this, arguments);
  };

  GalaxyBuilder.prototype = {
    initialize: function(options) {
      options = options || {};
      this.seed = options.seed || 0;
      this.size = options.hasOwnProperty('size') ? Math.max(options.size, 2) : 20;
      this.minStarDistance = options.minStarDistance || 0;
      this.maxStarDistance = options.maxStarDistance || 0;
      this.maxConnections = options.hasOwnProperty('maxConnections') ? Math.max(options.maxConnections, 2) : 4;
    },

    build: function() {
      this.buildStars();
      this.buildGraph();
    },

    buildStars: function() {
      var field = new PointField({
            seed: this.seed,
            size: this.size,
            density: 160,
            minimumDistance: this.minStarDistance,
            maximumDistance: this.maxStarDistance
          });
      field.build();
      this.stars = field.getPoints();
    },

    buildGraph: function() {
      this.graph = new Delaunay(this.stars);
      var allEdges = this.graph.getEdges();
      var outerEdges = this.graph.getOuterEdges();
      var innerEdges = _.filter(allEdges, function(testEdge) {
          return !_.some(outerEdges, function(o) { 
              return (testEdge[0] === o[0]) && (testEdge[1] === o[1]);
          });
      });
      this.reducedGraph = new Graph(innerEdges);
      this.reducedGraph.reduceConnections(this.maxConnections);
      this.reducedGraph.sortEdges();
      this.edges = this.reducedGraph.
        getEdges().
        map(function(e) {
          return [this.stars[e[0]].slice(0), this.stars[e[1]].slice(0)]
        }, this);
    },

    getPoints: function() {
      return this.stars.slice(0);
    },

    getEdges: function() {
      return this.edges.slice(0);
    },

    getConnections: function() {
      return this.reducedGraph.getConnections();
    },

    getOuterPoints: function() {
      return this.graph.getOuterPoints();
    },

    getDistantPoints: function(count) {
      var outerPoints = this.getOuterPoints(),
          subset = _.range(4).map(function(index){
            index = Math.floor(index * outerPoints.length / 4);
            return outerPoints[index];
          });
      return subset.sort();
    }
  }
  
  return GalaxyBuilder;
});
