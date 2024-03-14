import { axisBottom, axisLeft } from 'd3-axis'
import { timeHour } from 'd3-time'
import { timeFormat } from 'd3-time-format'

export function setAxes(g, xAxisSVG, yAxisText, type, scales, dimensions, margin, padding){

  const axes = {}

  // default timeseries vis is type 1
  if (type === 1) {
    axes["xAxisLabel"] = 'Time of Day'.toUpperCase()
    axes["yAxisLabel"] = 'Number of Active Incidents'.toUpperCase()
    axes["xAxis"] = axisBottom()
      .scale(scales.xScale)
      .tickFormat(timeFormat('%I %p'))
      .tickArguments([timeHour.every(2)])
    axes["yAxis"] = axisLeft()
      .scale(scales.yScale)
  }

  yAxisText.append('text')
    .attr('class', 'y-axis-label')
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left)
    .attr("x", 0 - (dimensions.height * 0.55))
    .attr("dy", "1em")
    .text(axes.yAxisLabel)    
        
  xAxisSVG.append('g')
      .attr('class', 'x-axis axis')
      .attr('transform', 'translate(' + (dimensions.leftChartMargin + margin.left) + ', 0)')
      .call(axes.xAxis)

  xAxisSVG.append('text')
    .attr('class', 'x-axis-label')
    .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
    .attr('transform', 'translate('+ (margin.left + padding.left + dimensions.width/2) + ',60)')  // centre below axis
    .text(axes.xAxisLabel)

  g.append('g')
      .attr('class', 'y-axis axis')
      .attr('transform', 'translate(' + margin.left + ', 0)')
      .call(axes.yAxis)
      
  return axes
}