$(document).ready(function() { // wait until html loads to run
	// get todays date to set date selected equal to that
	// remove for demo
			//var today = new Date();
			//$("#datepicker").val(d3.timeFormat("%Y-%m-%d")(today));
	//d3.select("#datepicker").on("change",pullData);
	// scales for high and low metrics
	var colorScale = d3.scaleLinear()
		.clamp(true)
		.domain([.5,1,2])
		.range(['red','white','green']);
	var colorScale2 = d3.scaleLinear()
		.clamp(true)
		.domain([.5,1,2])
		.range(['green','white','red']);
	var colorScaleDay = d3.scaleLinear()
		.clamp(true);
	// variable to determine which metrics are displayed
	var board = "";
		
	pullData();
		
	function pullData() {
		
	d3.select("tbody").selectAll("tr").remove();	
	// date variable passed to php
	// removed for demo 
	// var date = d3.select("#datepicker").property("value");
	// varaible passed to php to determine whether data is pulled from current table or old data table
	// removed for demo
	// var tables = date==d3.timeFormat("%Y-%m-%d")(today)?0:1;
	// pull data from servers on page load
	// data pulled from csv instead of php script for demo
	// var data = d3.json("php/huddles_data.php?table="+tables+"&date="+date, function(error, data) {
	var data = d3.csv("data/huddles_data.csv", function(error, data) {
		data.forEach(function(d) {
			d.WEEKDAY_DISTRIBUTION = d.WEEKDAY_DISTRIBUTION?JSON.parse(d.WEEKDAY_DISTRIBUTION):"";
			d.DAY_DISTRIBUTION = d.DAY_DISTRIBUTION?JSON.parse(d.DAY_DISTRIBUTION):"";
			d.WEEK_DISTRIBUTION = d.WEEK_DISTRIBUTION?JSON.parse(d.WEEK_DISTRIBUTION):"";
			d.MONTH_DISTRIBUTION = d.MONTH_DISTRIBUTION?JSON.parse(d.MONTH_DISTRIBUTION):"";
			
			
		});
		// output to console resulting data
		console.log(data);
		// array for all states included; populates state selector
		var states = ['Florida','Texas'];
		// when metric option is selected, re-run data
		d3.selectAll("#sidebar li").on("click", function(d) {
			// set metrics variable equal to text selected
			d3.selectAll("#sidebar li").classed("selected",false);
			d3.select(this).classed("selected",true);
			board = d3.select(this).text();
			// re-run table data
			runTables();
		});
		
		d3.select("#state-div").on("click", function(d) {
			// remove state selector pop-up if already there
			d3.selectAll("#pop-up").remove();
			// create state selector pop-up in mouse position
			var popUp = d3.select("body").append("div").attr("id","pop-up")
				.style("left", d3.event.pageX + "px")
				.style("top", d3.event.pageY + "px")
				
			// fade state selector pop-up out if not clicked within 1 second
			popUp
				.transition()
					.delay(1000)
					.duration(2500)
					.style("opacity",1e-6)
					.remove();
				
			// add a table to pop-up
			var popTable = popUp.append("table").attr("class","table-bordered").append("tbody");
			
			// populate table pop-up with all states values in states array
			popTable.selectAll("tr")
				.data(states.filter(function(d) {return d != d3.select("#state-div h2").text();})) // only populate with values not already in state selector header
				.enter()
				.append("tr")
				.append("td")
				.text(function(d) {return d;})
				.on("click",function(d) {
					// when cell in table is selected, re-run data for that state
					d3.select("#state-div h2").text(d3.select(this).text());
					runTables();
					// remove pop-up once state is selected
					d3.selectAll("#pop-up").remove();
				});
			
			

		});
		
		
		if(board !=	"")
		{
			runTables();
		}
		
		function runTables() {
			// filter returned data by state, include florida talent management on all states
			// also filter to metric selected from sidebar
			var tableData = data.filter(function(d) {
				return (d.STATE == d3.select("#state-div h2").text() || board == "Talent Management") && d.PAGE_TYPE == board});
				
			// remove all existing rows in table
			d3.select("tbody").selectAll("tr")
				.remove();
			// append a row to table for each row of data
			var tr = d3.select("tbody").selectAll("tr")
				.data(tableData)
				.enter().append("tr");
			
			// format table data based on format string from sql
			var formatObject = {"int" : ",.0f",
								"percent0" : ".0%",
								"percent2" : ".2%",
								"ratio2" : ".2f",
								"seconds" : "",
								"secondsRatio" : "",
								"decimal" : ",.2f",
								"dollarRatio0" : "$.0f",
								"dollar0" : "$,.0f"
			}
			
			// this array contains the formats that are not averaged over a period; these are rate stats
			var notAveraged = ['percent0','percent2','ratio2','secondsRatio','decimal','dollarRatio0'];

			// append leftmost column of cells with text as name of metric
			tr.append("td").text(function(d) {return d.METRIC_NAME;});
			// from 0 to 3, going from daily to weekly to monthly to yearly
			for(var i = 0; i < 4; i++) {
				// append a cell to each row
				tr.append("td").text(function(d) {
					// text is metric based on which time frame loop is working on
					var options = {0 : {"main" : d.YESTERDAY, "days" : d.YESTERDAY_DAYS},
									1 : {"main" : d.PRIOR_WEEK, "days" : d.PRIOR_WEEK_DAYS},
									2 : {"main" : d.PRIOR_MONTH, "days" : d.PRIOR_MONTH_DAYS},
									3 : {"main" : d.PRIOR_YEAR, "days" : d.PRIOR_YEAR_DAYS}
					}
					// is returned value is numeric, display formatted number
					if($.isNumeric(options[i].main)) {
						return d3.format(formatObject[d.DISPLAY_FORMAT])(+options[i].main/
						(notAveraged.includes(d.DISPLAY_FORMAT)?1:+options[i].days));
					}
				})
				.style("background-color",function(d) {
					// do cell shading based on value in relation to mean and standard deviations for first 3 loops, and compared to prior year for 4th loop
					var options = {0 : {"main" : d.YESTERDAY, "other" : d.YESTERDAY2, 
										"calc" : 
											((+d.YESTERDAY/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.YESTERDAY_DAYS))
												/d3.max([1,(+d.PIF_YESTERDAY/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.YESTERDAY_DAYS))])),
										"dist" : d.WEEKDAY_DISTRIBUTION?d.WEEKDAY_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {return +a - +b;}):""},
									1 : {"main" : d.PRIOR_WEEK, 
										"calc" : 
											((+d.PRIOR_WEEK/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_WEEK_DAYS))
												/d3.max([1,(+d.PIF_PRIOR_WEEK/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_WEEK_DAYS))])),
										"dist" : d.WEEK_DISTRIBUTION?d.WEEK_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {return +a - +b;}):""},
									2 : {"main" : d.PRIOR_MONTH, 
										"calc" : 
											((+d.PRIOR_MONTH/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_MONTH_DAYS))
												/d3.max([1,(+d.PIF_PRIOR_MONTH/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_MONTH_DAYS))])),
										"dist" : d.MONTH_DISTRIBUTION?d.MONTH_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {return +a - +b;}):""},
									3 : {"main" : d.PRIOR_YEAR, "other" : d.PRIOR_YEAR2, 
										"calc" : 
											((+d.PRIOR_YEAR/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_YEAR_DAYS))
												/d3.max([1,(+d.PIF_PRIOR_YEAR/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_YEAR_DAYS))]))/
											((+d.PRIOR_YEAR2/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_YEAR2_DAYS))
												/d3.max([1,(+d.PIF_PRIOR_YEAR2/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_YEAR2_DAYS))]))}
					}
					if($.isNumeric(options[i].main) && ($.isNumeric(options[i].other) || i < 3))
					{
						if(i < 3)
						{	
							var distMean = d3.mean(options[i].dist);
							var distDeviation = d3.deviation(options[i].dist);
							colorScaleDay
								.domain([distMean - (distDeviation * 2), distMean, distMean + (distDeviation * 2)])
								.range([d.COLOR_SCALE=="high"?"red":"green","white",d.COLOR_SCALE=="high"?"green":"red"]);
							return (options[i].dist.length > 1)?colorScaleDay(options[i].calc):"white";
						} else {
							return d.COLOR_SCALE == "high"?colorScale(options[i].calc):colorScale2(options[i].calc);
						}
					} else {
						// color cell white if either number or comparison have no values
						return "white";
					}
				})
				.property("tempHTML",function(d) { // save info in a variable of the cell object to create table in mouse-over pop-up
					var options = {0 :{"label1" : "Yesterday", "label2" : "Same Day Last Week",
										"metric" : d.YESTERDAY, "metric2" : +d.YESTERDAY2,
										"days" : +d.YESTERDAY_DAYS, "days2" : +d.YESTERDAY_DAYS,
										"pif" : +d.PIF_YESTERDAY/d3.max([1,+d.YESTERDAY_DAYS]), "pif2" : +d.PIF_YESTERDAY2/d3.max([1,+d.YESTERDAY2_DAYS]),
										"mean" : d.WEEKDAY_DISTRIBUTION?d3.mean(d.WEEKDAY_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {return +a - +b;})):"", 
										"deviation" : d.WEEKDAY_DISTRIBUTION?d3.deviation(d.WEEKDAY_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {
												return +a - +b;})):""},
									1 : {"label1" : "Prior Week", "label2" : "2 Weeks Prior",
										"metric" : d.PRIOR_WEEK, "metric2" : +d.PRIOR_WEEK2,
										"days" : +d.PRIOR_WEEK_DAYS, "days2" : +d.PRIOR_WEEK2_DAYS,
										"pif" : +d.PIF_PRIOR_WEEK/d3.max([1,+d.PRIOR_WEEK_DAYS]), "pif2" : +d.PIF_PRIOR_WEEK2/d3.max([1,+d.PRIOR_WEEK2_DAYS]),
										"mean" : d.WEEK_DISTRIBUTION?d3.mean(d.WEEK_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {return +a - +b;})):"", 
										"deviation" : d.WEEK_DISTRIBUTION?d3.deviation(d.WEEK_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {
												return +a - +b;})):""},
									2 : {"label1" : "Prior Month", "label2" : "2 Months Prior",
										"metric" : d.PRIOR_MONTH, "metric2" : +d.PRIOR_MONTH2,
										"days" : +d.PRIOR_MONTH_DAYS, "days2" : +d.PRIOR_MONTH2_DAYS,
										"pif" : +d.PIF_PRIOR_MONTH/d3.max([1,+d.PRIOR_MONTH_DAYS]), "pif2" : +d.PIF_PRIOR_MONTH2/d3.max([1,+d.PRIOR_MONTH2_DAYS]),
										"mean" : d.MONTH_DISTRIBUTION?d3.mean(d.MONTH_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {return +a - +b;})):"", 
										"deviation" : d.MONTH_DISTRIBUTION?d3.deviation(d.MONTH_DISTRIBUTION.map(function(d) {return +d.n;}).sort(function(a, b) {
												return +a - +b;})):""},
									3 : {"label1" : "Prior Year", "label2" : "2 Years Prior",
										"metric" : d.PRIOR_YEAR, "metric2" : +d.PRIOR_YEAR2,
										"days" : +d.PRIOR_YEAR_DAYS, "days2" : +d.PRIOR_YEAR2_DAYS,
										"pif" : +d.PIF_PRIOR_YEAR/d3.max([1,+d.PRIOR_YEAR_DAYS]), "pif2" : +d.PIF_PRIOR_YEAR2/d3.max([1,+d.PRIOR_YEAR2_DAYS])}
					}
					if(i < 3)
					{
						return options[i].metric?(("<table id='tooltipTable' class='table'><tbody>" + 
						"<tr><td>Range</td><td>" + options[i].label1 + "</td></tr>" + 
						"<tr><td>" + d.METRIC_NAME + "</td><td>" + 
							d3.format(formatObject[d.DISPLAY_FORMAT])(+options[i].metric/
								((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days))) + "</td></tr>" +
						(options[i].pif <= 1 || options[i].days == 0?"":"<tr><td>PIF</td> " + 
						"<td>" + d3.format(",.0f")(options[i].pif) + "</td></tr>") + 
						(options[i].pif <= 1 || options[i].days == 0?"":"<tr><td>" + d.METRIC_NAME + " per PIF</td>" +
						"<td>" + d3.format(",.4f")((+options[i].metric/
								((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days)))/
								d3.max([1,options[i].pif])) + "</td></tr>") + 
						"<tr><td>Mean</td><td>" + d3.format(",.4r")(options[i].mean) + "</td></tr>" + 
						"<tr><td>Stan. Dev</td><td>" + d3.format(",.4r")(options[i].deviation) + "</td></tr>" + 
						"<tr><td>Deviations</td><td>" + d3.format(",.2r")(((+options[i].metric/
								(((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days)))/
								d3.max([1,options[i].pif]))- (options[i].mean))/(options[i].deviation)) + "</td></tr>" + 
						"</tbody></table>")):"";
					} else {
						return options[i].metric?("<table id='tooltipTable' class='table'><tbody>" + 
						"<tr><td>Range</td><td>" + options[i].label1 + "</td><td>" + options[i].label2 + "</td></tr>" + 
						"<tr><td>" + d.METRIC_NAME + "</td><td>" + 
							d3.format(formatObject[d.DISPLAY_FORMAT])(+options[i].metric/
								((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days))) + "</td>" + 
							"<td>" + d3.format(formatObject[d.DISPLAY_FORMAT])(options[i].metric2/
								((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days2))) + "</td></tr>" +
						(options[i].pif <= 1 || options[i].days == 0?"":"<tr><td>PIF</td> " + 
						"<td>" + d3.format(",.0f")(options[i].pif) + "</td>" +
						"<td>" + d3.format(",.0f")(options[i].pif2) + "</td></tr>") + 
						(options[i].pif <= 1 || options[i].days == 0?"":"<tr><td>" + d.METRIC_NAME + " per PIF</td>" +
						"<td>" + d3.format(",.4f")((+options[i].metric/
								((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days)))/
								d3.max([1,options[i].pif])) + "</td>" +
						"<td>" + d3.format(",.4f")((+options[i].metric2/
								((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days2)))/
								d3.max([1,options[i].pif2])) + "</td></tr>") + 
						"<tr><td>% of Prior</td><td>" + d3.format(",.2%")((+options[i].metric/
								(((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days)))/
								d3.max([1,options[i].pif]))/
								((+options[i].metric2/
								((notAveraged.includes(d.DISPLAY_FORMAT)?1:options[i].days2)))/
								d3.max([1,options[i].pif2]))) + "</td></tr>" + 
						"</tbody></table>"):"";
					}
				})
				.property("bell-graph",i)
				.property("distribution",function(d) {// pass the distribution string as an array into a variable saved on the cell
					switch(i) {
						case 0:
							var result = d.WEEKDAY_DISTRIBUTION?d.WEEKDAY_DISTRIBUTION:"";
							break;
						case 1:
							var result = d.WEEK_DISTRIBUTION?d.WEEK_DISTRIBUTION:"";
							break;
						case 2:
							var result = d.MONTH_DISTRIBUTION?d.MONTH_DISTRIBUTION:"";
							break;
						case 3:
							var result = "";
							break;
					};
					return result})
				.property("other-distribution",function(d) {return i==0?(d.DAY_DISTRIBUTION?d.DAY_DISTRIBUTION:""):"";})// pass the daily distribution in addition to weekday distribution
				.property("high-low",function(d) {return d.COLOR_SCALE?d.COLOR_SCALE:"";})
				.property("main-value",function(d) {
					switch(i) {
						case 0:
							var result = (+d.YESTERDAY/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.YESTERDAY_DAYS))/
								d3.max([1,+d.PIF_YESTERDAY/d3.max([1,+d.YESTERDAY_DAYS])]);
							break;
						case 1:
							var result = (+d.PRIOR_WEEK/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_WEEK_DAYS))/
								d3.max([1,+d.PIF_PRIOR_WEEK/d3.max([1,+d.PRIOR_WEEK_DAYS])]);
							break;
						case 2:
							var result = (+d.PRIOR_MONTH/(notAveraged.includes(d.DISPLAY_FORMAT)?1:+d.PRIOR_MONTH_DAYS))/
								d3.max([1,+d.PIF_PRIOR_MONTH/d3.max([1,+d.PRIOR_MONTH_DAYS])]);
							break;
						case 3:
							var result = "";
							break;
					};
					return result;})
				.on("mouseover",function(d) {
					// save the cell moused-over for reference
					var cell = d3.select(this);
						// unhide mouseover div and set its contents equal to saved html in cell
						d3.select("#tooltip").classed("hidden",false)
						.html(cell.property("tempHTML"));
					// if cell is daily, weekly or monthly, do distribution calculations			
					if(cell.property("bell-graph") < 3 && cell.property("distribution")[0] )
					{
						var pData = cell.property("distribution");
						// mean and standard deviation of distribution
						var sigma = d3.deviation(pData.map(function(d) {return d.n;}));
						var mean = d3.mean(pData.map(function(d) {return d.n;}));
						var mainValue = +cell.property("main-value");
						// add displayed value to distribution if it is not the most recent entry
						if(+pData[0].n != mainValue)
						{
							/*unshift adds a value to the start of the array.  i use this instead of push because sql passes the values through 
							ordered by date in descending order.  this is so if some values are cut off due to character limitis, they are old 
							values instead of new ones*/
							pData.unshift({"d" : 20180205, "n" : mainValue})
						}
						
						/*minimum value the distribution graph will look at.  it is the min of the displayed value 
							and then whatever is higher, the smallest value in the distribution or the mean minus 3 standard deviations */
						var minAmount = d3.min([mainValue,d3.max([mean - 3 * sigma, d3.min(pData, function(d) {return +d.n;})])]);
						/*maximum value the distribution graph will look at.  it is the max of the displayed value 
							and then whatever is lower, the highest value in the distribution or the mean plus 3 standard deviations */
						var maxAmount = d3.max([mainValue,d3.min([mean + 3 * sigma, d3.max(pData, function(d) {return +d.n;})])]);
						// number of buckets distribution graph will have
						// the lesser of 20 and whichever is higher, the difference between the min and max and the distinct count of different values
						var steps = d3.min([20,d3.max([maxAmount-minAmount,pData.filter(function(v, i) {return i==pData.lastIndexOf(v);}).length])]);
						// determine size of buckets by the range divided by number of buckets
						var stepAmount = (maxAmount - minAmount)/steps;
						//create an array for probability distribution
						var allData = [];
						// only run if number of steps is not infinity, which would be caused if there are no values in distribution
						if(isFinite(steps))
						{
							for (var i = 0; i <= steps; i++) {
								// q is bucket start range
								q = minAmount + (i * stepAmount);
								// p is number of values that fit in bucket
								p = pData.filter(function(d) {return +d.n >= q && +d.n < q + stepAmount;}).length/pData.length;
								el = {"q" : q, "p" : p};
								allData.push(el);
								
							}
						}
						// set graph and axis sizes for two pop-up charts
						var margin = {top: 1, right: 15, bottom: 20, left: 5},
							width = 300 - margin.left - margin.right,
							height = 150 - margin.top - margin.bottom;
						var margin2 = {top: 1, right: 5, bottom: 20, left: 30},
							width2 = 300 - margin2.left - margin2.right,
							height2 = 150 - margin2.top - margin2.bottom;
						// set variable to parse date values
						var parseTime = d3.timeParse("%Y%m%d");
						
						var formatTime = d3.timeFormat("%Y-%m-%d");
							
						// set x and y scales for both charts
						var x = d3.scaleLinear()
							.range([0,width]);
						var x2 = d3.scaleTime()
							.range([0,width2]);
							
						var y = d3.scaleLinear()
							.range([height,0]);
						var y2 = d3.scaleLinear()
							.range([height2,0]);
						// x range for distribution chart is highest and lowest bucket values
						x.domain(d3.extent(allData, function(d) {return d.q;}));
						// x range for time series chart is date range
						x2.domain([d3.min(pData, function(d) {return parseTime(d.d);}), d3.max(pData, function(d) {return parseTime(d.d);})]);
						
						// y range for distribution chart is lowest and highest frequency
						y.domain(d3.extent(allData, function(d) {return d.p;}));
						// y range for time series chart is highest and lowest values
						y2.domain(d3.extent(pData, function(d) {return +d.n;}));
						// default to 1, multiply by seven for day of week time series
						var weekdayMultiplier = 1;
						// add a daily line to each chart if looking at day of week numbers
						if(cell.property("bell-graph") == 0) {
							// create distribution for all days data
							var pData1 = cell.property("other-distribution");
							// mean and starndard deviation for all days
							var sigma1 = d3.deviation(pData1.map(function(d) {return +d.n;}));
							var mean1 = d3.mean(pData1.map(function(d) {return +d.n;}));
							// same methodology as regular data
							var minAmount1 = d3.min([mainValue,d3.max([mean - 3 * sigma1, d3.min(pData1, function(d) {return +d.n;})])]);
							var maxAmount1 = d3.max([mainValue,d3.min([mean + 3 * sigma1, d3.max(pData1, function(d) {return +d.n;})])]);
							// use same step amount as regular data to get similar frequency ranges
							var steps1 = Math.ceil((maxAmount1-minAmount1)/stepAmount);
						
							var allData1 = [];
							if(isFinite(steps1))
							{
								for (var i = 0; i <= steps1; i++) {
									q = minAmount1 + (i * stepAmount);
									p = pData1.filter(function(d) {return +d.n >= q && +d.n < q + stepAmount;}).length/pData1.length;
									el = {"q" : q, "p" : p};
									allData1.push(el);
								}
							}
							// expand domain to include range of all days data
							x.domain([d3.min([d3.min(allData,function(d) {return d.q;}),d3.min(allData1,function(d) {return d.q;})]),
								d3.max([d3.max(allData,function(d) {return d.q;}),d3.max(allData1,function(d) {return d.q;})])]);
							// expand x2 domain to include any additional days
							x2.domain([d3.min([d3.min(pData, function(d) {return parseTime(d.d);}),d3.min(pData1, function(d) {return parseTime(d.d);})]), d3.max([d3.max(pData, function(d) {return parseTime(d.d);}),d3.max(pData1, function(d) {return parseTime(d.d);})])]);
							
							
						}
						
						// add distribution chart svg
						var svg = d3.select("#tooltip").append("svg").attr("class","svg")
							.attr("width",width + margin.left + margin.right)
							.attr("heigh",height + margin.top + margin.bottom)
							.append("g")
								.attr("transform","translate(" + margin.left + "," + margin.top + ")");
						// add time series chart svg
						var svg2 = d3.select("#tooltip").append("svg").attr("class","svg2")
							.attr("width",width2 + margin2.left + margin2.right)
							.attr("heigh",height2 + margin2.top + margin2.bottom)
							.append("g")
								.attr("transform","translate(" + margin2.left + "," + margin2.top + ")");
								
						// add clip path to limit lines to drawn area
						svg2.append("defs").append("clipPath")
							.attr("id","clip")
							.append("rect")
							.attr("class","overlay")
							.attr("width",width2)
							.attr("height",height2);
						
							
						var xAxis = d3.axisBottom()
							.scale(x)
							.ticks(6);
							
						var xAxis2 = d3.axisBottom()
							.scale(x2)
							.tickFormat(formatTime)
							.ticks(6);
							
						var yAxis = d3.axisLeft()
							.scale(y);
						// format time series y axis to be 2 significant digits so it fits better
						var yAxis2 = d3.axisLeft()
							.scale(y2)
							.tickFormat(d3.format(".2s"))
							.ticks(5);
						// probability distribution line function with curve smoothing
						var line = d3.line()
							.x(function(d) {return x(d.q);})
							.y(function(d) {return y(d.p);})
							.curve(d3.curveBundle.beta(.75));
						// time series line function, no curve smoothing on displayed data
						var line2 = d3.line()
							.x(function(d) {return x2(parseTime(d.d));})
							.y(function(d) {return y2(+d.n);});
						// add groups for each axis
						svg.append("g")
							.attr("class", "x axis")
							.attr("transform","translate(0," + height + ")")
							.call(xAxis);
						
						svg2.append("g")
							.attr("class", "x axis")
							.attr("transform","translate(0," + height2 + ")")
							.call(xAxis2);
							
						svg.append("g")
							.attr("class","y axis")
							.call(yAxis);
							
						svg2.append("g")
							.attr("class","y axis")
							.call(yAxis2);
						// add path for probability distribution
						svg.append("path")
							.datum(allData)
							.attr("class","line")
							.attr("d",line);
						// add path for time series
						svg2.append("path")
							.datum(pData)
							.attr("class","line")
							.attr("d",line2)
								.attr("clip-path","url(#clip)");
							
						// if daily data
						if(cell.property("bell-graph") == 0) {
						// create function for every weekday data, smooth curve a bit	
						var line2 = d3.line()
							.x(function(d, i) {return x2(parseTime(d.d));})
							.y(function(d) {return y2(+d.n);});
							// append a path for probability distribution, make red and thinner to differentiate
							svg.append("path")
								.datum(allData1)
								.attr("class","line")
								.attr("d",line)
								.style("stroke","red")
								.style("stroke-width",".5px");
							// append a path for time series, make red and thinner to differentiate
							svg2.append("path")
								.datum(pData1)
								.attr("class","line")
								.attr("d",line2)
								.style("stroke","red")
								.style("stroke-width",".5px")
								.attr("clip-path","url(#clip)");
						}
							
						var colorDirection = cell.property("high-low");
						// do sigma lines colors based on whether a higher or lower number is better
						var sigmaColor = d3.scaleLinear()
							.clamp(true)
							.domain([mean - (2*sigma),mean,mean+(2*sigma)])
							.range([colorDirection=='high'?'red':'green','white',colorDirection=='high'?'green':'red']);
						// array of lines for mean, +- 2 starndard deviations, and actual value for each graph
						var lines = [{"type" : "mean", "value" : mean, "color" : "grey", "width" : 1},
							{"type" : "stddev", "value" : mean - sigma, "color" : sigmaColor(mean - sigma), "width" : 1},
							{"type" : "stddev", "value" : mean - (2*sigma), "color" : sigmaColor(mean - (2*sigma)), "width" : 1},
							{"type" : "stddev", "value" : mean + sigma, "color" : sigmaColor(mean + sigma)},
							{"type" : "stddev", "value" : mean + (2*sigma), "color" : sigmaColor(mean + (2*sigma)), "width" : 1},
							{"type" : "value", "value" : mainValue, "color" : "black", "width" : 3}
							];
						// add lines to probability graph for deviations, reaching from top to bottom of chart
						svg.selectAll(".lines")
							.data(lines)
							.enter()
							.append("line")
							.attr("class","lines")
							.attr("x1",function(d) {return x(d.value);})
							.attr("x2",function(d) {return x(d.value);})
							.attr("y1",0)
							.attr("y2",height)
							.style("stroke",function(d) {return d.color;})
							.style("stroke-width",function(d) {return d.width;});
						
						// add lines to time series for deviations, reaching from left to right of chart
						svg2.selectAll(".lines")
							.data(lines)
							.enter()
							.append("line")
							.attr("class","lines")
							.attr("y1",function(d) {return y2(d.value);})
							.attr("y2",function(d) {return y2(d.value);})
							.attr("x1",0)
							.attr("x2",width2)
							.style("stroke",function(d) {return d.color;})
							.style("stroke-width",function(d) {return d.width;})
							.attr("clip-path","url(#clip)");
							
					}	
						// set location of pop-up
						var docWidth = document.documentElement.clientWidth;
						var docHeight = $("#main-body").height();
					d3.select("#tooltip")
						.style("left", function(d) {
							var divWidth = d3.select(this).style("width").slice(0,-2);
							return d3.min([d3.event.pageX,docWidth-divWidth]) + "px";})
						.style("top", function(d) {
							var divHeight = d3.select(this).style("height").slice(0,-2);
							return d3.min([docHeight-divHeight,d3.event.pageY]) + "px";});
					
					
				})
				.on("mousemove",function(d) { // move pop-up to where mouse is
						// get document height and width
						var docWidth = document.documentElement.clientWidth;
						var docHeight = $("#main-body").height();
					d3.select("#tooltip")
						.style("left", function(d) {
							var divWidth = d3.select(this).style("width").slice(0,-2);
							// place pop-up on mouse, on condition that it does not go outside of document
							return d3.min([d3.event.pageX,docWidth-divWidth]) + "px";})
						.style("top", function(d) {
							var divHeight = d3.select(this).style("height").slice(0,-2);
							return d3.min([docHeight-divHeight,d3.event.pageY]) + "px";});
				})
				.on("mouseout",function(d) { // hide pop-up when not hovering over a cell
					d3.select("#tooltip").classed("hidden",true);
				});
				
			}
		}
	});
	}
});