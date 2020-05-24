'use strict'

// sets dimension and margins of graph
const margin = { top: 50, right: 100, bottom: 150, left: 50 }
const width = window.innerWidth * .95 - margin.right - margin.left 
const height = window.innerHeight * .95 - margin.top - margin.bottom 
const tickOffset = 46

// converts to percentage by multiplying by 100, then rounding to whole percentage; includes sign for positive and negative
const formatPercent = d3.format('+.0%') 

// if ratio is 1.5, subtracting 1 leaves .5, which converts to 50% increase using `formatPercent()`
const formatChange = x => formatPercent(x - 1)

// append SVG to chart element
const svg = d3.select('#chart')
  .append('svg')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
  // need to group the SVG elements together before they can all be placed by transform:translate
  .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

// adds X axis 
// `scaleTime()` uses JavaScript Date objects
const x = d3.scaleTime()
  // range of 0 or left to width or right
  .range([0, width])

// adds Y axis
// `d3.scaleLog` creates a logarithmic scale, a continuous scale in which the domain is transformed by the Math.log function, essential transforming multiplication into addition so a vertical chart can span several orders of magnitude without the smallest values being dwarfed by the largest.
const y = d3.scaleLinear()
  // remember SVG Y axis is 0 at the top and postive numbers go down, so "height" here is the bottom of the page or the base of the chart and "0" the very top
  .range([height, 0])

function formatTick(d) {
  return d
}

const dataSet = d3.csv('./data/applemobilitytrends-2020-05-02.csv')

const city = 'Seattle'

const formatData = data => {

  // groups same regions together in a MAP entry
  const groupedDataByRegion = d3.group(data, d => d.region)
  groupedDataByRegion.forEach( (d, key) => console.log(key))
  // gets 'Honolulu" from MAP and picks out first index
  const honoluluDriving = groupedDataByRegion.get(city)[0]
  // converts to array of arrays with date and values in sub-arrays
  const honoluluDrivingDates = Object.entries(honoluluDriving).slice(4)

  const honoluluDataSet = honoluluDrivingDates.map( subArray => {
    return {
      date: new Date(subArray[0]),
      percentage: +subArray[1]
    }
  })

  // gets baseValue (should always bee 100 in this case)
  const baseValue = honoluluDataSet[0].percentage

  honoluluDataSet.forEach(d => {
    d.ratio = d.percentage / baseValue, 
    d.percentageChange = formatChange(d.ratio)
  })

  console.log(honoluluDataSet)

  // the domains are the actual data the is mapped to the ranges onscreen
  x.domain(d3.extent(honoluluDataSet, d => d.date))
  y.domain([0,1.5])

  svg.append('g')
    .call(d3.axisBottom(x)
    // .ticks(5)
    .tickValues([new Date(2020, 0, 13), new Date(2020, 1,1), new Date(2020,2,1), new Date(2020,3,1), new Date(2020,4,2)])
    .tickSize(0)
      //.tickFormat(d3.timeFormat("%b"))
    .tickFormat(d => {
      if(d > new Date(2020,0,13) && d < new Date(2020,4,1)) {
        return d.toString().toUpperCase().slice(4,7)
      } else {
        return d.toString().toUpperCase().slice(4, 10)
      }
    }))
      .attr('transform', `translate(40, ${height + 6})`)
    .call(g => g.select(".domain")
      .remove())
    .call(g => g.selectAll('.tick text')
      .attr('font-size', '12px')
      .attr('color', 'rgb(102, 102, 102')
    )

  svg.append('g')
    .attr('transform', `translate(0, 0)`)
    .attr('class', 'y axis')
    .call(d3.axisRight(y)
      .tickFormat(formatChange)
      .tickSize(width + margin.left)
      .ticks(12))
    .call(g => g.select('.domain')
      .remove())
    .call(g => g.selectAll('.tick text')
      .attr('x', 8)
      .attr('dy', 3)
      .attr('font-size', '12px')
      .attr('font-family', '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif;')
      .attr('opacity', 0.6)
      .attr('visibility', d => {
        if(d * 10 % 2 !== 0) {return 'hidden'} 
        if(d === 0 || d === 1 ) { return 'hidden'}
      })
    )

  d3.selectAll('g.y.axis g.tick line')
    .attr('x2', d => {
      if(d === 0 || d === 1) { 
        return width + margin.left + margin.right
      } 
        else if(d * 10 % 2 == 0) {
        return width + margin.left + margin.right - tickOffset
      } else {
        return width + margin.left + margin.right
      }
    })
    .attr('transform', d => {
      if(d === 0 || d === 1) {
        return `translate(0,0)`
      } 
    
      if(d*10 % 2 == 0) {
        return `translate(${tickOffset}, 0)`
      } 
    })
    .attr('stroke', d => {
      if(d === 1) {
        return "rgb(99,99,102)"
      } else {
        return "#d6d6d6"
      }
    })
    .attr('opacity', d => {
      if (d !== 1) {
        return 0.5
      } else {
        return 1
      }
    })

  svg.append('path')
    .datum(honoluluDataSet)
    .attr('fill', 'none')
    .attr('stroke', 'rgb(254, 45, 85)')
    .attr('stroke-width', 3)
    .style("stroke-linejoin","round")
    .attr('d', d3.line()
      .x(d => x(d.date))
      .y(d => y(d.ratio))
      .curve(d3.curveLinear)
    )

  svg.selectAll('path')
      .attr('transform', `translate(38, 0)`)


  // adds scatterplot
  svg.selectAll("scatterplot")
    .data(honoluluDataSet)
    .enter()
    .append("circle")
      .attr("fill", "red")
      .attr("stroke", "none")
      .attr("cx", d => x(d.date))
      .attr("cy",d => y(d.ratio))
      .attr("r", 4)
      .attr('visibility', (d, index) => {
        if (index !== honoluluDataSet.length -1) {
          return 'hidden'
        }
      })

  svg.selectAll('circle')
      .attr('transform', 'translate(38,0)')

  // legend
  svg.append('circle')
    .attr('cx', 8)
    .attr('cy', height + 44)
    .attr('r', 6.5)
    .style('fill', 'rgb(254, 45, 85)')
  svg.append('text')
    .attr('x', 24)
    .attr('y', height + 45)
    .text(`Driving ${honoluluDataSet[honoluluDataSet.length -1].percentageChange}`)
    .style('font-size', '14px')
    .style('fill', 'rgb(254, 45, 85)')
    .attr('alignment-baseline', 'middle')
}

dataSet.then(data => formatData(data))