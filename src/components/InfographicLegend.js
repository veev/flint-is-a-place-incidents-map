import React from 'react'

const InfographicLegend = () => {

  return (
    <div className="infographic-legend-background">
      <div className="infographic-legend">
        <div className="legend">
          <div className="legend-item">
            <span className="bar pink"></span>
            <span className="text">Time spent waiting for police</span>
          </div>
          <div className="legend-item">
            <span className="bar blue"></span>
            <span className="text">Time police spent on scene</span>
          </div>
          <div className="legend-item">
            <span className="bar pink transparent"></span>
            <span className="text">Incident never answered</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfographicLegend