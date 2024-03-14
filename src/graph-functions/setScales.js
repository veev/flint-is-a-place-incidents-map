import { scaleLinear, scaleTime, scaleBand } from 'd3-scale'
import { min, max } from 'd3-array'

export function setScales(data, dimensions, margin){
  const scales = {}
  
  scales["xScale"] = scaleTime()
    .range([0, dimensions.width])
    .domain([min(data, d => +d.properties.unix_timestamp), max(data, d => +d.properties.unix_end)])
    .clamp(true)

  scales["yScale"] = scaleLinear()
    .range([dimensions.innerHeight, margin.top + 20])
    .domain([1, 30])
    .clamp(true)

  scales["xScaleWait"] = scaleLinear()
    .range([0 , dimensions.width])
    // try max domain of 10 hours
    .domain([0, 10 * 60 * 60])
    .clamp(true)

  scales["xScaleType"] = scaleBand()
    .range([0, dimensions.width])
    .paddingInner(0.15)
    .paddingOuter(0.2)

  scales["yScaleType"] = scaleLinear()
    .range([dimensions.innerHeight, margin.top])
    .domain([1, 37]) // this is hardcoded based on max similar type count but shouldn't be
    .clamp(true)
  
  return scales
}