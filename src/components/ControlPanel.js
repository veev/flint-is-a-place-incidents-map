import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import MultiToggle from './MultiToggle'

const viewOptions = [
  {
    displayName: "Police",
    value: 'incidents'
  },
  {
    displayName: "Community",
    value: 'facebook'
  },
  {
    displayName: "Info",
    value: 'infographic'
  }
]

export default class ControlPanel extends Component {

  render() {
    return (
      <div className='ControlPanel'>
        <MultiToggle
          isMapLoaded={this.props.isMapLoaded}
          options={viewOptions}
          selectedOption={this.props.viewMode}
          onSelectOption={this.props.handleToggle}
          hoveredOption={this.props.infoMode}
          onHoverOption={this.props.handleHover}
          onMouseLeaveOption={this.props.handleMouseLeave}
        />
        <div className='closeControl'></div>
      </div>
    )
  }
}

ControlPanel.propTypes = {
  handleToggle: PropTypes.func,
  handleHover: PropTypes.func,
  handleMouseLeave: PropTypes.func,
  infoMode: PropTypes.string,
  viewMode: PropTypes.string,
  isMapLoaded: PropTypes.bool,
  startState: PropTypes.bool
}