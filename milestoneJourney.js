const svg = d3.select("#chart");

const margin = { top: 30, right: 30, bottom: 50, left: 70 };
const width = svg.node().clientWidth - margin.left - margin.right;
const height = svg.node().clientHeight - margin.top - margin.bottom;

svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Gridlines
const yGrid = g.append("g").attr("class", "grid");

// Axes
const xAxisGroup = g.append("g")
  .attr("transform", `translate(0,${height})`)
  .attr("class", "axis");

const yAxisGroup = g.append("g")
  .attr("class", "axis");

// Line generator (STEP AFTER = correct pedagogy)
const line = d3.line()
  .x(d => x(d.date))
  .y(d => y(d.milestone))
  .curve(d3.curveStepAfter);

// Load data
Promise.all([
  d3.csv("student_milestone_timeline.csv", d => ({
    pen: d["Student.PEN"],
    date: new Date(d.Date),
    milestone: +d.Milestone_Number
  })),
  d3.csv("final_top_students_telugu.csv", d => ({
    pen: d["Student.PEN"],
    name: d["Student.Name"],
    school: d["School.Name"],
    district: d["District.Name"]
  }))
]).then(([timeline, students]) => {

  // Populate dropdown
  const select = d3.select("#studentSelect");

  select.selectAll("option")
    .data(students)
    .join("option")
    .attr("value", d => d.pen)
    .text(d => `${d.name} — ${d.district}`);

  // Play button
  d3.select("#playBtn").on("click", () => {
    const pen = select.node().value;
    drawJourney(pen);
  });

  function drawJourney(pen) {

    const studentMeta = students.find(d => d.pen === pen);

    const data = timeline
      .filter(d => d.pen === pen)
      .sort((a, b) => a.date - b.date);

    if (!data.length) return;

    // Update student info
    d3.select("#studentInfo")
      .text(`${studentMeta.name} | ${studentMeta.school}, ${studentMeta.district}`);

    // Domains
    x.domain(d3.extent(data, d => d.date));
    y.domain([0, d3.max(data, d => d.milestone) + 1]);

    // Gridlines
    yGrid.call(
      d3.axisLeft(y)
        .ticks(11)
        .tickSize(-width)
        .tickFormat("")
    );

    // Axes
    xAxisGroup.call(
      d3.axisBottom(x)
        .ticks(6)
        .tickFormat(d3.timeFormat("%b %Y"))
    );

    yAxisGroup.call(
      d3.axisLeft(y)
        .ticks(11)
        .tickFormat(d => `M${d}`)
    );

    // Clear old path
    g.selectAll(".milestone-line").remove();

    // Draw path
    const path = g.append("path")
      .datum(data)
      .attr("class", "milestone-line")
      .attr("d", line);

    // Animate path draw
    const totalLength = path.node().getTotalLength();

    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2200)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);
  }

  // Auto-load first student
  drawJourney(students[0].pen);
});