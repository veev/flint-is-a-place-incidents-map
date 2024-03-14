import { select } from 'd3-selection'
import { setPopupHtml } from './setPopupHtml'

// This function is used in Graph Area D3 to draw the default visualization
// Which shows the incidents in sequence, stacked based on time on scene
export function makeTimeSeriesChart(data, scales, g, margin, div) {
  g.append("g")
    .attr('transform', "translate(" + margin.left + ", 0)")
    .attr("class", "all-groups")
    .attr("max-height", scales.yScale(0))
    .attr("overflow", "scroll")

  g.select('.all-groups').append('g')
    .attr('class', 'wait-rect-group')
    .selectAll('.wait-rect-group')
    .data(data)
    .enter()
    .append('rect')
      .style('fill', 'rgb(251, 63, 72)')
      .attr('class', 'wait-rect')
      .attr('x', d => scales.xScale(+d.properties.unix_timestamp))
      .attr('y', d => scales.yScale(+d.properties.yPos))
      .attr('height', 10)
      .attr('width', d => {
        return d.properties.onscene ? 
          scales.xScale(+d.properties.unix_onscene) - scales.xScale(+d.properties.unix_timestamp) 
        : scales.xScale(+d.properties.unix_end) - scales.xScale(+d.properties.unix_timestamp)
      })
      .attr('opacity', (d, i) => {
        if (d.properties.unix_onscene) {
          return 1
        } else {
          return 0.5
        }
      })
    .on('mouseover', function(d) {
      select(this)
        .style('fill', 'yellow')
    })
    .on('mouseout', function(d) {
      select(this)
        .transition()
        .duration(250)
        .style('fill', 'rgb(251, 63, 72)')
    })

  g.select('.all-groups').append('g')
    .attr('class', 'scene-rect-group')
    .selectAll('.scene-rect-group')
    .data(data)
    .enter()
    .append('rect')
      .style('fill', '#464EF5')
      .attr('class', 'scene-rect')
      .attr('x', d => d.properties.unix_onscene ? scales.xScale(+d.properties.unix_onscene) : scales.xScale(+d.properties.unix_timestamp))
      .attr('y', d => scales.yScale(+d.properties.yPos))
      .attr('height', 10)
      .attr('width', d => {
        return d.properties.unix_onscene ? 
        scales.xScale(+d.properties.unix_end) - scales.xScale(+d.properties.unix_onscene) 
        : 0
      })
    .on('mouseover', function(d) {
      select(this)
        .style('fill', 'lightgreen')
    })
    .on('mouseout', function(d) {
      select(this)
        .transition()
        .duration(250)
        .style('fill', '#464EF5')
    })

  g.select('.all-groups').append('g')
    .attr('class', 'highlight-rect-group')
    .selectAll('.highlight-rect-group')
    .data(data)
    .enter()
    .append('rect')
      .style('fill', 'white')
      .style('opacity', 0)
      .attr('class', 'highlight-rect')
      .attr('x', d => scales.xScale(+d.properties.unix_timestamp))
      .attr('y', d => scales.yScale(+d.properties.yPos))
      .attr('height', 10)
      .attr('width', d => {
        return scales.xScale(+d.properties.unix_end) - scales.xScale(+d.properties.unix_timestamp)
      })
    .on('mouseover', function(d) {
      select(this)
        .style('opacity', 1)
        //tooltip stuff
      div.transition()    
          .duration(200)    
          .style("opacity", 1);    
      div.html(setPopupHtml(d))
    })
    .on('mouseout', function(d) {
      select(this)
        .transition()
        .duration(250)
        .style('opacity', 0)
      // tooltip stuff
      div.transition()    
        .duration(500)    
        .style("opacity", 0)
    })
}