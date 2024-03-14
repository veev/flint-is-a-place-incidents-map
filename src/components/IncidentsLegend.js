import React from 'react'

const IncidentsLegend = () => {

  return (
    <div className="incidents-legend">
      <div className="legend">
        <div className="legend-item">
          <span className="bar pink"></span>
          <span className="circle pink"></span>
          <span className="text">Waiting for police</span>
        </div>
        <div className="legend-item">
          <span className="bar blue"></span>
          <span className="icon car"></span>
          <span className="text">Police on scene</span>
        </div>
        <div className="legend-item">
          <span className="time">01:48:19</span>
          <span className="text">Elapsed time since incident called into dispatch</span>
        </div>
      </div>
    </div>
  )
}

export default IncidentsLegend