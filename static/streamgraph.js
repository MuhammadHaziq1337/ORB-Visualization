document.addEventListener('DOMContentLoaded', async function() {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 },
          width = 1080 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;
  
    const svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  
    // Parse the year
    const parseYear = d3.timeParse("%Y");
  
    // Scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const z = d3.scaleOrdinal(d3.schemeCategory10);
  
    // Fetch the data
    const response = await fetch('/data/movie-sentiment-stream');
    const rawData = await response.json();
  
    // Process data
    const keys = Object.keys(rawData).filter(key => key !== 'release_year');
    const data = rawData.release_year.map((year, i) => {
      const obj = { year: parseYear(year) };
      keys.forEach(key => {
        obj[key] = rawData[key][i] || 0; // Use zero if no data
      });
      return obj;
    });
  
    // Stack generator
    const stack = d3.stack()
      .keys(keys)
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut);
  
    const layers = stack(data);
  
    // Set domains
    x.domain(d3.extent(data, d => d.year));
    y.domain([
      d3.min(layers, layer => d3.min(layer, segment => segment[0])),
      d3.max(layers, layer => d3.max(layer, segment => segment[1]))
    ]);
    z.domain(keys);
  
    // Area generator
    const area = d3.area()
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));
  
    // Drawing the layers
    svg.selectAll(".layer")
      .data(layers)
      .enter().append("path")
        .attr("class", "area")
        .style("fill", (d, i) => z(i))
        .attr("d", area);

        svg.selectAll(".layer")
        .append("text")
        .datum(d => ({name: d.key, value: d.values[d.values.length - 1]})) // assuming d.key contains the category name
        .attr("transform", d => "translate(" + x(d.value.date) + "," + y(d.value.y0 + d.value.y / 2) + ")")
        .attr("x", -6)
        .attr("dy", ".35em")
        .style("font", "10px sans-serif")
        .style("text-anchor", "end")
        .text(d => d.name);
  
    // Axes
    svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
  
    svg.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y));
  
    // Legend
    const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter().append("g")
        .attr("transform", (d, i) => "translate(20," + i * 20 + ")");
  
    legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);
  
    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(d => d);
  });
  