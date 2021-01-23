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

function renderCircles(dataPoint, newXScale, chosenXAxis) {

    dataPoint.transition()
      .duration(1000)
      .attr("cx", d => newXScale(d[chosenXAxis]));
  
    return dataPoint;
}

function updateToolTip(chosenXAxis, chosenYAxis, dataPoints) {

    var xLabel = "";
    var yLabel = "";
    var isXPercentage = false;
    var isYPercentage = false;

    switch (chosenXAxis) {
        case "poverty":
            xLabel = "In Poverty";
            isXPercentage = true;
            break;
    
        default:
            break;
    }

    switch (chosenYAxis) {
        case "healthcare":
            yLabel = "Lacks Healthcare:";
            isYPercentage = true;
            break;
    
        default:
            break;
    }
  
    var toolTip = d3.tip()
      .attr("class", "d3-tip")
    //   .offset([80, -60])
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

    var chosenXAxis = 'poverty';
    var chosenYAxis = 'healthcare';
    
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
    
        chartGroup.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(bottomAxis);
    
        chartGroup.append("g")
            .call(leftAxis);

        var dataGroup = chartGroup.append("g")
        
        var dataPoints = dataGroup.selectAll("g")
            .data(stateData)
            .enter()
            .append("g");
            
        var circle = dataPoints.append("circle")
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
        
        // var povertyLabel = xLabelsGroup.append("text")
        //     .attr("x", 0)
        //     .attr("y", 20)
        //     .attr("value", "poverty")
        //     .classed("active", true)
        //     .text("In Poverty (%)");

        // var ageLabel = xLabelsGroup.append("text")
        //     .attr("x", 0)
        //     .attr("y", 40)
        //     .attr("value", "age")
        //     .classed("inactive", true)
        //     .text("Age (Median)");

        // var incomeLabel = xLabelsGroup.append("text")
        //     .attr("x", 0)
        //     .attr("y", 60)
        //     .attr("value", "income")
        //     .classed("inactive", true)
        //     .text("Household Income (Median)");

        var healthcareLabel = yLabelsGroup.append("text")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (chartHeight / 2))
            .attr("dy", "1em")
            .attr("value", "healthcare")
            .classed("active", true)
            .text("Lacks Healthcare (%)");

        var obesityLabel = yLabelsGroup.append("text")
            .attr("y", 0 - margin.left + 20)
            .attr("x", 0 - (chartHeight / 2))
            .attr("dy", "1em")
            .attr("value", "obesity")
            .classed("inactive", true)
            .text("Obesity (%)");

        var smokesLabel = yLabelsGroup.append("text")
            .attr("y", 0 - margin.left + 40)
            .attr("x", 0 - (chartHeight / 2))
            .attr("dy", "1em")
            .attr("value", "smokes")
            .classed("inactive", true)
            .text("Smokes (%)");

        xLabelsGroup.selectAll("text")
            .on("click", function() {
              // get value of selection
              var value = d3.select(this).attr("value");
              if (value !== chosenXAxis) {
        
                // replaces chosenXAxis with value
                chosenXAxis = value;
        
                xAxisScale = generateScale(stateData, chosenXAxis, "x");
        
                bottomAxis = renderAxes(xAxisScale, bottomAxis);
        
                // updates circles with new x values
                dataPoints = renderCircles(dataPoints, xLinearScale, chosenXAxis);
        
                // updates tooltips with new info
                dataPoints = updateToolTip(chosenXAxis, dataPoints);
        
                // changes classes to change bold text
                if (chosenXAxis === "num_albums") {
                  albumsLabel
                    .classed("active", true)
                    .classed("inactive", false);
                  hairLengthLabel
                    .classed("active", false)
                    .classed("inactive", true);
                }
                else {
                  albumsLabel
                    .classed("active", false)
                    .classed("inactive", true);
                  hairLengthLabel
                    .classed("active", true)
                    .classed("inactive", false);
                }
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

