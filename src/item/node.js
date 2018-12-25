/**
 * @fileOverview node item
 * @author huangtonger@aliyun.com
 */

const Util = require('../util/');
const Item = require('./item');

class Node extends Item {
  getDefaultCfg() {
    return {
      type: 'node',
      anchors: [],
      adjacent: [],
      status: []
    };
  }
  _addNeighbor(node) {
    const adjacent = this.get('adjacent');
    if (adjacent.indexOf(node) < 0) {
      adjacent.push(node);
    }
    return this;
  }
  _removeNeighbor(node) {
    const adjacent = this.get('adjacent');
    const i = adjacent.indexOf(node);
    if (i >= 0) {
      adjacent.splice(i, 1);
    }
    return this;
  }
  getNeighbors() {
    return this.get('adjacent');
  }
  getEdges() {
    const edges = this.get('graph').edges;
    return edges.filter(edge => {
      const model = edge.get('model');
      return model.source === this.id || model.target === this.id;
    });
  }
  getInEdges() {
    return this.getEdges().filter(edge => {
      return edge.get('target') === this;
    });
  }
  getOutEdges() {
    return this.getEdges().filter(edge => {
      return edge.get('source') === this;
    });
  }
  showAnchor() {
    // todo
  }
  hideAnchor() {}
  /**
    * get anchor points, if there is anchors return the points sorted by arc , others return the link point
    * @param {Object | Number} point - start point
    * @return {array} - all anchor points sorted by angle, ASC
    */
  getLinkPoints(point) {
    const anchorPoints = this.getAnchorPoints();
    if (Util.isNumber(point) && anchorPoints[point]) {
      return [ anchorPoints[point] ];
    }
    const { x, y } = point;
    const bbox = this.getBBox();
    const { centerX, centerY } = bbox;
    const x1 = x - centerX;
    const y1 = y - centerY;
    const shapeObj = this.shapeObj;
    const anchor = shapeObj.anchor || {};
    const defaultIntersectBox = this.defaultIntersectBox;
    let points = [];
    if (Util.isEmpty(anchorPoints)) {
      // get link point if there are no default anchors
      const intersectBox = shapeObj.intersectBox || anchor.intersectBox || anchor.type || defaultIntersectBox;

      switch (intersectBox) {
        case 'rect':
          points = [ Util.getIntersectPointRect(bbox, point) ];
          break;
        case 'path':
          if (this.keyShape && this.keyShape.get('type') === 'path') {
            const linePath = Util.parsePathArray([ 'M', x, y, 'L', centerX, centerY ]);
            points = [ Util.intersection(linePath, this.keyShape.get('path')) ];
          }
          break;
        default:
          // default circle
          points = [ Util.getIntersectPointCircle(x, y, bbox.centerX, bbox.centerY, Math.max(bbox.width, bbox.height) / 2) ];
          break;
      }
      // if no link points return center
      if (Util.isEmpty(points[0])) {
        points = [{
          x: centerX,
          y: centerY
        }];
      }
    } else {
      // get sorted points by arc if there are default points
      points = anchorPoints.map(p => {
        const x2 = p.x - centerX;
        const y2 = p.y - centerY;
        const arc = Util.getArcOfVectors({ x: x1, y: y1 }, { x: x2, y: y2 });
        return Util.mix({}, p, {
          arc
        });
      })
        .sort((a, b) => {
          return a.arc - b.arc;
        });
    }
    return points;
  }
  /**
   * get position of anchor points
   * @param {number} index the index of points
   * @return {array} anchorPoints
   */
  getAnchorPoints(index) {
    const shapeObj = this.shapeObj;
    const bbox = this.getBBox();
    const anchorPoints = [];
    const anchor = shapeObj.anchor || {};
    let points;
    if (Util.isArray(anchor)) {
      points = anchor;
    } else if (Util.isFunction(anchor)) {
      points = anchor(this);
    } else {
      if (Util.isFunction(anchor.points)) {
        points = anchor.points(this);
      } else {
        points = anchor.points;
      }
    }
    Util.each(points, (pointArr, index) => {
      const anchorPoint = Util.mix({
        x: bbox.minX + pointArr[0] * bbox.width,
        y: bbox.minY + pointArr[1] * bbox.height
      }, pointArr[2], {
        index
      });
      anchorPoints.push(anchorPoint);
    });
    this._anchorPoints = anchorPoints;
    if (Util.isNumber(index)) {
      return this._anchorPoints[index];
    }
    return this._anchorPoints;
  }
}
module.exports = Node;
