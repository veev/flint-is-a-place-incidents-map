import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { select } from 'd3-selection'
import { transition } from 'd3-transition' // need this for transitions even though VS Code and browser think it's unused
import { Radio } from 'antd'
import InfographicLegend from './components/InfographicLegend'

import { makeTimeSeriesChart } from './graph-functions/makeTimeSeriesChart'
import { updateChart } from './graph-functions/updateChart'
import { setDimensions } from './graph-functions/setDimensions'
import { setScales } from './graph-functions/setScales'
import { setAxes } from './graph-functions/setAxes'

const margin = {top: 20, right: 20, bottom: 20, left: 40}
const padding = {top: 30, right: 30, bottom: 30, left: 30}
const leftChartMargin = 70

const RadioGroup = Radio.Group

export default class GraphAreaD3 extends Component {

  constructor(props) {
    super(props)

    this.state = {
      value: 1
    }
    this.dimensions = {}
    this.scales = {}
    this.axes = {}
  }

  componentDidMount() {
    // INIT
    this.dimensions = setDimensions(this.props.size, margin, leftChartMargin)
    this.scales = setScales(this.props.staticData, this.dimensions, margin)
    this.createBarChart(this.props.staticData)
  }

  componentDidUpdate() {
    this.dimensions = setDimensions(this.props.size, margin, leftChartMargin)
    this.scales = setScales(this.props.staticData, this.dimensions, margin)
    const node = this.node
    const axisNode = this.axisNode
    const yLabelNode = this.yLabelNode
    updateChart(this.props.staticData, 
      this.state.value, 
      node, axisNode, yLabelNode, 
      this.dimensions, 
      margin, 
      padding,
      this.scales,
      this.axes)
  }

  createBarChart = (data) => {
    const node = this.node
    const axisNode = this.axisNode
    const yLabelNode = this.yLabelNode
    document.getElementById("chart").style.overflowY = "hidden"

    const svg = select(node)
      .attr('width', this.props.size[0] - leftChartMargin - margin.right)
      .attr('height', 3214)
          
    const g = svg.append('g')
      .attr('class', 'g-wrapper')

    const xAxisSVG = select(axisNode)
    const yAxisText = select(yLabelNode)

    // Define the div for the tooltip
    let div = select("body").append("div") 
      .attr("class", "tooltip oldTooltipPos")
      .style("opacity", 0)

    this.axes = setAxes(g, xAxisSVG, yAxisText, this.state.value, this.scales, this.dimensions, margin, padding)
    makeTimeSeriesChart(data, this.scales, g, margin, div)
  }

  // Change Radio Button target value (viz type)
  onChange = (e) => {
    const node = this.node
    const axisNode = this.axisNode
    const yLabelNode = this.yLabelNode
    this.setState({
      value: e.target.value,
    }, updateChart(this.props.staticData, 
      e.target.value, 
      node, axisNode, yLabelNode, 
      this.dimensions, 
      margin, 
      padding,
      this.scales,
      this.axes))
  }

  render() {
    const radioStyle = {
      display: 'block',
      height: '25px',
      lineHeight: '25px',
    }

    return (
      <div className="incidents-wrapper">
        <div className="graph-area-radio-buttons">
          <RadioGroup onChange={this.onChange} value={this.state.value} className='button-group' style={{display: 'flex'}}>
            <div style={{width: '280px'}}>
              <Radio style={radioStyle} value={1}>Sort by Time of Incident</Radio>
              <Radio style={radioStyle} value={5}>Sort by Type of Incident</Radio>
              <Radio style={radioStyle} value={2}>Sort by Duration of Waiting Time</Radio>
              <Radio style={radioStyle} value={3}>Sort by Duration of Time On Scene</Radio>
              <Radio style={radioStyle} value={4}>Sort by Duration of Total Incident</Radio>
            </div>
            <InfographicLegend />
          </RadioGroup>
        </div>
        <div className="graph-area-wrapper">
          <div className="graph-yLabel" style={{width: leftChartMargin, height: this.props.size[1]}}>
            <svg width={leftChartMargin} height={this.props.size[1]} ref={yNode => this.yLabelNode = yNode}></svg>
          </div>
          <div id="chart" className="graph-area-zone" style={{width: (this.props.size[0] - leftChartMargin - margin.right), height: this.props.size[1]}}>
            <svg ref={node => this.node = node}></svg>
          </div>
        </div>
        <div className="graph-xaxis">
          <svg width={this.props.size[0]} height={80} ref={xNode => this.axisNode = xNode}></svg>
        </div>
      </div>
    )
  }
}

GraphAreaD3.propTypes = {
  size: PropTypes.arrayOf(PropTypes.number),
  staticData: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['Feature']).isRequired,
      properties: PropTypes.shape({
        eventNumber: PropTypes.string.isRequired
      }),
      geometry: PropTypes.shape({
        type: PropTypes.oneOf(['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection']).isRequired,
        coordinates: PropTypes.oneOfType([
          PropTypes.arrayOf(PropTypes.number), // For Point
          PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)), // For LineString and MultiPoint
          PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))), // For Polygon and MultiLineString
          PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)))), // For MultiPolygon
        ]).isRequired,
      }).isRequired,
    })
  ),
  currentTime: PropTypes.number,
  dateRange: PropTypes.arrayOf(PropTypes.number)
}