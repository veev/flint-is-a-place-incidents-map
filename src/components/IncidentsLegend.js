import React from 'react'

const IncidentsLegend = () => {

  return (
    <div className="incidents-legend">
      <div class="legend">
        <div class="legend-item">
          <span class="bar pink"></span>
          <span class="circle pink"></span>
          <span class="text">Waiting for police</span>
        </div>
        <div class="legend-item">
          <span class="bar blue"></span>
          <span class="icon car"></span>
          <span class="text">Police on scene</span>
        </div>
        <div class="legend-item">
          <span class="time">01:48:19</span>
          <span class="text">Elapsed time since incident called into dispatch</span>
        </div>
      </div>
    </div>
  )
}

export default IncidentsLegend