define([], function() {
    'use strict';

    var Graph = function() {
        this.initialize.apply(this, arguments);
    };

    Graph.prototype = {
        initialize: function(edges) {
            this.edges = [];
            this.connections = [];
            if (edges)
                edges.forEach(this.addEdge, this);
        },

        addEdge: function(edge){
            var edge = this.fixEdge(edge);
            this.edges.push(edge);
            this.connections[edge[0]] = this.connections[edge[0]] || [];
            this.connections[edge[1]] = this.connections[edge[1]] || [];
            this.connections[edge[0]].push(edge[1]);
            this.connections[edge[1]].push(edge[0]);
        },

        removeEdge: function(edgeIn) {
            var edge = this.fixEdge(edgeIn);
            this.edges = this.edges.filter(function(e) {
                return e[0] != edge[0] || e[1] != edge[1]
            });
            this.connections[edge[0]] = _.without(this.connections[edge[0]], edge[1]);
            this.connections[edge[1]] = _.without(this.connections[edge[1]], edge[0]);
        },

        fixEdge: function(edgeIn) {
            var edge = (edgeIn[0] > edgeIn[1]) ? [edgeIn[1], edgeIn[0]] : [edgeIn[0], edgeIn[1]];
            return edge;
        },

        sortEdges: function() {
            this.edges.sort(function(a,b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0 });
        },

        getEdges: function() {
            return this.edges.slice(0);
        },

        getConnections: function() {
            return this.connections.slice(0);
        },

        isConnected: function() {
            var visited = _.range(this.connections.length),
                path = [0],
                indexes = [0],
                depth,
                node,
                index,
                child;
            while (path.length < this.connections.length) {
                depth = path.length - 1;
                node = path[depth];
                index = indexes[depth];
                if (index >= this.connections[node].length) {
                    path.pop();
                    indexes.pop();
                    indexes[indexes.length - 1]++;
                } else {
                    child = this.connections[node][index];
                    if (visited[child] == null) {
                        indexes[depth]++;
                    } else {
                        path.push(child);
                        indexes.push(0);
                    }
                    visited[child] = null;
                }
                if (indexes.length == 0)
                    return false;
                if (_.compact(visited).length == 0)
                    return true;
            }
        },

        reduceConnections: function(max, seed) {
            var random = new Math.seedrandom(seed),
                nodesToReduce = _.compact(this.connections.map(function(c, i) {
                    return c.length > max ? i : null
                })),
                edgesRemoved = [],
                stop = 1000;
            while (nodesToReduce.length > 0 && stop > 0) {
                var i = nodesToReduce[Math.floor(random() * nodesToReduce.length)],
                    j = Math.floor(random() * this.connections[i].length),
                    edge = [i, this.connections[i][j]];
                this.removeEdge(edge);
                if (this.isConnected()) {
                    edgesRemoved.push(edge);
                    nodesToReduce = _.compact(this.connections.map(function(c, i) {
                        return c.length > max ? i : null
                    }));
                } else {
                    this.addEdge(edge);
                }
                stop--;
            }
        },

        calcDistance: function(nodes, callback) {
            var self = this;
            
            if (typeof nodes === 'number')
                nodes = [nodes];

            var neighbors = self.connections.slice(0);
            var distances = new Array(neighbors.length);
            _.forEach(nodes, function(node) { 
                distances[node] = 0; 
                callback(node, 0);
            });
            var work = nodes.slice(0);
            while (work.length) {
                var s = work.shift();
                var distance = distances[s] + 1;
                _.forEach(neighbors[s], function(neighbor) {
                    if (distances[neighbor] !== undefined)
                        return;
                    callback(neighbor, distance);
                    distances[neighbor] = distance;
                    work.push(neighbor);
                });
                neighbors[s] = [];
            }
        }
    }
    return Graph;
});
