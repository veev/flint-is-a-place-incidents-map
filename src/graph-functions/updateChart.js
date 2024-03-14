import { select } from 'd3-selection'
import { nest } from 'd3-collection'
import { range } from 'd3-array'
import { timeHour } from 'd3-time'
import { timeFormat } from 'd3-time-format'

const transitionDuration = 600

// this function handles changing the visualization based on the 
// user input in the Radio Button selection (changes to "type" of viz)
export function updateChart(data, 
                            type, 
                            node, 
                            axisNode, 
                            yLabelNode,
                            dimensions,
                            margin,
                            padding,
                            scales,
                            axes) {

  const sortItems = (a, b) => {
    
    // time series time
    if (type === 1) {
      return +a.properties.unix_timestamp - +b.properties.unix_timestamp
    }
    // wait time
    if (type === 2) {
      return +b.properties.waitTime - +a.properties.waitTime
    }
    // on scene time
    if (type === 3) {
      return +b.properties.onSceneDuration - +a.properties.onSceneDuration
    } 
    // total time
    if (type === 4) {
      return +b.properties.len_time_delta - +a.properties.len_time_delta
    }
    // by category
    if (type === 5) {
      return a.properties.type.localeCompare(b.properties.type)
    }
  }

  const delay = (d, i) => {
    return i * 3
  }

  const posClass = (type === 1 || type === 5) ? 'tooltip oldTooltipPos' : 'tooltip newTooltipPos'
  select('body').selectAll('.tooltip')
    .attr('class', posClass)

  if (type === 1 || type === 5) {
    document.getElementById("chart").style.overflowY = "hidden"
  } else {
    document.getElementById("chart").style.overflowY = "scroll"
  }

  // type = 5 stuff, incident types
  let byTypes = []
  let typeArray = []
  let ySkip
  let yPos = 0
  let currentType = 'DOMDIS'
  if (type === 5) {
    byTypes = nest()
      .key(d => d.properties.type)
      .entries(data)
      .sort((a,b) => b.values.length - a.values.length)
    ySkip = dimensions.height / byTypes[0].values.length

  typeArray = byTypes.map( type => type.key)

  scales.xScaleType
      .domain(typeArray)
  }

  select(node).selectAll('.wait-rect')
    .sort(sortItems)
    .transition()
    .delay(delay)
    .duration(transitionDuration)
    .attr('x', (d) => {
      // timeseries scale
      if (type === 1) {
        return scales.xScale(+d.properties.unix_timestamp)
      }
      // time duration (linear scale)
      if (type === 3) {
        if (d.properties.len_time_delta > (10 * 60 * 60)) {
          return (scales.xScaleWait(10 * 60 * 60) - scales.xScaleWait(+d.properties.waitTime))
        } else {
          return scales.xScaleWait(+d.properties.onSceneDuration)
        }
      }
      
      if (type === 2 || type === 4) {
        return 0
      }
      // categorical scale
      if (type === 5) {
        return scales.xScaleType(d.properties.type)
      }
    })
    .attr('y', (d, i) => {
      if (type === 1) {
        return scales.yScale(+d.properties.yPos)
      }
      if (type > 1 && type < 5) {
        return (i * 10) + padding.top + (i * 8)
      }
      if (type === 5) {
        yPos = d.properties.type !== currentType ? 0 : yPos + ySkip
        const currentHeight = dimensions.height - yPos
        currentType = d.properties.type
        return currentHeight
      }
    })
    .attr('width', d => {
      if (type === 1) {
        return d.properties.onscene ? 
          scales.xScale(+d.properties.unix_onscene) - scales.xScale(+d.properties.unix_timestamp)
        : scales.xScale(+d.properties.unix_end) - scales.xScale(+d.properties.unix_timestamp)
      }
      if (type > 1 && type < 5) {
        let w = scales.xScaleWait(+d.properties.waitTime)
        if (w < 1) w = 1
        return w
      }
      if (type === 5) {
        return scales.xScaleType.bandwidth()
      }
    })

  select(node).selectAll('.scene-rect')
    .sort(sortItems)
    .transition()
    .delay(delay)
    .duration(transitionDuration)
    .attr('x', d => {
      if (type === 1) {
        return d.properties.unix_onscene ? scales.xScale(+d.properties.unix_onscene) : scales.xScale(+d.properties.unix_timestamp)
      }
      if (type === 2 || type === 4) {
        if (d.properties.len_time_delta > (10 * 60 * 60)) {
          return (scales.xScaleWait(10 * 60 * 60) - scales.xScaleWait(+d.properties.onSceneDuration))
        } else {
          return scales.xScaleWait(+d.properties.waitTime)
        }
      }
      if (type === 3) {
        return d.properties.unix_onscene ? 
        0 : scales.xScaleWait(+d.properties.waitTime)
      }
      if (type === 5) {
        return scales.xScaleType(d.properties.type)
      }
    })
    .attr('y', (d, i) => {
      if (type === 1) {
        return scales.yScale(+d.properties.yPos)
      }
      if (type > 1 && type < 5) {
        return (i * 10) + padding.top + (i * 8)
      }
      if (type === 5) {
        return dimensions.height
      }
    })
    .attr('width', d => {
      if (type === 1) {
        return d.properties.unix_onscene ? 
         scales.xScale(+d.properties.unix_end) - scales.xScale(+d.properties.unix_onscene) 
        : 0
      }
      if (type > 1 && type < 5) {
        return scales.xScaleWait(+d.properties.onSceneDuration)
      }
      if (type === 5) {
        return scales.xScaleType.bandwidth()
      }
    })
    .attr('opacity', `${type === 5 ? 0 : 1}`)

  select(node).selectAll('.highlight-rect')
    .sort(sortItems)
    .transition()
    .delay(delay)
    .duration(transitionDuration)
    .attr('x', d => {
      if (type === 1) {
        return scales.xScale(+d.properties.unix_timestamp)
      }
      if (type > 1 && type < 5) {
        return 0
      }
      if (type === 5) {
        return scales.xScaleType(d.properties.type)
      }
    })
    .attr('y', (d, i) => {
      if (type === 1) {
        return scales.yScale(+d.properties.yPos)
      }
      if (type > 1 && type < 5) {
        return (i * 10) + padding.top + (i * 8)
      }
      if (type === 5) {
        yPos = d.properties.type !== currentType ? 0 : yPos + ySkip
        const currentHeight = dimensions.height - yPos
        currentType = d.properties.type
        return currentHeight
      }
    })
    .attr('width', d => {
      // timeseries viz mode
      if (type === 1) {
        return scales.xScale(+d.properties.unix_end) - scales.xScale(+d.properties.unix_timestamp)
      }
      // waiting duration viz mode
      if (type > 1 && type < 5) {
        let w = scales.xScaleWait(+d.properties.len_time_delta)
        if (w < 1) w = 1
        return w
      }
      // categorical viz mode
      if (type === 5) {
        return scales.xScaleType.bandwidth()
      }
    })

  if (type === 1) {
    axes.xAxisLabel = 'Time of Day'.toUpperCase()
    axes.yAxisLabel = 'Number of Active Incidents'.toUpperCase()
    axes.xAxis.scale(scales.xScale)
      .tickValues(null)
      .tickArguments([timeHour.every(2)])
      .tickFormat(timeFormat('%I %p'))
    axes.yAxis.scale(scales.yScale)
    select(axisNode).selectAll('.x-axis')
      .transition()
      .duration(transitionDuration)
      .call(axes.xAxis)
    document.getElementById("chart").scrollTop = 0
  } else if (type === 5) {
    axes.xAxisLabel = 'Incident Types'.toUpperCase()
    axes.yAxisLabel = 'Number of Incidents'.toUpperCase()
    axes.xAxis.scale(scales.xScaleType)
      .tickValues(typeArray)
      .tickArguments(null)
      .tickFormat(null)
    axes.yAxis.scale(scales.yScaleType)
    select(axisNode).selectAll('.x-axis')
      .transition()
      .duration(transitionDuration)
      .call(axes.xAxis)
      .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)")
      document.getElementById("chart").scrollTop = 0
  } else {
    axes.xAxisLabel = 'Duration in Hours'.toUpperCase()
    axes.yAxisLabel = 'Sorted Incidents'.toUpperCase()
    const vals = range(0, 36001, 3600)
    const formatHours = d => {
      return `${(d / (60 * 60))}:00`
    }
    axes.xAxis.scale(scales.xScaleWait)
        .tickValues(vals)
        .tickFormat(formatHours)
    axes.yAxis.scale(scales.yScale)
    select(axisNode).selectAll('.x-axis')
      .transition()
      .duration(transitionDuration)
      .call(axes.xAxis)
  }

  // position axis labels
  select(axisNode).selectAll('.x-axis-label')
    .transition()
    .delay(delay)
    .duration(transitionDuration)
    .text(axes.xAxisLabel)
    .attr('transform', `translate(${(margin.left + padding.left + dimensions.width/2)},${type === 5 ? 80 : 60})`)  // centre below axis

  select('.footer')
    .transition()
    .delay(delay)
    .duration(transitionDuration)
    .style('bottom', `${type === 5 ? 20 : 40}px`)  // centre below axis)

  select(yLabelNode).selectAll('.y-axis-label')
    .transition()
    .delay(delay)
    .duration(transitionDuration)
    .text(axes.yAxisLabel)

  select(node).selectAll('.y-axis')
    .transition()
    .duration(transitionDuration)
    .call(axes.yAxis)
    .style('opacity', `${(type === 1 || type === 5) ? 1 : 0}`)
}