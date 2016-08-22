const d3 = require("d3"),
  document = require("jsdom").jsdom(),
  fs = require('fs'),
  Papa = require('babyparse'),
  fabric = require('fabric').fabric,
  outStream = fs.createWriteStream(__dirname + '/chart.png');

const width = 960,
  height = 500,
  dataFileDir = process.argv[2];

if (process.argv.length < 3) {
  console.log('missing argument.');
  console.log('command usage is `npm start data.csv`');
  process.exit(1);
}

fs.readFile(dataFileDir, 'utf8', function (err, csvText) {
  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    complete: function(results){
      const svgString = renderBarChart(results.data);

      const canvas = fabric.createCanvasForNode(width, height);

      fabric.loadSVGFromString(svgString , (objects, options) => {
        options.top = 0;
    		options.left = 0;
      	const svgGroups = fabric.util.groupSVGElements(objects, options);
      	canvas.add(svgGroups).renderAll();

        // write image
        const stream = canvas.createPNGStream();
        stream.on('data', function(chunk) {
          outStream.write(chunk);
        });
        stream.on('end', function() {
          outStream.end();
          console.log(`[success] create img: ${__dirname}/chart.png`);
        });
      });
    }
  });
});

function renderBarChart(rows){
  const body = d3.select(document.body);

  const margin = {top: 20, right: 20, bottom: 30, left: 40},
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom;

  const x = d3.scaleBand()
            .range([0, innerWidth])
            .padding(0.1);

  const y = d3.scaleLinear()
            .range([innerHeight, 0]);

  const svg = body.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("version", "1.1")
      .attr('xmlns','http://www.w3.org/2000/svg')
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain(rows.map(function(d) { return d.salesperson; }));
  y.domain([0, d3.max(rows, function(d) { return +d.sales; })]);

  svg.selectAll(".bar")
      .data(rows)
    .enter().append("rect")
      .attr("fill", "steelblue")
      .attr("x", function(d) { return x(d.salesperson); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(+d.sales); })
      .attr("height", function(d) { return innerHeight - y(+d.sales); });

  svg.append("g")
      .attr("transform", "translate(0," + innerHeight + ")")
      .call(d3.axisBottom(x));

  svg.append("g")
      .call(d3.axisLeft(y));

  return body.node().innerHTML;
}
