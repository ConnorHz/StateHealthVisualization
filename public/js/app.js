var svgHeight = window.innerHeight;
var svgWidth = window.innerWidth;

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
    top: 20,
    right: 40,
    bottom: 80,
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
        .range([axis == "y" ? chartHeight : 0, axis == "y" ? 0 : chartWidth]);
}

function renderCircles(dataPoint, newXScale, newYScale, chosenXAxis, chosenYAxis) {

    dataPoint.selectAll("circle").transition()
      .duration(1000)
      .attr("cx", d => newXScale(d[chosenXAxis]))
      .attr("cy", d => newYScale(d[chosenYAxis]));

    dataPoint.selectAll("text").transition()
      .duration(1000)
      .attr("dx", d => newXScale(d[chosenXAxis]))
      .attr("dy", d => newYScale(d[chosenYAxis]) + 5)
  
    return dataPoint;
}

function renderAxes(newScale, axis) {

    var chartAxis = axis.attr("axis") == "x" ? d3.axisBottom(newScale) : d3.axisLeft(newScale)
  
    axis.transition()
      .duration(1000)
      .call(chartAxis);
  
    return axis;
  }

function updateToolTip(chosenXAxis, chosenYAxis, dataPoints) {

    var xLabel = "";
    var yLabel = "";
    var isXPercentage = false;
    var isYPercentage = true;

    switch (chosenXAxis) {
        case "poverty":
            xLabel = "In Poverty:";
            isXPercentage = true;
            break;
        case "age":
            xLabel = "Age (Median):";
            break;
        case "income":
            xLabel = "Household Income (Median):";
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
      .html(d => `${d.state}<br>${xLabel} ${d[chosenXAxis]}${isXPercentage ? "%" : ""}<br>${yLabel} ${d[chosenYAxis]}${isYPercentage ? "%" : ""}`);
  
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
            .append("g");
            
        dataPoints.append("circle")
            .attr("r", 15)
            .attr("cx", d => xAxisScale(d[chosenXAxis]))
            .attr("cy", d => yAxisScale(d[chosenYAxis]))
            .classed("stateCircle", true);
         
        dataPoints.append("text")
            .text(d => d.abbr)
            .attr("dx", d => xAxisScale(d[chosenXAxis]))
            .attr("dy", d => yAxisScale(d[chosenYAxis]) + 5)
            .classed("stateText", true);

        var dataPoints = updateToolTip(chosenXAxis, chosenYAxis, dataPoints);

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
            .classed(i == 0 ? "active" : "inactive", true)
            .text(d.label);
        });

        axisLabels.y.forEach((d, i) => {
            yLabelsGroup.append("text")
            .attr("y", 0 - margin.left + (i*20))
            .attr("x", 0 - (chartHeight / 2))
            .attr("dy", "1em")
            .attr("value", d.value)
            .classed(i == 0 ? "active" : "inactive", true)
            .text(d.label);
        });
        

        xLabelsGroup.selectAll("text")
            .on("click", function() {
              // get value of selection
              var value = d3.select(this).attr("value");

              if (value !== chosenXAxis) {
                chosenXAxis = value;
        
                xAxisScale = generateScale(stateData, chosenXAxis, "x");
        
                bottomAxisGroup = renderAxes(xAxisScale, bottomAxisGroup);
        
                // updates circles with new x values
                dataPoints = renderCircles(dataPoints, xAxisScale, yAxisScale, chosenXAxis, chosenYAxis);
        
                // updates tooltips with new info
                dataPoints = updateToolTip(chosenXAxis, chosenYAxis, dataPoints);
                
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
            // get value of selection
            var value = d3.select(this).attr("value");

            if (value !== chosenYAxis) {
                chosenYAxis = value;
    
            yAxisScale = generateScale(stateData, chosenYAxis, "y");
    
            leftAxisGroup = renderAxes(yAxisScale, leftAxisGroup);
    
            // updates circles with new x values
            dataPoints = renderCircles(dataPoints, xAxisScale, yAxisScale, chosenXAxis, chosenYAxis);
    
            // updates tooltips with new info
            dataPoints = updateToolTip(chosenXAxis, chosenYAxis, dataPoints);
            
            yLabelsGroup.selectAll("text")
                .classed("active", false)
                .classed("inactive", true);

            d3.select(this)
                .classed("active", true)
                .classed("inactive", false);

            
            }
        });


        // <image href="/public/images/flags/california-flag-round-icon-256.png" height="30" width="30" x="864.0890243902438" y="112.7815270935961"></image>

        // .attr("cx", d => xAxisScale(d[chosenXAxis]) - 15)
        // .attr("cy", d => yAxisScale(d[chosenYAxis]) - 15)
    
    }).catch(function(error) {
        console.log(error);
    });

}

renderPlot();

d3.select(window).on("resize", renderPlot);

