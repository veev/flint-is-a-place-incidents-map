import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { ProgressBar } from 'react-player-controls'
import { scaleTime } from 'd3-scale'
import { axisBottom } from 'd3-axis'
import { timeHour } from 'd3-time'
import { timeFormat } from 'd3-time-format'
import { select } from 'd3-selection'

export default class Timeline extends Component {
	constructor(props) {
    super(props)

    this.state = {
      totalTime: this.props.totalTime,
      currentTime: this.props.currentTime,
      isSeekable: true,
      lastSeekStart: this.props.currentTime,
      lastSeekEnd: this.props.currentTime,
    } 
  }

  render() {

    const { isSeekable } = this.state
    const { currentTime, totalTime, formattedTime, dateRange, startState, axisWidth  } = this.props

    const xScale = scaleTime()
      .range([20, axisWidth - 20])
      .domain(dateRange)

    const xAxis = axisBottom()
          .scale(xScale)
          .tickFormat(timeFormat('%I %p'))
          .ticks(timeHour.every(2))
    const widthOfAxis = axisWidth > 40 ? axisWidth - 40 : 0

    return (
      <div className={['Timeline', !startState && 'show'].join(' ')}>
        <div className="ControlArea" ref={ref => {this.controlAreaDiv = ref} }>
          <svg width={widthOfAxis} height={25} transform={'translate(20, 0)'}>
            <g className="axis timeline-axis" width={widthOfAxis} height={25} ref={node => select(node).call(xAxis)} />
          </svg>
          <ProgressBar
            totalTime={totalTime}
            currentTime={currentTime}
            isSeekable={isSeekable}
            onSeek={this.props.handleSeek}
            onSeekStart={this.props.handleSeekStart}
            onSeekEnd={this.props.handleSeekEnd}
          />
          <div className="timelineInfo">
            <div className="time">{formattedTime}</div>
          </div>
        </div>
      </div>
    )
  }
}

Timeline.propTypes = {
  lastSeekStart: PropTypes.number,
  lastSeekEnd: PropTypes.number,
  handleSeek: PropTypes.func,
  handleSeekStart: PropTypes.func,
  handleSeekEnd: PropTypes.func,
  currentTime: PropTypes.number,
  totalTime: PropTypes.number,
  formattedTime: PropTypes.string,
  staticData: PropTypes.array,
  activeData: PropTypes.array,
  dateRange: PropTypes.arrayOf(PropTypes.number),
  axisWidth: PropTypes.number,
  startState: PropTypes.bool
}