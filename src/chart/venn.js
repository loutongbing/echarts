/**
 * echarts图表类：漏斗图
 *
 * @desc echarts基于Canvas，纯Javascript图表库，提供直观，生动，可交互，可个性化定制的数据统计图表。
 * @author Kener (@Kener-林峰, linzhifeng@baidu.com)
 *
 */
define(function (require) {
    var ComponentBase = require('../component/base');
    var ChartBase = require('./base');

    // 图形依赖
    var TextShape = require('zrender/shape/Text');
    var LineShape = require('zrender/shape/Line');
    var RectangleShape = require('zrender/shape/Rectangle');
    var PolygonShape = require('zrender/shape/Polygon');
    var CircleShape = require('zrender/shape/Circle');
    var SectorShape = require('zrender/shape/Sector');

    var ecConfig = require('../config');
    var ecData = require('../util/ecData');
    var number = require('../util/number');
    var zrUtil = require('zrender/tool/util');
    var zrMath = require('zrender/tool/math');
    var zrColor = require('zrender/tool/color');
    var zrArea = require('zrender/tool/area');

    /**
     * 构造函数
     * @param {Object} messageCenter echart消息中心
     * @param {ZRender} zr zrender实例
     * @param {Object} series 数据
     * @param {Object} component 组件
     */
    function Venn(ecTheme, messageCenter, zr, option, myChart){
        // 基类
        ComponentBase.call(this, ecTheme, messageCenter, zr, option, myChart);
        // 图表基类
        ChartBase.call(this);
        this.refresh(option);
    }

    Venn.prototype = {
        type : ecConfig.CHART_TYPE_VENN,
        /**
         * 绘制图形
         */
        _buildShape : function () {
            var series = this.series;
            var legend = this.component.legend;
            // 复用参数索引
            this._paramsMap = {};
            this._selected = {};
            this.selectedMap = {};

            var serieName;

            this.data = series[0].data;
            this._buildVenn();
            this.addShapeList();
        },

        /**
         * 构建单个
         *
         * @param {number} seriesIndex 系列索引
         */
        _buildVenn : function () {
            var legend = this.component.legend;
            var data = this.data



            var itemName;
            var selectedData = [];

            var r0;
            var r1;
            if (data[0].value > data[1].value) {
                r0 = this.zr.getHeight()/3;
                r1 = r0 * Math.sqrt(data[1].value) / Math.sqrt(data[0].value);
            }
            else {
                r1 = this.zr.getHeight()/3;
                r0 = r1 * Math.sqrt(data[0].value) / Math.sqrt(data[1].value);
            }

            var x0 = this.zr.getWidth()/2 - r0;
            var coincideLength = ((r0+r1)/2)*Math.sqrt(data[2].value)/Math.sqrt((data[0].value+data[1].value)/2);
           // var coincideLengthAnchor = r0*Math.sqrt(data[2].value)/Math.sqrt((data[0].value+data[1].value)/2);

            var coincideLengthAnchor = ((r0+r1)/2)*Math.sqrt(data[2].value)/Math.sqrt((data[0].value+data[1].value)/2);



            // var coincideLengthAnchor = r0;

            var coincideLength = this._getCoincideLength(
                data[0].value,
                data[1].value,
                data[2].value,
                r0, r1,
                coincideLengthAnchor,
                Math.abs(r0 - r1),
                r0 + r1);


            var x1 = x0 +  coincideLength;
            var y = this.zr.getHeight()/2;

            this._buildItem(
                0, 0,
                this.zr.getColor(0),
                x0,
                y,
                r0
            );
            this._buildItem(
                1, 1,
                this.zr.getColor(1),
                x1,
                y,
                r1
            );

            this._paramsMap = [
                {
                    location : {
                        x: x0,
                        y: y,
                        r: r0
                    }
                },
                {
                    location : {
                        x: x1,
                        y: y,
                        r: r1
                    }
                }
            ];




        },
        _getCoincideLength: function (value0, value1, value3, r0, r1, coincideLengthAnchor, coincideLengthAnchorMin, coincideLengthAnchorMax) {
            var x = (r0*r0 - r1*r1)/(2*coincideLengthAnchor) + coincideLengthAnchor/2;
            var y = coincideLengthAnchor/2 - (r0*r0 - r1*r1)/(2*coincideLengthAnchor);
            var alfa = Math.acos(x/r0);
            var beta = Math.acos(y/r1);
            var scaleAnchor = (alfa*r0*r0 - x*r0*Math.sin(alfa) + beta*r1*r1 - y*r1*Math.sin(beta))/(r0*r0*Math.PI);
            var scale = value3/value0;
            var approximateValue = Math.abs(scaleAnchor/scale);
            if (approximateValue > 0.999 && approximateValue < 1.001) {
                return coincideLengthAnchor;
            }
            // 若是公共面积比较小，使距离减小一些，让公共面积增大
            else if (approximateValue <= 0.999) {
                var coincideLengthAnchorMax = coincideLengthAnchor;
                coincideLengthAnchor = (coincideLengthAnchor + coincideLengthAnchorMin)/2;
                return this._getCoincideLength(value0, value1, value3, r0, r1,
                    coincideLengthAnchor, coincideLengthAnchorMin, coincideLengthAnchorMax);
            }
            // 若是公共面积比较大，使距离增大一些，让公共面积减小
            else {
                var coincideLengthAnchorMin = coincideLengthAnchor;
                coincideLengthAnchor = (coincideLengthAnchor + coincideLengthAnchorMax)/2;
                return this._getCoincideLength(value0, value1, value3, r0, r1,
                    coincideLengthAnchor, coincideLengthAnchorMin, coincideLengthAnchorMax);
            }
        },

        _getLocation: function (seriesIndex) {
            var gridOption = this.series[seriesIndex];
            var zrWidth = this.zr.getWidth();
            var zrHeight = this.zr.getHeight();
            var x = this.parsePercent(gridOption.x, zrWidth);
            var y = zrHeight/2;

            var width;
            if (typeof gridOption.width == 'undefined') {
                width = zrWidth - x - this.parsePercent(gridOption.x2, zrWidth);
            }
            else {
                width = this.parsePercent(gridOption.width, zrWidth);
            }

            var height;
            if (typeof gridOption.height == 'undefined') {
                height = zrHeight - y - this.parsePercent(gridOption.y2, zrHeight);
            }
            else {
                height = this.parsePercent(gridOption.height, zrHeight);
            }

            return {
                x : x,
                y : y,
                width : width,
                height : height,
                centerX : x + width / 2
            }
        },

        _mapData : function(seriesIndex) {
            var serie = this.series[seriesIndex];
            var vennData = zrUtil.clone(serie.data);
            for (var i = 0, l = vennData.length; i < l; i++) {
                vennData[i]._index = i;
            }
            return vennData;
        },

        /**
         * 构建单个扇形及指标
         */
        _buildItem : function (
            seriesIndex, dataIndex, defaultColor,
            x, y, r
        ) {
            var series = this.series;
            var serie = series[seriesIndex];
            var data = this.data[dataIndex];

            var circle = this.getCircle(
                    seriesIndex, dataIndex, defaultColor,
                    x, y, r
                );
            ecData.pack(
                circle,
                series[0], seriesIndex,
                series[0].data[dataIndex], dataIndex,
                series[0].data[dataIndex].name
            );
            this.shapeList.push(circle);

            // 文本标签
            /*var label = this.getLabel(
                    seriesIndex, dataIndex, defaultColor,
                    x, y, r, 100, 100
                );
            ecData.pack(
                label,
                series[seriesIndex], seriesIndex,
                series[seriesIndex].data[dataIndex], dataIndex,
                series[seriesIndex].data[dataIndex].name
            );
            this.shapeList.push(label);
            // 特定状态下是否需要显示文本标签
            if (!this._needLabel(serie, data,false)) {
                label.invisible = true;
            }

            // 文本标签视觉引导线
            var labelLine = this.getLabelLine(
                    seriesIndex, dataIndex, defaultColor,
                    x, y, 100, 20, 100
                );
            this.shapeList.push(labelLine);
            // 特定状态下是否需要显示文本标签引导线
            if (!this._needLabelLine(serie, data,false)) {
                labelLine.invisible = true;
            }

            var polygonHoverConnect = [];
            var labelHoverConnect = [];
            if (this._needLabelLine(serie, data, true)) {
                // polygonHoverConnect.push(labelLine.id);
                labelHoverConnect.push(labelLine.id);
            }
            if (this._needLabel(serie, data, true)) {
                // polygonHoverConnect.push(label.id);
                // labelHoverConnect.push(polygon.id);
            }
            // polygon.hoverConnect = polygonHoverConnect;
            label.hoverConnect = labelHoverConnect;
            // polygon.onmouseover = label.onmouseover = this.hoverConnect;*/
        },

        /**
         * 根据值计算宽度
         */
        _getItemWidth : function (seriesIndex, value) {
            var serie = this.series[seriesIndex];
            var location = this._paramsMap[seriesIndex].location;
            var min = serie.min;
            var max = serie.max;
            var minSize = number.parsePercent(serie.minSize, location.width);
            var maxSize = number.parsePercent(serie.maxSize, location.width);
            return value * (maxSize - minSize) / (max - min);
        },

        /**
         * 构建圆形
         */
        getCircle : function (
            seriesIndex, dataIndex, defaultColor,
            x, y, r
        ) {
            var serie = this.series[seriesIndex];
            var data = this.data[dataIndex];
            var queryTarget = [data, serie];

            // 多级控制
            var normal = this.deepMerge(
                queryTarget,
                'itemStyle.normal'
            ) || {};
            var emphasis = this.deepMerge(
                queryTarget,
                'itemStyle.emphasis'
            ) || {};
            var normalColor = this.getItemStyleColor(normal.color, seriesIndex, dataIndex, data)
                              || defaultColor;

            var emphasisColor = this.getItemStyleColor(emphasis.color, seriesIndex, dataIndex, data)
                || (typeof normalColor == 'string'
                    ? zrColor.lift(normalColor, -0.2)
                    : normalColor
                );

            var circle = {
                zlevel : this._zlevelBase,
                clickable : true,
                style : {
                    x : x,
                    y : y,
                    r : r,
                    brushType : 'fill',
                    opacity: 0.5,
                    color : normalColor,
                    lineWidth : normal.borderWidth,
                    strokeColor : normal.borderColor
                },
                highlightStyle : {
                    color : emphasisColor,
                    lineWidth : emphasis.borderWidth,
                    strokeColor : emphasis.borderColor
                }
            };

            if (this.deepQuery([data, serie, this.option], 'calculable')) {
                this.setCalculable(circle);
                circle.draggable = true;
            }

            // return new PolygonShape(polygon);
            return new CircleShape(circle);

        },

        /**
         * 需要显示则会有返回构建好的shape，否则返回undefined
         */
        getLabel : function (
            seriesIndex, dataIndex, defaultColor,
            x, y, topWidth, bottomWidth, height
        ) {
            var serie = this.series[seriesIndex];
            var data = serie.data[dataIndex];
            var location = this._paramsMap[seriesIndex].location;
            // serie里有默认配置，放心大胆的用！
            var itemStyle = zrUtil.merge(
                    zrUtil.clone(data.itemStyle) || {},
                    serie.itemStyle
                );
            var status = 'normal';
            // label配置
            var labelControl = itemStyle[status].label;
            var textStyle = labelControl.textStyle || {};
            var lineLength = itemStyle[status].labelLine.length;

            var text = this.getLabelText(seriesIndex, dataIndex, status);
            var textFont = this.getFont(textStyle);
            var textAlign;
            var textX;
            var textColor = defaultColor;
            labelControl.position = labelControl.position
                                    || itemStyle.normal.label.position;
            if (labelControl.position == 'inner' || labelControl.position == 'inside') {
                // 内部
                textAlign = 'center';
                textX = x + topWidth / 2;
                if (Math.max(topWidth, bottomWidth) / 2 > zrArea.getTextWidth(text, textFont)) {
                    textColor = '#fff';
                }
                else {
                    textColor = zrColor.reverse(defaultColor);
                }
            }
            else if (labelControl.position == 'left'){
                // 左侧显示
                textAlign = 'right';
                textX = lineLength == 'auto'
                        ? (location.x - 10)
                        : (location.centerX - Math.max(topWidth, bottomWidth) / 2 - lineLength);
            }
            else {
                // 右侧显示，默认 labelControl.position == 'outer' || 'right)
                textAlign = 'left';
                textX = lineLength == 'auto'
                        ? (location.x + location.width + 10)
                        : (location.centerX + Math.max(topWidth, bottomWidth) / 2 + lineLength);
            }

            var textShape = {
                zlevel : this._zlevelBase + 1,
                style : {
                    x : textX,
                    y : y + height / 2,
                    color : textStyle.color || textColor,
                    text : text,
                    textAlign : textStyle.align || textAlign,
                    textBaseline : textStyle.baseline || 'middle',
                    textFont : textFont
                }
            };

            //----------高亮
            status = 'emphasis';
            // label配置
            labelControl = itemStyle[status].label || labelControl;
            textStyle = labelControl.textStyle || textStyle;
            lineLength = itemStyle[status].labelLine.length || lineLength;
            labelControl.position = labelControl.position || itemStyle.normal.label.position;
            text = this.getLabelText(seriesIndex, dataIndex, status);
            textFont = this.getFont(textStyle);
            textColor = defaultColor;
            if (labelControl.position == 'inner' || labelControl.position == 'inside') {
                // 内部
                textAlign = 'center';
                textX = x + topWidth / 2;
                if (Math.max(topWidth, bottomWidth) / 2 > zrArea.getTextWidth(text, textFont)) {
                    textColor = '#fff';
                }
                else {
                    textColor = zrColor.reverse(defaultColor);
                }
            }
            else if (labelControl.position == 'left'){
                // 左侧显示
                textAlign = 'right';
                textX = lineLength == 'auto'
                        ? (location.x - 10)
                        : (location.centerX - Math.max(topWidth, bottomWidth) / 2 - lineLength);
            }
            else {
                // 右侧显示，默认 labelControl.position == 'outer' || 'right)
                textAlign = 'left';
                textX = lineLength == 'auto'
                        ? (location.x + location.width + 10)
                        : (location.centerX + Math.max(topWidth, bottomWidth) / 2 + lineLength);
            }
            textShape.highlightStyle  = {
                x : textX,
                color : textStyle.color || textColor,
                text : text,
                textAlign : textStyle.align || textAlign,
                textFont : textFont,
                brushType : 'fill'
            }

            return new TextShape(textShape);
        },

        /**
         * 根据lable.format计算label text
         */
        getLabelText : function (seriesIndex, dataIndex, status) {
            var series = this.series;
            var serie = series[seriesIndex];
            var data = serie.data[dataIndex];
            var formatter = this.deepQuery(
                [data, serie],
                'itemStyle.' + status + '.label.formatter'
            );

            if (formatter) {
                if (typeof formatter == 'function') {
                    return formatter(
                        serie.name,
                        data.name,
                        data.value
                    );
                }
                else if (typeof formatter == 'string') {
                    formatter = formatter.replace('{a}','{a0}')
                                         .replace('{b}','{b0}')
                                         .replace('{c}','{c0}');
                    formatter = formatter.replace('{a0}', serie.name)
                                         .replace('{b0}', data.name)
                                         .replace('{c0}', data.value);

                    return formatter;
                }
            }
            else {
                return data.name;
            }
        },

        /**
         * 需要显示则会有返回构建好的shape，否则返回undefined
         */
        getLabelLine : function (
            seriesIndex, dataIndex, defaultColor,
            x, y, topWidth, bottomWidth, height
        ) {
            var serie = this.series[seriesIndex];
            var data = serie.data[dataIndex];
            var location = this._paramsMap[seriesIndex].location;

            // serie里有默认配置，放心大胆的用！
            var itemStyle = zrUtil.merge(
                    zrUtil.clone(data.itemStyle) || {},
                    serie.itemStyle
                );
            var status = 'normal';
            // labelLine配置
            var labelLineControl = itemStyle[status].labelLine;
            var lineLength = itemStyle[status].labelLine.length;
            var lineStyle = labelLineControl.lineStyle || {};

            var labelControl = itemStyle[status].label;
            labelControl.position = labelControl.position
                                    || itemStyle.normal.label.position;
            var xEnd;
            if (labelControl.position == 'inner' || labelControl.position == 'inside') {
                // 内部
                xEnd = x + topWidth / 2;
            }
            else if (labelControl.position == 'left'){
                // 左侧显示
                xEnd = lineLength == 'auto'
                       ? (location.x - 10)
                       : (location.centerX - Math.max(topWidth, bottomWidth) / 2 - lineLength);
            }
            else {
                // 右侧显示，默认 labelControl.position == 'outer' || 'right)
                xEnd = lineLength == 'auto'
                       ? (location.x + location.width + 10)
                       : (location.centerX + Math.max(topWidth, bottomWidth) / 2 + lineLength);
            }
            var lineShape = {
                zlevel : this._zlevelBase + 1,
                hoverable : false,
                style : {
                    xStart : location.centerX,
                    yStart : y + height / 2,
                    xEnd : xEnd,
                    yEnd : y + height / 2,
                    strokeColor : lineStyle.color || defaultColor,
                    lineType : lineStyle.type,
                    lineWidth : lineStyle.width
                }
            };

            status = 'emphasis';
            // labelLine配置
            labelLineControl = itemStyle[status].labelLine || labelLineControl;
            lineLength = itemStyle[status].labelLine.length || lineLength;
            lineStyle = labelLineControl.lineStyle || lineStyle;

            labelControl = itemStyle[status].label || labelControl;
            labelControl.position = labelControl.position;
            if (labelControl.position == 'inner' || labelControl.position == 'inside') {
                // 内部
                xEnd = x + topWidth / 2;
            }
            else if (labelControl.position == 'left'){
                // 左侧显示
                xEnd = lineLength == 'auto'
                       ? (location.x - 10)
                       : (location.centerX - Math.max(topWidth, bottomWidth) / 2 - lineLength);
            }
            else {
                // 右侧显示，默认 labelControl.position == 'outer' || 'right)
                xEnd = lineLength == 'auto'
                       ? (location.x + location.width + 10)
                       : (location.centerX + Math.max(topWidth, bottomWidth) / 2 + lineLength);
            }
            lineShape.highlightStyle = {
                xEnd : xEnd,
                strokeColor : lineStyle.color || defaultColor,
                lineType : lineStyle.type,
                lineWidth : lineStyle.width
            };

            return new LineShape(lineShape)
        },

        /**
         * 返回特定状态（normal or emphasis）下是否需要显示label标签文本
         * @param {Object} serie
         * @param {Object} data
         * @param {boolean} isEmphasis true is 'emphasis' and false is 'normal'
         */
        _needLabel : function (serie, data, isEmphasis) {
            return this.deepQuery(
                [data, serie],
                'itemStyle.'
                + (isEmphasis ? 'emphasis' : 'normal')
                + '.label.show'
            );
        },

        /**
         * 返回特定状态（normal or emphasis）下是否需要显示labelLine标签视觉引导线
         * @param {Object} serie
         * @param {Object} data
         * @param {boolean} isEmphasis true is 'emphasis' and false is 'normal'
         */
        _needLabelLine : function (serie, data, isEmphasis) {
            return this.deepQuery(
                [data, serie],
                'itemStyle.'
                + (isEmphasis ? 'emphasis' : 'normal')
                +'.labelLine.show'
            );
        },

        /**
         * 刷新
         */
        refresh : function (newOption) {
            if (newOption) {
                this.option = newOption;
                this.series = newOption.series;
            }

            this.backupShapeList();
            this._buildShape();
        }
    };

    zrUtil.inherits(Venn, ChartBase);
    zrUtil.inherits(Venn, ComponentBase);

    // 图表注册
    require('../chart').define('venn', Venn);

    return Venn;
});
