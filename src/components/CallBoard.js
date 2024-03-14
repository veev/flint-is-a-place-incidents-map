import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import moment from 'moment'
import momentDurationFormatSetup from 'moment-duration-format'
import { toTitleCase } from '../utils'
import { interpolateRgb } from 'd3-interpolate'
import { scaleLinear } from 'd3-scale'
import descriptionLookup from '../data/descriptionMap.json'

const timeout = ms => new Promise(res => setTimeout(res, ms))

export default class CallBoard extends Component {
  constructor(props) {
    super(props)
    this.state = {
      
    }
    // need this to format moment durations
    momentDurationFormatSetup(moment)
  }

  static defaultProps = {
    // need a fallback feature object for when no row is highlighted
    // needs to have eventNumber property to work with map.setFilter
    defaultFeature: {
      type: 'Feature',
      geometry: { },
      properties: {
        eventNumber: ''
      }
    }
  }

  componentWillReceiveProps(nextProps, nextState) {
    const compareArray = nextProps.activeData.filter(e => !this.props.activeData.includes(e))

    if (compareArray.length > 0) {
      timeout(800).then(() => {
        this.setState({ openPost: {} })
      })
    }
  }

  getActiveTime = (ts) => {
    const t = this.props.currentTime
    if (t >= ts) {
      return t - ts
    }
  }

  getStatusBar = (ts) => {
    // get width of elapsed time, up to an hour (60 sec * 60 min)
    const elapsedTime = this.getActiveTime(ts) / 1000
    // this only counts up to the hour - do we want to change it to account for really long incidents?
    const barScale = scaleLinear()
      .range([0, 100])
      .domain([0, 3600])

    let barWidth = barScale(elapsedTime)
    if (barWidth > 100) barWidth = 100
    return barWidth
  }

  formatSeconds = (millis) => {
    return moment.duration(millis, 'milliseconds').format('hh:mm:ss', { trim: false })
  }

  getIncidentColor = (incident) => {
    let colr, colrScl
    if (incident.properties.status === 'notAssigned' || incident.properties.status === 'waitingforUnit') {
      colrScl = scaleLinear()
          .domain([0, 3600])
          .range(['rgba(251, 63, 72, 0.4)', 'rgba(251, 63, 72, 1)'])
          .interpolate(interpolateRgb)
          .clamp(true)

      colr = colrScl(+incident.properties.elapsedTime)
    } else if (incident.properties.status === 'onScene') {
      colrScl = scaleLinear()
          .domain([0, 3600])
          .range(['rgba(70, 78, 245, 0.4)', 'rgba(70, 78, 245, 1)'])
          .interpolate(interpolateRgb)
          .clamp(true)
      colr = colrScl(+incident.properties.elapsedTime)
    } else {
      colr = '#FF00FF'
    }
    return colr
  }

  makeRows = (data) => {
    return data.map( row => {
      const rowIsHighlighted = (row.properties.id === this.props.hoveredFeature.properties.id || row.properties.id === this.props.selectedMapIncident.properties.id)
      
      return(
        <div className="boardWrapper" key={row.properties.id}>
          <div className={"boardIncident " + (rowIsHighlighted ? "highlight" : "")}
            onMouseEnter={() => this.props.handleHighlight(row)}
            onMouseLeave={() => this.props.handleHighlight(this.props.defaultFeature)}
            onClick={() => this.props.handleRowClick(row)}
          >
            <div className="boardIncident-type">{descriptionLookup[row.properties.type] ? toTitleCase(descriptionLookup[row.properties.type]) : row.properties.type}</div>
            <div className="boardIncident-statusInfo">
              <div className="boardIncident-activeTime" style={{color: `${this.getIncidentColor(row)}`}}>{this.formatSeconds(this.getActiveTime(row.properties.unix_timestamp))}</div>
              <div className="boardIncident-status">
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(33, 33, 33, 1)',
                    borderRadius: '1px'
                  }}
                >
                <div
                  style={{
                    width: `${this.getStatusBar(row.properties.unix_timestamp)}%`,
                    height: '100%',
                    backgroundColor: `${this.getIncidentColor(row)}`,
                    borderRadius: '1px',
                    transition: 'all .2s ease-out'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      )
    })
  }

  render() {
    const { activeData, startState } = this.props

    return (
      <div className={['grossWrapper', !startState && 'show'].join(' ')}>
        <div className={['Board', 'show'].join(' ')}>
          <div className="boardContent">{this.makeRows(activeData)}</div>
        </div>
      </div>
    )
  }
}

CallBoard.propTypes = {
  activeData: PropTypes.arrayOf(
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
  handleHighlight: PropTypes.func,
  handleRowClick: PropTypes.func,
  hoveredFeature: PropTypes.shape({
    type: PropTypes.oneOf(['Feature']).isRequired,
    properties: PropTypes.shape({
      eventNumber: PropTypes.string.isRequired
    }),
    geometry: PropTypes.shape({
      type: PropTypes.oneOf(['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection']),
      coordinates: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.number), // For Point
        PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)), // For LineString and MultiPoint
        PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))), // For Polygon and MultiLineString
        PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)))), // For MultiPolygon
      ]),
    }).isRequired,
  }),
  selectedMapIncident: PropTypes.shape({
    type: PropTypes.oneOf(['Feature']).isRequired,
    properties: PropTypes.shape({
      eventNumber: PropTypes.string.isRequired
    }),
    geometry: PropTypes.shape({
      type: PropTypes.oneOf(['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection']),
      coordinates: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.number), // For Point
        PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)), // For LineString and MultiPoint
        PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))), // For Polygon and MultiLineString
        PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)))), // For MultiPolygon
      ]),
    }).isRequired,
  }),
  startState: PropTypes.bool
}