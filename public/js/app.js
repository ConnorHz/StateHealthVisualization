var svgHeight = 800;
var svgWidth = 960;

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var axisLabels = {
    x: [
        {
            label: "In Poverty (%)",
            value: "poverty"
        },
        {
            label: "Age (Median)",
            value: "age"
        },
        {
            label: "Household Income (Median)",
            value: "income"
        }
    ],
    y: [
        {
            label: "Lacks Healthcare (%)",
            value: "healthcare"
        },
        {
            label: "Obesity (%)",
            value: "obesity"
        },
        {
            label: "Smokes (%)",
            value: "smokes"
        }
    ]
}

var margin = {
    top: 40,
    right: 40,
    bottom: 90,
    left: 100
};

var chartHeight = svgHeight - margin.top - margin.bottom;
var chartWidth = svgWidth - margin.left - margin.right;

var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);


var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


function generateScale(stateData, chosenAxis, axis) {  

    var min = d3.min(stateData, d => d[chosenAxis]);
    var max = d3.max(stateData, d => d[chosenAxis]);
    var buffer = (max-min)/15;

    return d3.scaleLinear()
        .domain([min-buffer, max+buffer])
        .range([axis == "x" ? 0 : chartHeight, axis == "x" ? chartWidth : 0]);
}

function renderDataPoints(newXScale, newYScale, chosenXAxis, chosenYAxis) {

    var dataPoints = d3.selectAll(".dataPoint");

    dataPoints.selectAll("circle").transition()
      .duration(1000)
      .attr("cx", d => newXScale(d[chosenXAxis]))
      .attr("cy", d => newYScale(d[chosenYAxis]))


      dataPoints.selectAll("text").transition()
      .duration(1000)
      .attr("dx", d => newXScale(d[chosenXAxis]))
      .attr("dy", d => newYScale(d[chosenYAxis]) + 5)

      dataPoints.selectAll("image").transition()
      .duration(1000)
      .attr("x", d => newXScale(d[chosenXAxis]) - 15)
      .attr("y", d => newYScale(d[chosenYAxis]) - 15)
  
    return dataPoints;
}

function renderAxes(newScale, axis) {

    var chartAxis = axis.attr("axis") == "x" ? d3.axisBottom(newScale) : d3.axisLeft(newScale)
  
    axis.transition()
      .duration(1000)
      .call(chartAxis);
  
    return axis;
}

function toggleFlags() {
    var checked = d3.selectAll("#flagToggle").property("checked");
    var duration = 1000;

    var dataPoints = d3.selectAll(".dataPoint");

    dataPoints.selectAll(".stateCircle").transition()
      .duration(duration)
      .style("opacity", checked ? 0 : 1)

    dataPoints.selectAll("text").transition()
      .duration(duration)
      .style("opacity", checked ? 0 : 1)

    dataPoints.selectAll("image").transition()
      .duration(duration)
      .style("opacity", checked ? 1 : 0)

    dataPoints.selectAll(".flagBorder").transition()
      .duration(duration)
      .style("opacity", checked ? 1 : 0)
    
}


function updateToolTip(chosenXAxis, chosenYAxis) {

    var dataPoints = d3.selectAll(".dataPoint");

    var xLabel = "";
    var yLabel = "";
    var isXPercentage = false;
    var isYPercentage = true;

    switch (chosenXAxis) {
        case "poverty":
            xLabel = "In Poverty: ";
            isXPercentage = true;
            break;
        case "age":
            xLabel = "Age: ";
            break;
        case "income":
            xLabel = "Income: $";
            break;    
        default:
            break;
    }

    switch (chosenYAxis) {
        case "healthcare":
            yLabel = "Lacks Healthcare:";
            break;
        case "obesity":
            yLabel = "Obesity:";
            break;
        case "smokes":
            yLabel = "Smokes:";
            break;
        default:
            break;
    }
  
    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .html(d => `${d.state}<br>${xLabel}${numberWithCommas(d[chosenXAxis])}${isXPercentage ? "%" : ""}<br>${yLabel} ${d[chosenYAxis]}${isYPercentage ? "%" : ""}`);
  
    dataPoints.call(toolTip);
  
    dataPoints.on("mouseover", function(data) {
      toolTip.show(data);
    })
      // onmouseout event
      .on("mouseout", function(data, index) {
        toolTip.hide(data);
      });
  
    return dataPoints;
}

function renderPlot() {

    var chosenXAxis = axisLabels.x[0].value;
    var chosenYAxis = axisLabels.y[0].value;
    
    d3.csv("public/data/data.csv").then(function(stateData, err) {
        if (err) throw err;
    
        stateData.forEach(row => {
            row.poverty = +row.poverty;
            row.age = +row.age;
            row.income = +row.income;
    
            row.obesity = +row.obesity;
            row.smokes = +row.smokes;
            row.healthcare = +row.healthcare;
        });
    
        var xAxisScale = generateScale(stateData, chosenXAxis, "x");
        var yAxisScale = generateScale(stateData, chosenYAxis, "y");
    
        var bottomAxis = d3.axisBottom(xAxisScale);
        var leftAxis = d3.axisLeft(yAxisScale);
    
        var bottomAxisGroup = chartGroup.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .attr("axis", "x")
            .call(bottomAxis);
    
        var leftAxisGroup = chartGroup.append("g")
            .attr("axis", "y")
            .call(leftAxis);

        var dataGroup = chartGroup.append("g")
        
        var dataPoints = dataGroup.selectAll("g")
            .data(stateData)
            .enter()
            .append("g")
            .classed("dataPoint", true);
            
        dataPoints.append("circle")
            .attr("r", 15)
            .attr("cx", 0)
            .attr("cy", chartHeight)
            .classed("stateCircle", true);
         
        dataPoints.append("text")
            .text(d => d.abbr)
            .attr("dx", 0)
            .attr("dy", chartHeight)
            .classed("stateText", true);

        dataPoints.append("image")
            .attr("href", d => `/public/images/flags/${d.state.replace(" ", "-").toLowerCase()}-flag-round-icon-256.png`)
            .attr("x", 0)
            .attr("y", chartHeight - 15)
            .attr("height", 30)
            .attr("width", 30)
            .style("opacity", 0);

        dataPoints.append("circle")
            .attr("r", 15)
            .attr("cx", 0)
            .attr("cy", chartHeight)
            .classed("flagBorder", true)
            .style("opacity", 0);

        renderDataPoints(xAxisScale, yAxisScale, chosenXAxis, chosenYAxis);

        updateToolTip(chosenXAxis, chosenYAxis, dataPoints);

        var xLabelsGroup = chartGroup.append("g")
            .attr("id", "xLabelsGroup")
            .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`);

        var yLabelsGroup = chartGroup.append("g")
            .attr("id", "yLabelsGroup")
            .attr("transform", "rotate(-90)")

        axisLabels.x.forEach((d, i) => {
            xLabelsGroup.append("text")
            .attr("x", 0)
            .attr("y", 20 + (i*20))
            .attr("value", d.value)
            .classed(i == 0 ? "active aText" : "inactive aText", true)
            .text(d.label);
        });

        axisLabels.y.forEach((d, i) => {
            yLabelsGroup.append("text")
            .attr("y", 0 - margin.left + (i*20))
            .attr("x", 0 - (chartHeight / 2))
            .attr("dy", "1em")
            .attr("value", d.value)
            .classed(i == 0 ? "active aText" : "inactive aText", true)
            .text(d.label);
        });

        chartGroup.append("text")
            .attr("transform", `translate(${chartWidth / 2}, 0)`)
            .classed("aText active", true)
            .text("Relationship Between State Census Data");
        

        xLabelsGroup.selectAll("text")
            .on("click", function() {
              var value = d3.select(this).attr("value");

              if (value !== chosenXAxis) {
                chosenXAxis = value;
        
                xAxisScale = generateScale(stateData, chosenXAxis, "x");
        
                bottomAxisGroup = renderAxes(xAxisScale, bottomAxisGroup);
        
                renderDataPoints(xAxisScale, yAxisScale, chosenXAxis, chosenYAxis);
        
                updateToolTip(chosenXAxis, chosenYAxis);
                
                xLabelsGroup.selectAll("text")
                    .classed("active", false)
                    .classed("inactive", true);

                d3.select(this)
                    .classed("active", true)
                    .classed("inactive", false);

                
              }
            });

        yLabelsGroup.selectAll("text")
            .on("click", function() {
            var value = d3.select(this).attr("value");

            if (value !== chosenYAxis) {
                chosenYAxis = value;
    
            yAxisScale = generateScale(stateData, chosenYAxis, "y");
    
            leftAxisGroup = renderAxes(yAxisScale, leftAxisGroup);
    
            renderDataPoints(xAxisScale, yAxisScale, chosenXAxis, chosenYAxis);
        
            updateToolTip(chosenXAxis, chosenYAxis);
            
            yLabelsGroup.selectAll("text")
                .classed("active", false)
                .classed("inactive", true);

            d3.select(this)
                .classed("active", true)
                .classed("inactive", false);

            
            }
        });
    
    }).catch(function(error) {
        console.log(error);
    });

}

renderPlot();




