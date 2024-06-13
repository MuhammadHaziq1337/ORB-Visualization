document.addEventListener('DOMContentLoaded', function() {
  const width = 1920;
  const height = 1080;
  const svg = d3.select('body').select('svg'); // Select the existing SVG element

  fetch('/data/interactions')
    .then(response => response.json())
    .then(data => {
      const nodes = data.nodes;
      const links = data.links;

      // Calculate degree for each node
      const degree = new Map();
      links.forEach(link => {
        degree.set(link.source, (degree.get(link.source) || 0) + 1);
        degree.set(link.target, (degree.get(link.target) || 0) + 1);
      });

      // Scale for node size based on degree
      const radiusScale = d3.scaleSqrt()
        .domain(d3.extent(Array.from(degree.values())))
        .range([5, 15]); // Size range for nodes

      // Color scale (replace with actual attributes and colors)
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force('charge', d3.forceManyBody().strength(-200)) 
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);

      const link = svg.append('g')
          .attr('class', 'links')
          .selectAll('line')
          .data(links)
          .enter().append('line')
          .attr('stroke-width', 1)
          .attr('stroke', '#999');

      const node = svg.append('g')
          .attr('class', 'nodes')
          .selectAll('circle')
          .data(nodes)
          .enter().append('circle')
          .attr('r', d => radiusScale(degree.get(d.id)))
          .attr('fill', d => colorScale(d.group)) // Use group attribute for color
          .call(drag(simulation));

      // Add labels (hover to see names)
      node.append('title')
          .text(d => d.id);

      // Highlight connections on hover
      node.on('mouseover', (event, d) => {
        link.style('stroke', l => l.source.id === d.id || l.target.id === d.id ? '#555' : '#999');
      }).on('mouseout', () => {
        link.style('stroke', '#999');
      });

      function drag(simulation) {
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        return d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended);
      }

      function ticked() {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);
      }
    });
});
