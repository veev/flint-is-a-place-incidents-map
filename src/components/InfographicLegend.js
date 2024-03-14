import React from 'react'

const InfographicLegend = () => {

  return (
    <div className="infographic-legend-background">
      <div className="infographic-legend">
        <div class="legend">
          <div class="legend-item">
            <span class="bar pink"></span>
            <span class="text">Time spent waiting for police</span>
          </div>
          <div class="legend-item">
            <span class="bar blue"></span>
            <span class="text">Time police spent on scene</span>
          </div>
          <div class="legend-item">
            <span class="bar pink transparent"></span>
            <span class="text">Incident never answered</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfographicLegend