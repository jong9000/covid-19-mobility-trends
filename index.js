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

const dataSet = d3.csv('./data/applemobilitytrends-2020-05-02.csv')

const city = 'Honolulu'

const formatData = data => {

  // groups same regions together in a MAP entry
  const groupedDataByRegion = d3.group(data, d => d.region)
  const locationList = []
  groupedDataByRegion.forEach( (_, key) => locationList.push(key))
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
      .tickFormat(d => {
        if (d === 1) {
          return "Baseline"
        } else {
          return formatChange(d)
        }
      })
      .tickSize(width + margin.left)
      .ticks(12))
    .call(g => g.select('.domain')
      .remove())
    .call(g => g.selectAll('.tick text')
      .attr('x', d => {
        if(d === 1) {
          return width + tickOffset + 8
        }
      })
      .attr('dy', 3)
      .attr('font-size', '12px')
      .attr('font-family', '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif;')
      .attr('fill', '#1D1D1F')
      .attr('opacity', d => {
        if(d === 1) {
          return 0.7
        } else {
          return 0.6
        }
      })
      .attr('visibility', d => {
        if(d * 10 % 2 !== 0) {return 'hidden'} 
        if(d === 0 ) { return 'hidden'}
      })
      .attr('font-weight', "500")
    )
      
  d3.selectAll('g.y.axis g.tick line')
    .attr('x2', d => {

      if(d === 1) {
        return width + tickOffset - 4
      }
      
      if(d === 0) { 
        return width + margin.left + margin.right
      } 
        else if(d * 10 % 2 == 0) {
        return width + margin.left + margin.right - tickOffset
      } else {
        return width + margin.left + margin.right
      }
    })
    .attr('transform', d => {
      if(d === 0) {
        return `translate(0,0)`
      } 

      if(d === 1) {
        return `translate(0, 0)`
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

    autocomplete(document.getElementById("myInput"), locationList)
}

dataSet.then(data => formatData(data))

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
              b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
/*execute a function when someone clicks in the document:*/
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
}