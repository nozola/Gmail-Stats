function buildChart(dataSet,dataSetLabels,chartType) {
  var config = {
  	type: chartType, //Pie, Line, etc...
  	data: {
  		datasets: [{
  			data: dataSet,
  			label: 'Labels'
  		}],
  		labels: dataSetLabels
  	},
  	options: {
  		responsive: true
  	}
  };

	var ctx = document.getElementById('chart-area').getContext('2d');
	window.myPie = new Chart(ctx, config);
}
