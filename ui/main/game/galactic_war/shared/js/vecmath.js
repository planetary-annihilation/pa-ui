define([
], function(
) {

    var VMath = {};

    VMath.copy = function(a) { return new Float32Array(a); };

    var vecElements = 'xyzw';
    var matrixElements = _.map(_.range(16), function(e) { return 'm' + ((e < 10) ? ('0' + e.toString()) : e.toString()); });

    var binaryOps = [
        ['add', '+'],
        ['sub', '-'],
        ['mul', '*'],
        ['div', '/'],
        ['mod', '%'],
        ['shl', '<<'],
        ['shr', '>>'],
        ['ushr', '>>>'],
        ['lt', '<'],
        ['lte', '<='],
        ['gt', '>'],
        ['gte', '>='],
        ['eq', '==='],
        ['neq', '!=='],
        ['band', '&'],
        ['bor', '|'],
        ['bxor', '^'],
        ['and', '&&'],
        ['or', '||']
    ];

    var unaryOps = [
        ['neg', '-'],
        ['not', '!'],
        ['comp', '~'],
        ['inv', '1 / ']
    ];

    // For easier debugging of templates
    var runTemplate = function(template, data) {
        var code = _.template(template)(data);
        eval(code);
    };

    var makeCtor = function(type, dim, elements) {
        runTemplate(
            'VMath.<%= type %> = function(<%= Array.prototype.join.call(elements, ", ") %>) {\n' +
            '    var <%= type %> = new Float32Array(<%= dim %>);\n' +
            '<% _.times(dim, function(d) { %>' +
                '    <%= type %>[<%= d %>] = <%= elements[d] %>;\n' +
            '<% }) %>' +
            '    return <%= type %>;\n' +
            '};'
        , {type: type, dim: dim, elements: elements});

        runTemplate(
            'VMath.<%= type %>_zero = function() {\n' +
            '    return new Float32Array(<%= dim %>);\n' +
            '};'
        , {type: type, dim: dim});

        runTemplate(
            'VMath.<%= type %>_one = function() {\n' +
            '    var <%= type %> = new Float32Array(<%= dim %>);\n' +
            '<% _.times(dim, function(d) { %>' +
                '    <%= type %>[<%= d %>] = 1;\n' +
            '<% }) %>' +
            '    return <%= type %>;\n' +
            '};'
        , {type: type, dim: dim});

        runTemplate(
            'VMath.<%= type %>_s = function(s) {\n' +
            '    var <%= type %> = new Float32Array(<%= dim %>);\n' +
            '<% _.times(dim, function(d) { %>' +
                '    <%= type %>[<%= d %>] = s;\n' +
            '<% }) %>' +
            '    return <%= type %>;\n' +
            '};'
        , {type: type, dim: dim});

    };

    var makeVecUnaryOp = function(name, op, dim) {
        var params = {name: name, op: op, dim: dim};

        runTemplate(
            'VMath.<%= name %>_v<%= dim %> = function(v, out) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    out[<%= d %>] = <%= op %>v[<%= d %>];\n' +
            '<% }) %>' +
            '};'
        , params);

        runTemplate(
            'VMath._<%= name %>_v<%= dim %> = function(v) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    v[<%= d %>] = <%= op %>v[<%= d %>];\n' +
            '<% }) %>' +
            '};'
        , params);
    };

    var makeVecBinaryOp = function(name, op, dim) {
        var params = {name: name, op: op, dim: dim};

        runTemplate(
            'VMath.<%= name %>_v<%= dim %> = function(a, b, out) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    out[<%= d %>] = a[<%= d %>] <%= op %> b[<%= d %>];\n' +
            '<% }) %>' +
            '};'
        , params);

        runTemplate(
            'VMath._<%= name %>_v<%= dim %> = function(a, b) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    a[<%= d %>] = a[<%= d %>] <%= op %> b[<%= d %>];\n' +
            '<% }) %>' +
            '};'
        , params);

        runTemplate(
            'VMath.<%= name %>_v<%= dim %>_s = function(v, s, out) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    out[<%= d %>] = v[<%= d %>] <%= op %> s;\n' +
            '<% }) %>' +
            '};'
        , params);

        runTemplate(
            'VMath._<%= name %>_v<%= dim %>_s = function(v, s) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    v[<%= d %>] = v[<%= d %>] <%= op %> s;\n' +
            '<% }) %>' +
            '};'
        , params);

        runTemplate(
            'VMath.<%= name %>_s_v<%= dim %> = function(s, v, out) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    out[<%= d %>] = s <%= op %> v[<%= d %>];\n' +
            '<% }) %>' +
            '};'
        , params);
    };

    var makeVecDot = function(dim) {
        runTemplate(
            'VMath.dot_v<%= dim %> = function(a, b) {\n' +
            '    return ' +
            '<% _.times(dim, function(d) { %>' +
                    '<%= d > 0 ? "+ " : "" %>a[<%= d %>] * b[<%= d %>]' +
            '<% }) %>;\n' +
            '};'
        , {dim: dim});
    };

    var makeVecLength = function(dim) {
        runTemplate(
            'VMath.length_v<%= dim %> = function(v) {\n' +
            '    return Math.sqrt(' +
            '<% _.times(dim, function(d) { %>' +
                    '<%= d > 0 ? "+ " : "" %>v[<%= d %>] * v[<%= d %>]' +
            '<% }) %>);\n' +
            '};'
        , {dim: dim});
    };

    var makeVecDistance = function(dim) {
        runTemplate(
            'VMath.distance_v<%= dim %> = function(a, b) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    var <%= elements[d] %> = b[<%= d %>] - a[<%= d %>];\n' +
            '<% }) %>' +
            '    return Math.sqrt(' +
            '<% _.times(dim, function(d) { %>' +
                    '<%= d > 0 ? "+ " : "" %><%= elements[d] %> * <%= elements[d] %>' +
            '<% }) %>);\n' +
            '};'
        , {dim: dim, elements: vecElements});
    };

    var makeVecUnit = function(dim) {
        runTemplate(
            'VMath.unit_v<%= dim %> = function(v, out) {\n' +
            '    VMath.mul_v<%= dim %>_s(v, 1 / (VMath.length_v<%= dim %>(v) + Number.MIN_VALUE), out);\n' +
            '};'
        , {dim: dim});

        runTemplate(
            'VMath._unit_v<%= dim %> = function(v) {\n' +
            '    VMath._mul_v<%= dim %>_s(v, 1 / (VMath.length_v<%= dim %>(v) + Number.MIN_VALUE));\n' +
            '};'
        , {dim: dim});
    };

    var makeVecLerp = function(dim) {
        var params = {dim: dim};

        runTemplate(
            'VMath.lerp_v<%= dim %> = function(a, b, t, out) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    out[<%= d %>] = a[<%= d %>] + (b[<%= d %>] - a[<%= d %>]) * t[<%= d %>];\n' +
            '<% }) %>' +
            '};'
        , params);

        runTemplate(
            'VMath.lerp_v<%= dim %>_s = function(a, b, t, out) {\n' +
            '<% _.times(dim, function(d) { %>' +
            '    out[<%= d %>] = a[<%= d %>] + (b[<%= d %>] - a[<%= d %>]) * t;\n' +
            '<% }) %>' +
            '};'
        , params);
    };

    for (var dim = 2; dim <= 4; ++dim) {
        makeCtor('v' + dim, dim, vecElements);
        _.forEach(unaryOps, function(opDesc) {
            makeVecUnaryOp(opDesc[0], opDesc[1], dim);
        });
        _.forEach(binaryOps, function(opDesc) {
            makeVecBinaryOp(opDesc[0], opDesc[1], dim);
        });
        makeVecDot(dim);
        makeVecLength(dim);
        makeVecDistance(dim);
        makeVecUnit(dim);
        makeVecLerp(dim);
    }

    VMath.project_v4 = function(v, out) {
        out[0] = v[0] / v[3];
        out[1] = v[1] / v[3];
        out[2] = v[2] / v[3];
    };

    makeCtor('m4', 16, matrixElements);

    VMath.m4_identity = function() {
        return VMath.m4_scale4(1,1,1,1);
    };

    VMath.m4_scale4 = function(x, y, z, w) {
        var result = new Float32Array(16);
        result[0] = x;
        result[5] = y;
        result[10] = z;
        result[15] = w;
        return result;
    };

    VMath.m4_offset4 = function(x, y, z, w) {
        var result = VMath.m4_identity();
        result[3] = x;
        result[7] = y;
        result[11] = z;
        result[15] = w;
        return result;
    };

    VMath.v4_row_m4 = function(m, row) {
        var offset = row * 4;
        return VMath.v4(m[offset], m[offset + 1], m[offset + 2], m[offset + 3]);
    };

    VMath.v4_col_m4 = function(m, col) {
        return VMath.v4(m[col], m[col + 4], m[col + 8], m[col + 12]);
    };

    VMath.dot_m4_row_m4_col = function(a, row, b, col) {
        var offset = row * 4;
        return a[offset    ] * b[col     ] +
               a[offset + 1] * b[col +  4] +
               a[offset + 2] * b[col +  8] +
               a[offset + 3] * b[col + 12];
    };

    VMath.dot_m4_row_v4 = function(m, row, v) {
        var offset = row * 4;
        return m[offset    ] * v[0] +
               m[offset + 1] * v[1] +
               m[offset + 2] * v[2] +
               m[offset + 3] * v[3];
    };

    VMath.dot_m4_row_v3 = function(m, row, v) {
        var offset = row * 4;
        return m[offset    ] * v[0] +
               m[offset + 1] * v[1] +
               m[offset + 2] * v[2] +
               m[offset + 3];
    };

    VMath.concat_m4 = function(a, b, out) {
        out[ 0] = VMath.dot_m4_row_m4_col(a, 0, b, 0);
        out[ 1] = VMath.dot_m4_row_m4_col(a, 0, b, 1);
        out[ 2] = VMath.dot_m4_row_m4_col(a, 0, b, 2);
        out[ 3] = VMath.dot_m4_row_m4_col(a, 0, b, 3);

        out[ 4] = VMath.dot_m4_row_m4_col(a, 1, b, 0);
        out[ 5] = VMath.dot_m4_row_m4_col(a, 1, b, 1);
        out[ 6] = VMath.dot_m4_row_m4_col(a, 1, b, 2);
        out[ 7] = VMath.dot_m4_row_m4_col(a, 1, b, 3);

        out[ 8] = VMath.dot_m4_row_m4_col(a, 2, b, 0);
        out[ 9] = VMath.dot_m4_row_m4_col(a, 2, b, 1);
        out[10] = VMath.dot_m4_row_m4_col(a, 2, b, 2);
        out[11] = VMath.dot_m4_row_m4_col(a, 2, b, 3);

        out[12] = VMath.dot_m4_row_m4_col(a, 3, b, 0);
        out[13] = VMath.dot_m4_row_m4_col(a, 3, b, 1);
        out[14] = VMath.dot_m4_row_m4_col(a, 3, b, 2);
        out[15] = VMath.dot_m4_row_m4_col(a, 3, b, 3);
    };

    VMath.transform_m4 = function(m, v, out) {
        out[0] = VMath.dot_m4_row_v4(m, 0, v);
        out[1] = VMath.dot_m4_row_v4(m, 1, v);
        out[2] = VMath.dot_m4_row_v4(m, 2, v);
        out[3] = VMath.dot_m4_row_v4(m, 3, v);
    };

    VMath.transform_m4_v3 = function(m, v, out) {
        out[0] = VMath.dot_m4_row_v3(m, 0, v);
        out[1] = VMath.dot_m4_row_v3(m, 1, v);
        out[2] = VMath.dot_m4_row_v3(m, 2, v);
        out[3] = VMath.dot_m4_row_v3(m, 3, v);
    };

    return VMath;
});
