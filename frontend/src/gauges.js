function createGauge(elementId, options) {
    const config = {
        min: options.min || 0,
        max: options.max || 100,
        size: options.size || 300,
        label: options.label || "",
        majorTicks: options.majorTicks || 5,
        showNegative: options.showNegative || false
    };

    const svg = d3.select(`#${elementId}`)
        .append("svg")
        .attr("width", config.size)
        .attr("height", config.size);

    const radius = config.size * 0.4;
    const centerX = config.size / 2;
    const centerY = config.size / 2;

    // Add dark circular background
    svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius)
        .attr("fill", "#1a1a1a")
        .attr("stroke", "#333")
        .attr("stroke-width", 2);

    // Add semi-circular shading
    const arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(-Math.PI * 0.75)
        .endAngle(Math.PI * 0.75);

    svg.append("path")
        .attr("d", arcGenerator)
        .attr("transform", `translate(${centerX},${centerY})`)
        .attr("fill", "#262626");

    // Update the scale function
    const scale = d3.scaleLinear()
        .domain([options.min, options.max])
        .range([-225, 45]);

    // Generate tick values
    const ticks = options.customTicks || d3.ticks(options.min, options.max, options.majorTicks);

    ticks.forEach(tick => {
        const angle = scale(tick) * Math.PI / 180;
        const tickLength = radius * 0.15;
        const textRadius = radius * 0.75;
        
        // Calculate position for tick marks
        const x1 = centerX + Math.cos(angle) * (radius - tickLength);
        const y1 = centerY + Math.sin(angle) * (radius - tickLength);
        const x2 = centerX + Math.cos(angle) * radius;
        const y2 = centerY + Math.sin(angle) * radius;

        // Draw tick line
        svg.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", "#666")
            .attr("stroke-width", 2);

        // Calculate text position
        const labelX = centerX + Math.cos(angle) * textRadius;
        const labelY = centerY + Math.sin(angle) * textRadius;
        
        // Format the text value
        const displayValue = config.showNegative ? tick : Math.abs(tick);
        
        // Add tick label
        svg.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "#666")
            .attr("font-size", "14px")
            .text(displayValue);
    });

    // Add unit label at bottom
    svg.append("text")
        .attr("x", centerX)
        .attr("y", centerY + radius * 0.5)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .attr("font-size", "16px")
        .text(options.label);

    // Add central value display
    const valueText = svg.append("text")
        .attr("x", centerX)
        .attr("y", centerY + radius * 0.2)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("font-size", "24px")
        .text("0");

    // Create a needle group for better control
    const needleGroup = svg.append("g")
        .attr("transform", `translate(${centerX}, ${centerY})`);

    // Create the needle with one end at center point
    const needleLength = radius * 0.8;
    const needle = needleGroup.append("path")
        .attr("d", `M 0,0 L 0,-${needleLength}`)  // Draws line from (0,0) to (0,-needleLength)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round");  // Rounds the end of the needle

    // Add a center pin/circle to emphasize pivot point
    needleGroup.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 3)
        .attr("fill", "#fff");

    return function updateGauge(value) {
        const angle = scale(value)+90;
        //console.log(angle + " angle" + value + " value");
        // Smooth rotation transition
        needleGroup.transition()
            .duration(500)  // Duration for smooth movement
            .ease(d3.easeLinear)  // Linear easing for consistent speed
            .attr("transform", `translate(${centerX}, ${centerY}) rotate(${angle})`);
        
        // Update the displayed value
        valueText.text(Math.round(value));
    };
}

// Create the gauges with proper configurations
const powerGauge = createGauge("powerGauge", {
    min: -1000,
    max: 1000,
    majorTicks: 9,
    customTicks: [-1000, -750, -500, -250, 0, 250, 500, 750, 1000],
    label: "kW",
    size: 300,
    showNegative: true
});

const rpmGauge = createGauge("rpmGauge", {
    min: 0,
    max: 800,
    majorTicks: 9,
    customTicks: [0, 100, 200, 300, 400, 500, 600, 700, 800],
    label: "RPM",
    size: 300,
    showNegative: false
}); 