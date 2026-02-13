const svg = d3.select("#chart");
const margin = { top: 30, right: 30, bottom: 50, left: 60 };

let g, x, y, xAxisGroup, yAxisGroup, yGrid;
let currentPen = null;

// ----------------------------
// INIT CHART
// ----------------------------
function initChart() {

  svg.selectAll("*").remove();

  const width = svg.node().clientWidth - margin.left - margin.right;
  const height = svg.node().clientHeight - margin.top - margin.bottom;

  svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

  g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  x = d3.scaleTime().range([0, width]);
  y = d3.scaleLinear().range([height, 0]);

  yGrid = g.append("g").attr("class", "grid");

  xAxisGroup = g.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "axis");

  yAxisGroup = g.append("g")
    .attr("class", "axis");

  return { width, height };
}

const line = d3.line()
  .x(d => x(d.date))
  .y(d => y(d.milestone))
  .curve(d3.curveStepAfter);

// ----------------------------
// LOAD DATA
// ----------------------------
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

  const select = d3.select("#studentSelect");

  select.selectAll("option")
    .data(students)
    .join("option")
    .attr("value", d => d.pen)
    .text(d => `${d.name} — ${d.district}`);

  d3.select("#playBtn").on("click", () => {
    drawJourney(select.node().value);
  });

  function drawJourney(pen) {

    currentPen = pen;

    const { width, height } = initChart();

    const studentMeta = students.find(d => d.pen === pen);

    const data = timeline
      .filter(d => d.pen === pen)
      .sort((a, b) => a.date - b.date);

    if (!data.length) return;

    d3.select("#studentInfo")
      .text(`${studentMeta.name} | ${studentMeta.school}, ${studentMeta.district}`);

    x.domain(d3.extent(data, d => d.date));
    y.domain([0, d3.max(data, d => d.milestone) + 1]);

    yGrid.call(
      d3.axisLeft(y)
        .ticks(10)
        .tickSize(-width)
        .tickFormat("")
    );

    xAxisGroup.call(
  d3.axisBottom(x)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b"))
)
.selectAll("text")
.style("font-size", "12px")
.style("font-weight", 500);

    yAxisGroup.call(
      d3.axisLeft(y)
        .ticks(10)
        .tickFormat(d => `M${d}`)
    );

    const path = g.append("path")
      .datum(data)
      .attr("class", "milestone-line")
      .attr("d", line);

    const totalLength = path.node().getTotalLength();

    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);
  }

  drawJourney(students[0].pen);

  // ----------------------------
  // RESPONSIVE RESIZE (SMOOTH)
  // ----------------------------
  let resizeTimeout;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (currentPen) {
        drawJourney(currentPen);
      }
    }, 200);
  });

});