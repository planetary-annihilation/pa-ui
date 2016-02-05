define([], function() {
  "use strict";

  var PointField = function() {
    this.initialize.apply(this, arguments);
  };

  PointField.prototype = {
    initialize: function(options) {
      options = options || {};
      this.size = options.size || 1;
      this.density = options.density || 1;
      this.minimumDistance = options.minimumDistance || 1;
      this.minimumDistanceSq = this.minimumDistance*this.minimumDistance;
      this.maximumDistance = options.maximumDistance || 2;
      this.deltaDistance = this.maximumDistance - this.minimumDistance;
      this.random = new Math.seedrandom(options.seed || 'random');
      this.minimumDistanceBonus = options.minimumDistanceBonus || 0;
      this.largeRadiusBaseline = 20;
    },

    build: function() {
      var index, newPoint;
      this.points = [[0,0]];
      while (this.points.length < this.size) {
        index = Math.floor(this.random() * this.points.length);
        newPoint = this.generateNewPoint(this.points[index]);
        if (this.isValidPoint(newPoint)) this.points.push(newPoint);
      }
      this.fixDensity();
      return this;
    },

    generateNewPoint: function(point) {
        var a = this.random() * 2 * Math.PI,
            b = Math.max(Math.abs(point[0]), Math.abs(point[1])),
            f = Math.min(b / this.largeRadiusBaseline, 1.0),
            r = this.minimumDistance + (f * this.minimumDistanceBonus) + (this.deltaDistance * this.random());
      return [point[0] + r*Math.cos(a), point[1] + r*Math.sin(a)];
    },

    isValidPoint: function(p0) {
      return this.points.every(function(p1){
        return ((p0[0] - p1[0])*(p0[0] - p1[0]) + (p0[1] - p1[1])*(p0[1] - p1[1])) >= this.minimumDistanceSq;
      }, this);
    },

    fixDensity: function() {
      var min = [0,0],
          max = [0,0];
      this.points.forEach(function(p){
        min[0] = Math.min(min[0], p[0]);
        min[1] = Math.min(min[1], p[1]);
        max[0] = Math.max(max[0], p[0]);
        max[1] = Math.max(max[1], p[1]);
      });
      var scale0 = Math.sqrt(this.size/this.density),
          scale1 = scale0/Math.max(max[0] - min[0], max[1] - min[1]),
          offset = (1-scale0)/2;
      this.points = this.points.map(function(p){
        p[0] = offset + (p[0] - min[0])*scale1;
        p[1] = offset + (p[1] - min[1])*scale1;
        return p;
      });
    },

    getPoints: function() {
      return this.points.slice(0);
    }
  }
  
  return PointField;
});
