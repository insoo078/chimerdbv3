<!DOCTYPE html>
<html>
<head>
  <title>Human | Ideogram</title>
  <link type="text/css" rel="stylesheet" href="resources/ideogram/src/css/ideogram.css"/>
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/d3/4.1.1/d3.min.js"></script>
  <script type="text/javascript" src="resources/ideogram/src/js/ideogram.js"></script>
</head>
<body>
  <h1>Human | Ideogram</h1>
  <a href=".">Back to overview</a>
  
  <script type="text/javascript">

    	function onIdeogramLoad() {

		var chrs = ideogram.chromosomes,
			chr1 = chrs["10090"]["1"],
			chr2 = chrs["10090"]["2"],
			r1Band = chr1["bands"][7],
			r2Band = chr2["bands"][17],
			range1, range2, range3, range4, range5, range6,
			syntenicRegions = [];

		range1 = {
			chr: chr1,
			start: r1Band.bp.start,
			stop: r1Band.bp.stop
		};

		for (var i = 1; i < 20; i++) {
			range2 = {
				chr: chr2,
				start: 6000000 * i,
				stop: 6500000 * i
			};
			syntenicRegions.push({"r1": range1, "r2": range2, "color": "#F55"});
		}

		var range3 = {
			chr: chr1,
			start: 125000000,
			stop: 126000000
		};

		range4 = {
			chr: chr2,
			start: 1500000 * i,
			stop: 3600000 * i
		};
		syntenicRegions.push({"r1": range3, "r2": range4, "opacity": 0.7});


		var range6 = {
			chr: chr2,
			start: r2Band.bp.start,
			stop: r2Band.bp.stop
		};

		for (var i = 1; i < 6; i++) {
			range5 = {
				chr: chr1,
				start: 120000000 + (12000000 * i),
				stop: 120000000 + (8000000 * i)
			};
			color = "#AAF";
			if (i == 5) {
				color = "#DDD";
			}
			syntenicRegions.push({"r1": range5, "r2": range6, "color": color});
		}

		ideogram.drawSynteny(syntenicRegions);

	}

// BCR (NC_000022.11)
// ABL1 (NC_000009.12)
	var config = {
	  organism: "human",
          orientation: "horizontal",
	  chromosomes: ["22", "9"],
	  chrMargin: 100,
          chrHeight: 1280,
	  showBandLabels: true,
          brush: true,
          container: "body",
          rows : 10
//	  perspective: "comparative"
//	  onLoad: onIdeogramLoad
	};

	var ideogram = new Ideogram(config);

  </script>
</body>
</html>
