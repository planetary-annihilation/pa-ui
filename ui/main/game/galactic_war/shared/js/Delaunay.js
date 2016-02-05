define(function() {
  "use strict";

  var Delaunay = function() {
    this.initialize.apply(this, arguments);
  };

  Delaunay.prototype = {
    initialize: function(points) {
      this.points = points || [];
      this.triangles = triangulate(this.points);
    },

    getTriangles: function() {
      return this.triangles;
    },

    getOuterPoints: function() {
      var i, j, edge,
          edges = this.getOuterEdges(),
          points = edges[0].slice(0),
          k = 1;

      for (i = 0; i < edges.length - 1; i++) {
        for (j = i+1; j < edges.length; j++) {
          if (edges[i][k] == edges[j][0] || edges[i][k] == edges[j][1]) {
            edge = edges[i+1];
            edges[i+1] = edges[j];
            edges[j] = edge;
            if (edges[i][k] == edges[i+1][0]) {
              points.push(edges[i+1][1]);
              k = 1;
            }
            if (edges[i][k] == edges[i+1][1]) {
              points.push(edges[i+1][0]);
              k = 0;
            }
          }
        }
      }
      points.pop();
      return points;
    },

    getEdges: function() {
      var edges = this.getAllEdges();
      edges = _.uniq(edges, function(a){ return a.join('.'); })
        .sort(function(a,b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0 });
      return edges;
    },

    getOuterEdges: function() {
      var key,
          edges = this.getAllEdges(),
          counts = {};

      _.each(edges, function(a){
        key = a.join('.');
        counts[key] = (counts[key] || 0) + 1;
      });
      edges = _.filter(edges, function(a){
        key = a.join('.');
        return counts[key] == 1;
      }).sort(function(a,b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0 });
      return edges;
    },

    getAllEdges: function() {
      var i, triangle,
          edges = [];

      for (i = 0; i < this.triangles.length; i++) {
        triangle = this.triangles[i].slice(0).sort();
        edges.push(this.fixEdge([triangle[0], triangle[1]]));
        edges.push(this.fixEdge([triangle[0], triangle[2]]));
        edges.push(this.fixEdge([triangle[1], triangle[2]]));
      }
      return edges;
    },

    fixEdge: function(edgeIn) {
      var edge = (edgeIn[0] > edgeIn[1]) ? [edgeIn[1], edgeIn[0]] : [edgeIn[0], edgeIn[1]];
      return edge;
    },

    getConnections: function() {
      var connections = [];

      connections = this.points.map(function(){ return  [] });
      this.triangles.forEach(function(triangle){
        connections[triangle[0]].push(triangle[1], triangle[2]);
        connections[triangle[1]].push(triangle[2], triangle[0]);
        connections[triangle[2]].push(triangle[0], triangle[1]);
      });
      connections = connections.map(function(points){
        return _.uniq(points.sort());
      });
      return connections;
    }
  };

  function triangulate(vertices) {
    var n = vertices.length,
        i, j, indices, open, closed, edges, dx, dy, a, b, c;
    if(n < 3)
      return [];
    vertices = vertices.slice(0);
    indices = new Array(n);
    for(i = n; i--; )
      indices[i] = i;
    indices.sort(function(i, j) { return vertices[j][0] - vertices[i][0]; });
    appendSupertriangleVertices(vertices);
    open   = [triangle(vertices, n + 0, n + 1, n + 2)];
    closed = [];
    edges  = [];
    for(i = indices.length; i--; ) {
      c = indices[i];
      edges.length = 0;
      for(j = open.length; j--; ) {
        dx = vertices[c][0] - open[j].x;
        if(dx > 0.0 && dx * dx > open[j].r) {
          closed.push(open[j]);
          open.splice(j, 1);
          continue;
        }
        dy = vertices[c][1] - open[j].y;
        if(dx * dx + dy * dy > open[j].r)
          continue;
        edges.push(
          open[j].i, open[j].j,
          open[j].j, open[j].k,
          open[j].k, open[j].i
        );
        open.splice(j, 1);
      }
      dedup(edges);
      for(j = edges.length; j; ) {
        b = edges[--j];
        a = edges[--j];
        open.push(triangle(vertices, a, b, c));
      }
    }
    for(i = open.length; i--; )
      closed.push(open[i]);
    open.length = 0;
    for(i = closed.length; i--; )
      if(closed[i].i < n && closed[i].j < n && closed[i].k < n)
        open.push([closed[i].i, closed[i].j, closed[i].k]);
    return open;
  }

  function appendSupertriangleVertices(vertices) {
    var xmin = Number.POSITIVE_INFINITY,
        ymin = Number.POSITIVE_INFINITY,
        xmax = Number.NEGATIVE_INFINITY,
        ymax = Number.NEGATIVE_INFINITY,
        i, dx, dy, dmax, xmid, ymid;
    for(i = vertices.length; i--; ) {
      if(vertices[i][0] < xmin) xmin = vertices[i][0];
      if(vertices[i][0] > xmax) xmax = vertices[i][0];
      if(vertices[i][1] < ymin) ymin = vertices[i][1];
      if(vertices[i][1] > ymax) ymax = vertices[i][1];
    }
    dx = xmax - xmin;
    dy = ymax - ymin;
    dmax = Math.max(dx, dy);
    xmid = xmin + dx * 0.5;
    ymid = ymin + dy * 0.5;
    vertices.push(
      [xmid - 20 * dmax, ymid -      dmax],
      [xmid            , ymid + 20 * dmax],
      [xmid + 20 * dmax, ymid -      dmax]
    );
  }

  function triangle(vertices, i, j, k) {
    var a = vertices[i],
        b = vertices[j],
        c = vertices[k],
        A = b[0] - a[0],
        B = b[1] - a[1],
        C = c[0] - a[0],
        D = c[1] - a[1],
        E = A * (a[0] + b[0]) + B * (a[1] + b[1]),
        F = C * (a[0] + c[0]) + D * (a[1] + c[1]),
        G = 2 * (A * (c[1] - b[1]) - B * (c[0] - b[0])),
        minx, miny, dx, dy, x, y;
    if(Math.abs(G) < 0.000001) {
      minx = Math.min(a[0], b[0], c[0])
      miny = Math.min(a[1], b[1], c[1])
      dx   = (Math.max(a[0], b[0], c[0]) - minx) * 0.5;
      dy   = (Math.max(a[1], b[1], c[1]) - miny) * 0.5;
      x    = minx + dx;
      y    = miny + dy;
    }
    else {
      x  = (D*E - B*F) / G;
      y  = (A*F - C*E) / G;
      dx = x - a[0]
      dy = y - a[1]
    }
    return {i: i, j: j, k: k, x: x, y: y, r: dx * dx + dy * dy};
  }

  function dedup(edges) {
    var j = edges.length,
        a, b, i, m, n;
    outer: while(j) {
      b = edges[--j]
      a = edges[--j]
      i = j
      while(i) {
        n = edges[--i]
        m = edges[--i]
        if((a === m && b === n) || (a === n && b === m)) {
          edges.splice(j, 2)
          edges.splice(i, 2)
          j -= 2
          continue outer
        }
      }
    }
  }
  
  return Delaunay;
});
