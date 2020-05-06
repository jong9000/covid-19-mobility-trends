'use strict'

// sets dimension and margins of graph
const margin = { top: 50, right: 50, bottom: 50, left: 50 }
const width = window.innerWidth - margin.left - margin.right
const height = window.innerHeight - margin.top - margin.bottom

// converts to percentage by multiplying by 100, then rounding to whole percentage; includes sign for positive and negative
const formatPercent = d3.format('+.0%') 

// if ratio is 1.5, subtracting 1 leaves .5, which converts to 50% increase using `formatPercent()`
const formatChange = x => formatPercent(x - 1)

// append SVG to chart element
const svg = d3.select('#chart')
  .append('svg')
    .attr('width', width + margin.left + margin.right)
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

const dataSet = d3.csv('./data/applemobilitytrends-2020-05-02.csv')

const formatData = data => {

  // groups same regions together in a MAP entry
  const groupedDataByRegion = d3.group(data, d => d.region)
  // gets 'Honolulu" from MAP and picks out first index
  const honoluluDriving = groupedDataByRegion.get('Honolulu')[0]
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

  // the domains are the actual data the is mapped to the ranges onscreen
  x.domain(d3.extent(honoluluDataSet, d => d.date))
  // y.domain(d3.extent(honoluluDataSet, d => d.ratio))
  y.domain([0,2])

  svg.append('g')
    .call(d3.axisBottom(x))
    .attr('transform', `translate(0, ${height})`)

  svg.append('g')
    .call(d3.axisLeft(y)
      .tickFormat(formatChange))
      // .tickValues(d3.scaleLinear().domain(y.domain()).ticks()))

  svg.append('path')
    .datum(honoluluDataSet)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', d3.line()
      .x(d => x(d.date))
      .y(d => y(d.ratio))
    )
}

dataSet.then(data => formatData(data))