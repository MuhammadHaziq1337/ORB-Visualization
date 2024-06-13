
d3.json('/data/movie-ratings', function(error, rawData) {
    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    // Convert the object into an array of { movie, rating } objects
    const data = Object.keys(rawData).map(function(movie) {
        return { text: movie, size: +rawData[movie] };
    });

    // Create a size scale for the font size
    const sizeScale = d3.scale.sqrt()
        .domain([d3.min(data, function(d) { return d.size; }), d3.max(data, function(d) { return d.size; })])
        .range([10, 80]); // Adjust the range based on your aesthetic preference

    // Set width and height from the SVG element
    const svgElement = d3.select('svg');
    const width = +svgElement.attr('width');
    const height = +svgElement.attr('height');

    // Initialize word cloud layout
    const layout = d3.layout.cloud()
        .size([width, height])
        .words(data.map(function(d) {
            return { text: d.text, size: sizeScale(d.size) };
        }))
        .padding(5)
        .rotate(function() { return (~~(Math.random() * 6) - 3) * 30; }) // Adjust rotation here
        .font("Impact")
        .fontSize(function(d) { return d.size; })
        .on("end", draw);

    // Start the layout computation
    layout.start();

    // Function to draw the word cloud
    function draw(words) {
        const wordGroup = svgElement.append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    
        // Append each word
        const textElements = wordGroup.selectAll('text')
            .data(words)
            .enter().append('text')
            .style('font-size', function(d) { return d.size + 'px'; })
            .style('font-family', 'Impact')
            .style('fill', function(d, i) { return d3.scale.category10()(i); })
            .attr('text-anchor', 'middle')
            .attr('transform', function(d) { return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')'; })
            .text(function(d) { return d.text; });
    
        // Tooltip div
        var tooltip = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);
    
        // Add interactivity (mouseover and mouseout)
        textElements.on('mouseover', function(event, d) {
            tooltip.transition()        
                .duration(200)      
                .style("opacity", .9);      
            tooltip.html(d.text + "<br/>"  + d.size)  
                .style("left", (event.pageX) + "px")     
                .style("top", (event.pageY - 28) + "px");    
        })
        .on('mouseout', function(d) {
            tooltip.transition()        
                .duration(500)      
                .style("opacity", 0);   
        });
    }
    
});
