// Developed by Eric Weitz (https://github.com/eweitz)

/* Constructs a prototypal ChimeraDbV3Viewer class */
var ChimeraDbV3Viewer = function(config, gene1, gene2) {

  // Clone the config object, to allow multiple instantiations
  // without picking up prior ideogram's settings
  this.config = JSON.parse(JSON.stringify(config));
  
  this.debug = false;

  if (!this.config.bandDir) {
    this.config.bandDir = "resources/ideogram/data/bands/";
  }

  if (!this.config.container) {
  	this.config.container = "body";
  }

  if (!this.config.resolution) {
    this.config.resolution = 850;
  }

  if ("showChromosomeLabels" in this.config === false) {
    this.config.showChromosomeLabels = true;
  }

  if (!this.config.chrMargin) {
    this.config.chrMargin = 10;
  }

  if (!this.config.orientation) {
    var orientation = "horizontal";
    this.config.orientation = orientation;
  }

  if (!this.config.chrHeight) {
      var chrHeight,
          container = this.config.container,
          rect = document.querySelector(container).getBoundingClientRect();

        chrHeight = rect.width;

      if (container === "body") {
        chrHeight = 500;
      }
      this.config.chrHeight = chrHeight;
  }

  if (!this.config.chrWidth) {
    var chrWidth = 10,
        chrHeight = this.config.chrHeight;
    if (900 > chrHeight && chrHeight > 500) {
      chrWidth = Math.round(chrHeight / 40);
    } else if (chrHeight >= 900) {
      chrWidth = Math.round(chrHeight / 45);
    }
    this.config.chrWidth = chrWidth;
  }

  if (!this.config.showBandLabels) {
    this.config.showBandLabels = false;
  }

  if (!this.config.brush) {
    this.config.brush = false;
  }

  if (!this.config.rows) {
  	this.config.rows = 1;
  }

  this.bump = Math.round(this.config.chrHeight / 125);
  this.adjustedBump = false;
  if (this.config.chrHeight < 200) {
    this.adjustedBump = true;
    this.bump = 4;
  }

  if (config.showBandLabels) {
    this.config.chrMargin += 20;
  }
  
  if( config.topMargin ) {
      this.config.topMargin = 20;
  }
 
  if (config.chromosome) {
    this.config.chromosomes = [config.chromosome];
    if ("showBandLabels" in config === false) {
      this.config.showBandLabels = true;
    }
    if ("rotatable" in config === false) {
      this.config.rotatable = false;
    }
  }

  this.initAnnotSettings();

  this.config.chrMargin = (
    this.config.chrMargin +
    this.config.chrWidth +
    this.config.annotTracksHeight * 2
  );

  if (config.onLoad) {
    this.onLoadCallback = config.onLoad;
  }

  if (config.onDrawAnnots) {
    this.onDrawAnnotsCallback = config.onDrawAnnots;
  }

  if (config.onBrushMove) {
    this.onBrushMoveCallback = config.onBrushMove;
  }

  this.coordinateSystem = "iscn";

  this.maxLength = {
    "bp": 0,
    "iscn": 0
  };


  // The E-Utilies In Depth: Parameters, Syntax and More:
  // https://www.ncbi.nlm.nih.gov/books/NBK25499/
  var eutils = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  this.esearch = eutils + "esearch.fcgi?retmode=json";
  this.esummary = eutils + "esummary.fcgi?retmode=json";
  this.elink = eutils + "elink.fcgi?retmode=json";

  this.organisms = {
    "9606": {
      "commonName": "Human",
      "scientificName": "Homo sapiens",
      "scientificNameAbbr": "H. sapiens",
      "assemblies": { // technically, primary assembly unit of assembly
        "default": "GCF_000001305.14", // GRCh38
        "GRCh38": "GCF_000001305.14",
        "GRCh37": "GCF_000001305.13"
      }
    },
    "10090": {
      "commonName": "Mouse",
      "scientificName": "Mus musculus",
      "scientificNameAbbr": "M. musculus",
      "assemblies": {
        "default": "GCF_000000055.19"
      }
    },
    "7227": {
      "commonName": "Fly",
      "scientificName": "Drosophlia melanogaster",
      "scientificNameAbbr": "D. melanogaster"
    }
  };

  // A flat array of chromosomes
  // (this.chromosomes is an object of
  // arrays of chromosomes, keyed by organism)
  this.chromosomesArray = [];

  this.bandsToShow = [];

  this.chromosomes = {};
  this.numChromosomes = 0;
  this.bandData = {};

  
  
  // Fusion gene의 유전자 정보를 저장할 변수 선언 및 세팅  
  this.genes = {};
  
  var gene1 = JSON.parse(JSON.stringify(gene1));
  var gene2 = JSON.parse(JSON.stringify(gene2));
  this.genes[ gene1.chromosome ] = gene1;
  this.genes[ gene2.chromosome ] = gene2;

  this.init();
};

/**
* Gets chromosome band data from a
* TSV file, or, if band data is prefetched, from an array
*
* UCSC: #chrom chromStart  chromEnd  name  gieStain
* http://genome.ucsc.edu/cgi-bin/hgTables
*  - group: Mapping and Sequencing
*  - track: Chromosome Band (ChimeraDbV3Viewer)
*
* NCBI: #chromosome  arm band  iscn_start  iscn_stop bp_start  bp_stop stain density
* ftp://ftp.ncbi.nlm.nih.gov/pub/gdp/ideogram_9606_GCF_000001305.14_550_V1
*/
ChimeraDbV3Viewer.prototype.getBands = function(content, taxid, chromosomes) {

  var lines = {},
      delimiter, tsvLines, columns, line, stain, chr,
      i, init, tsvLinesLength, source,
      start, stop, firstColumn;

  if (content.slice(0, 8) === "chrBands") {
    source = "native";
  }

  if (typeof chrBands === "undefined" && source !== "native") {
    delimiter = /\t/;
    tsvLines = content.split(/\r\n|\n/);
    init = 1;
  } else {
    delimiter = / /;
    if (source === "native") {
     tsvLines = eval(content);
    } else {
      tsvLines = content;
    }
    init = 0;
  }

  firstColumn = tsvLines[0].split(delimiter)[0];
  if (firstColumn === '#chromosome') {
    source = 'ncbi';
  } else if (firstColumn === '#chrom'){
    source = 'ucsc';
  } else {
    source = 'native';
  }

  tsvLinesLength = tsvLines.length;

  if (source === 'ncbi' || source === 'native') {
    for (i = init; i < tsvLinesLength; i++) {

      columns = tsvLines[i].split(delimiter);

      chr = columns[0];

      if (
        // If a specific set of chromosomes has been requested, and
        // the current chromosome
        typeof(chromosomes) !== "undefined" &&
        chromosomes.indexOf(chr) === -1
      ) {
        continue;
      }

      if (chr in lines === false) {
        lines[chr] = [];
      }

      stain = columns[7];
      if (columns[8]) {
        // For e.g. acen and gvar, columns[8] (density) is undefined
        stain += columns[8];
      }

      line = {
        "chr": chr,
        "bp": {
          "start": parseInt(columns[5], 10),
          "stop": parseInt(columns[6], 10)
        },
        "iscn": {
          "start": parseInt(columns[3], 10),
          "stop": parseInt(columns[4], 10)
        },
        "px": {
          "start": -1,
          "stop": -1,
          "width": -1
        },
        "name": columns[1] + columns[2],
        "stain": stain,
        "taxid": taxid
      };

      lines[chr].push(line);

    }

  } else if (source === 'ucsc') {
    for (i = init; i < tsvLinesLength; i++) {

      // #chrom chromStart  chromEnd  name  gieStain
      // e.g. for fly:
      // chr4	69508	108296	102A1	n/a
      columns = tsvLines[i].split(delimiter);

      if (columns[0] !== 'chr' + chromosomeName) {
        continue;
      }

      stain = columns[4];
      if (stain === 'n/a') {
        stain = 'gpos100';
      }
      start = parseInt(columns[1], 10);
      stop = parseInt(columns[2], 10);

      line = {
        "chr": columns[0].split('chr')[1],
        "bp": {
          "start": start,
          "stop": stop
        },
        "iscn": {
          "start": start,
          "stop": stop
        },
        "px": {
          "start": -1,
          "stop": -1,
          "width": -1
        },
        "name": columns[3],
        "stain": stain,
        "taxid": taxid
      };

      lines[chr].push(line);
    }
  }

  return lines;

};

/**
* Fills cytogenetic arms -- p-arm and q-arm -- with specified colors
*/
ChimeraDbV3Viewer.prototype.colorArms = function(pArmColor, qArmColor) {

  var ideo = this;

  ideo.chromosomesArray.forEach(function(chr, chrIndex){

    var bands = chr.bands,
        pcen = bands[chr.pcenIndex],
        qcen = bands[chr.pcenIndex + 1],
        chrID = chr.id,
        chrMargin = ideo.config.chrMargin * (chrIndex + 1),
        chrWidth = ideo.config.chrWidth;

    pcenStart = pcen.px.start;
    qcenStop = qcen.px.stop;

    d3.select("#" + chrID)
      .append("line")
        .attr("x1", pcenStart)
        .attr("y1", chrMargin + 0.2)
        .attr("x2", pcenStart)
        .attr("y2", chrMargin + chrWidth - 0.2)
        .style("stroke", pArmColor)

    d3.select("#" + chrID)
      .append("line")
        .attr("x1", qcenStop)
        .attr("y1", chrMargin + 0.2)
        .attr("x2", qcenStop)
        .attr("y2", chrMargin + chrWidth - 0.2)
        .style("stroke", qArmColor)

    d3.selectAll("#" + chrID + " .band")
      .data(chr.bands)
      .style("fill", function(d, i) {
        if (i <= chr.pcenIndex) {
          return pArmColor;
        } else {
          return qArmColor;
        }
      });
  });
  d3.selectAll(".p-ter.chromosomeBorder").style("fill", pArmColor);
  d3.selectAll(".q-ter.chromosomeBorder").style("fill", qArmColor);

};

/**
* Generates a model object for each chromosome
* containing information on its name, DOM ID,
* length in base pairs or ISCN coordinates,
* cytogenetic bands, centromere position, etc.
*/
ChimeraDbV3Viewer.prototype.getChromosomeModel = function(bands, chromosomeName, taxid, chrIndex) {

  var chr = {};
  var band, scale,
      width, pxStop,
      startType, stopType,
      chrHeight = this.config.chrHeight,
      maxLength = this.maxLength,
      chrLength,
      cs;

  cs = this.coordinateSystem;

  chr["chrIndex"] = chrIndex;
  chr["name"] = chromosomeName;

  if (this.config.fullChromosomeLabels === true) {
    var orgName = this.organisms[taxid].scientificNameAbbr;
    chr["name"] = orgName + " chr" + chr.name;
  }

  chr["id"] = "chr" + chromosomeName + "-" + taxid;

  chr["length"] = bands[bands.length - 1][cs].stop;
  chrLength = chr["length"];

  pxStop = 0;

  for (var i = 0; i < bands.length; i++) {
    band = bands[i];

    width = chrHeight * chr["length"]/maxLength[cs] * (band[cs].stop - band[cs].start)/chrLength;

    bands[i]["px"] = {"start": pxStop, "stop": pxStop + width, "width": width};

    pxStop = bands[i].px.stop;

    if (band.stain === "acen" && band.name[0] === "p") {
      chr["pcenIndex"] = i;
    }

  }

  chr["width"] = pxStop;

  chr["scale"] = {};

  // TODO:
  //
  // A chromosome-level scale property is likely
  // nonsensical for any chromosomes that have cytogenetic band data.
  // Different bands tend to have ratios between number of base pairs
  // and physical length.
  //
  // However, a chromosome-level scale property is likely
  // necessary for chromosomes that do not have band data.
  //
  // This needs further review.
  if (this.config.multiorganism === true) {
    chr["scale"].bp = 1;
    //chr["scale"].bp = band.iscn.stop / band.bp.stop;
    chr["scale"].iscn = chrHeight * chrLength/maxLength.bp;
  } else {
    chr["scale"].bp = chrHeight / maxLength.bp;
    chr["scale"].iscn = chrHeight / maxLength.iscn;
  }
  chr["bands"] = bands;

  chr["centromerePosition"] = "";
  if (bands[0].bp.stop - bands[0].bp.start === 1) {
    // As with mouse
    chr["centromerePosition"] = "telocentric";

    // Remove placeholder pter band
    chr["bands"] = chr["bands"].slice(1);
  }

  return chr;
};

/**
* Draws labels for each chromosome, e.g. "1", "2", "X".
* If ideogram configuration has 'fullChromosomeLabels: True',
* then labels includes name of taxon, which can help when
* depicting orthologs.
*/
ChimeraDbV3Viewer.prototype.drawChromosomeLabels = function(chromosomes) {

  var i, chr, chrs, taxid, ideo,
      chrMargin2,
      ideo = this,
      chrMargin = ideo.config.chrMargin,
      chrWidth = ideo.config.chrWidth;

  chrs = ideo.chromosomesArray;

//  chrMargin2 = chrWidth/2 + chrMargin - 8;
chrMargin2 = ideo.config.topMargin + chrWidth/2 - 8;

    d3.selectAll(".chromosome")
       .append("text")
        .data(chrs)
         .attr("class", "chrLabel")
         .attr("x", -5)
         .each(function (chr, i) {

           var i, chrMarginI, y, cls;

           var arr = chr.name.split(" ");
           var lines = [];

           if (arr !== undefined) {
               lines.push(arr.slice(0, arr.length - 1).join(" "));
               lines.push(arr[arr.length - 1]);

               chrMarginI = chrMargin * i;
               y = (chrMarginI + chrMargin2);

               for (var i = 0; i < lines.length; i++) {

                   cls = "";
                   if (i === 0 && ideo.config.fullChromosomeLabels) {
                     cls = "italic";
                   }

                   d3.select(this).append("tspan")
                     .text(lines[i])
                     .attr("dy", i ? "1.2em" : 0)
                     .attr("y", y)
                     .attr("x", -8)
                     .attr("text-anchor", "middle")
                     .attr("class", cls);
               }
           }
         });

};

/**
* Draws labels and stalks for cytogenetic bands.
*
* Band labels are text like "p11.11".
* Stalks are small lines that visually connect labels to their bands.
*/
ChimeraDbV3Viewer.prototype.drawBandLabels = function(chromosomes, chrNos) {

  var i, chr, chrs, taxid, ideo;

  ideo = this;

  chrs = [];

  for (taxid in chromosomes) {
    for( chr in chrNos ) {
      chrs.push(chromosomes[taxid][ chrNos[chr] ]);
    }
  }

  var textOffsets = {};

//  chrIndex = 0;
  for (var i = 0; i < chrs.length; i++) {

//    chrIndex += 1;

    chrModel = chrs[i];

    chr = d3.select("#" + chrModel.id);

    var chrMargin = this.config.chrMargin * chrModel.chrIndex,
        lineY1, lineY2,
        ideo = this;

    lineY1 = chrMargin;
    lineY2 = chrMargin - 8;

    if ( chrModel.chrIndex === 0 && "perspective" in this.config && this.config.perspective === "comparative" ) {
      lineY1 += 18;
      lineY2 += 18;
    }

    textOffsets[chrModel.id] = [];

    chr.selectAll("text")
      .data(chrModel.bands)
      .enter()
      .append("g")
        .attr("class", function(d, i) { return "bandLabel bsbsl-" + i;  })
        .attr("transform", function(d) {

          var x, y;

          x = ideo.round(-8 + d.px.start + d.px.width/2);

          textOffsets[chrModel.id].push(x + 13);
          if( i <= 0 ) {
            y = chrMargin - 10;
          }else {
            y = chrMargin + ideo.config.chrWidth + 18;
          }
          y += ideo.config.topMargin;

          return "translate(" + x + "," + y + ")";
        })
        .append("text")
        .text(function(d) { return d.name; });

    chr.selectAll("line.bandLabelStalk")
      .data(chrModel.bands)
      .enter()
      .append("g")
      .attr("class", function(d, i) { return "bandLabelStalk bsbsl-" + i; })
      .attr("transform", function(d) {
        var x = ideo.round(d.px.start + d.px.width/2);
        return "translate(" + x + ", " + lineY1 + ")";
      })
        .append("line")
        .attr("x1", 0)
        .attr("y1", i<=0?0+ideo.config.topMargin:ideo.config.chrWidth+ideo.config.topMargin)
        .attr("x2", 0)
        .attr("y2", i<=0?-8+ideo.config.topMargin:ideo.config.chrWidth + 8+ideo.config.topMargin);
  }

  for (var i = 0; i < chrs.length; i++) {

    chrModel = chrs[i];

    var textsLength = textOffsets[chrModel.id].length,
        overlappingLabelXRight,
        index,
        indexesToShow = [],
        prevHiddenBoxIndex,
        prevTextBox,
        xLeft,
        prevLabelXRight,
        textPadding;

    overlappingLabelXRight = 0;

    textPadding = 5;

    for (index = 0; index < textsLength; index++) {
      // Ensures band labels don't overlap

      xLeft = textOffsets[chrModel.id][index];

      if (xLeft < overlappingLabelXRight + textPadding === false) {
        indexesToShow.push(index);
      } else {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
        continue;
      }

      if (prevHiddenBoxIndex !== index) {

        // This getBoundingClientRect() forces Chrome's
        // 'Recalculate Style' and 'Layout', which takes 30-40 ms on Chrome.
        // TODO: This forced synchronous layout would be nice to eliminate.
        //prevTextBox = texts[index].getBoundingClientRect();
        //prevLabelXRight = prevTextBox.left + prevTextBox.width;

        // TODO: Account for number of characters in prevTextBoxWidth,
        // maybe also zoom.
        prevTextBoxLeft = textOffsets[chrModel.id][index];
        prevTextBoxWidth = 36;

        prevLabelXRight = prevTextBoxLeft + prevTextBoxWidth;
      }

      if (
        xLeft < prevLabelXRight + textPadding
      ) {
        prevHiddenBoxIndex = index;
        overlappingLabelXRight = prevLabelXRight;
      } else {
        indexesToShow.push(index);
      }

    }

    var selectorsToShow = [],
        ithLength = indexesToShow.length,
        j;

    for (var j = 0; j < ithLength; j++) {
      index = indexesToShow[j];
      selectorsToShow.push("#" + chrModel.id + " .bsbsl-" + index);
    }

    this.bandsToShow = this.bandsToShow.concat(selectorsToShow);

  }

};

ChimeraDbV3Viewer.prototype.round = function(coord) {
  // Rounds an SVG coordinates to two decimal places
  // e.g. 42.1234567890 -> 42.12
  // Per http://stackoverflow.com/a/9453447, below method is fastest
  return Math.round(coord * 100) / 100;
};

/**
* Renders all the bands and outlining boundaries of a chromosome.
*/
ChimeraDbV3Viewer.prototype.drawChromosome = function(chrModel, chrIndex) {

  var chr, chrWidth, width,
      pArmWidth, qArmStart, qArmWidth,
      pTerPad, bump, ideo, borderTweak;

  ideo = this;

  bump = ideo.bump;

  // p-terminal band padding
  if (chrModel.centromerePosition !== "telocentric") {
    pTerPad = bump;
  } else {
    pTerPad = Math.round(bump/4) + 3;
  }

  chr = d3.select("svg")
    .append("g")
      .attr("id", chrModel.id)
      .attr("class", "chromosome");

  chrWidth = ideo.config.chrWidth;
  width = chrModel.width;

  var chrMargin = ideo.config.chrMargin * chrIndex + ideo.config.topMargin;

  // Draw chromosome bands
  chr.selectAll("path")
    .data(chrModel.bands)
    .enter()
    .append("path")
      .attr("id", function(d) {
        // e.g. 1q31
        var band = d.name.replace(".", "-");
        return chrModel.id + "-" + band;
      })
      .attr("class", function(d) {
        var cls = "band " + d.stain;
        if (d.stain === "acen") {
          var arm = d.name[0]; // e.g. p in p11
          cls += " " + arm + "-cen";
        }
        return cls;
      })
      .attr("d", function(d, i) {
        var x = ideo.round(d.px.width),
            left = ideo.round(d.px.start),
            curveStart, curveMid, curveEnd,
            curveTweak,
//            innerBump = bump;

        curveTweak = 0;

        if (d.stain === "acen") {
          // Pericentromeric bands get curved
          if (ideo.adjustedBump) {
            curveTweak = 0.35;
            x = 0.2;
            left -= 0.1;
            if (d.name[0] === "q") {
              left += 1.2;
            }
          } else {
            x -= bump/2;
          }

          curveStart = chrMargin + curveTweak;
          curveMid = chrWidth/2 - curveTweak*2;
          curveEnd = chrWidth - curveTweak*2;

          if (d.name[0] === "p") {
            // p arm
            d =
              "M " + left + " " + curveStart + " " +
              "l " + x + " 0 " +
              "q " + bump + " " + curveMid + " 0 " + curveEnd + " " +
              "l -" + x + " 0 z";
          } else {

            if (ideo.adjustedBump) {
              x += 0.2;
            }

            // q arm
            d =
              "M " + (left + x + bump/2) + " " + curveStart + " " +
              "l -" + x + " 0 " +
              "q -" + (bump + 0.5) + " " + curveMid + " 0 " + curveEnd + " " +
              "l " + x + " 0 z";
          }
        } else {
          // Normal bands

          if (i === 0) {
            left += pTerPad - bump/2;
            // TODO: this is a minor kludge to preserve visible
            // centromeres in mouse, when viewing mouse and
            // human chromosomes for e.g. orthology analysis
            if (ideo.config.multiorganism === true) {
              left += pTerPad;
            }
          }


          if (ideo.adjustedBump && d.name[0] === "q") {
            left += 1.8;
          }

          if (i === chrModel.bands.length - 1) {
            left -= pTerPad - bump/2;
          }

          d =
            "M " + left + " " + chrMargin + " " +
            "l " + x + " 0 " +
            "l 0 " + chrWidth + " " +
            "l -" + x + " 0 z";
        }

        return d;
      });

  if (chrModel.centromerePosition !== "telocentric") {
    // As in human
    chr.append('path')
      .attr("class", "p-ter chromosomeBorder " + chrModel.bands[0].stain)
      .attr("d",
        "M " + (pTerPad - bump/2 + 0.1) + " " + chrMargin + " " +
        "q -" + pTerPad + " " + (chrWidth/2) + " 0 " + chrWidth);
  } else {
    // As in mouse
    chr.append('path')
      .attr("class", "p-ter chromosomeBorder " + chrModel.bands[0].stain)
      .attr("d",
        "M " + (pTerPad - 3) + " " + chrMargin + " " +
        "l -" + (pTerPad - 2) + " 0 " +
        "l 0 " + chrWidth + " " +
        "l " + (pTerPad - 2) + " 0 z");

    chr.insert('path', ':first-child')
      .attr("class", "acen")
      .attr("d",
        "M " + (pTerPad - 3) + " " + (chrMargin + chrWidth * 0.1) + " " +
        "l " + (pTerPad + bump/2 + 1) + " 0 " +
        "l 0 " + chrWidth * 0.8 + " " +
        "l -" + (pTerPad + bump/2 + 1) + " 0 z");

  }


  if (ideo.adjustedBump) {
    borderTweak = 1.8;
  } else {
    borderTweak = 0;
  }

  var pcenIndex = chrModel["pcenIndex"],
      pcen = chrModel.bands[pcenIndex],
      qcen = chrModel.bands[pcenIndex + 1],
      pBump, qArmEnd;

  // Why does human chromosome 11 lack a centromeric p-arm band?
  // Answer: because of a bug in the data.  Hack removed; won't work
  // for human 550 resolution until data is fixed.
  if (pcenIndex > 0) {
    pArmWidth = pcen.px.start;
    qArmStart = qcen.px.stop + borderTweak;
    pBump = bump;
  } else {
    // For telocentric centromeres, as in many mouse chromosomes
    pArmWidth = 2;
    pBump = 0;
    qArmStart = document.querySelectorAll("#" + chrModel.id + " .band")[0].getBBox().x;
  }

  qArmWidth = chrModel.width - qArmStart + borderTweak*1.3;
  qArmEnd = qArmStart + qArmWidth - bump/2 - 0.5;

  chr.append('line')
    .attr("class", "cb-p-arm-top chromosomeBorder")
    .attr('x1', bump/2)
    .attr('y1', chrMargin)
    .attr('x2', pArmWidth)
    .attr("y2", chrMargin);

  chr.append('line')
    .attr("class", "cb-p-arm-bottom chromosomeBorder")
    .attr('x1', bump/2)
    .attr('y1', chrWidth + chrMargin)
    .attr('x2', pArmWidth)
    .attr("y2", chrWidth + chrMargin);

  chr.append('line')
    .attr("class", "cb-q-arm-top chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', chrMargin)
    .attr('x2', qArmEnd)
    .attr("y2", chrMargin);

  chr.append('line')
    .attr("class", "cb-q-arm-bottom chromosomeBorder")
    .attr('x1', qArmStart)
    .attr('y1', chrWidth + chrMargin)
    .attr('x2', qArmEnd)
    .attr("y2", chrWidth + chrMargin);

  chr.append('path')
    .attr("class", "q-ter chromosomeBorder " + chrModel.bands[chrModel.bands.length - 1].stain)
    .attr("d",
      "M " + qArmEnd + " " + chrMargin + " " +
      "q " + bump + " " +  chrWidth/2 + " 0 " + chrWidth
    );

};


/**
* Rotates and translates chromosomes upon initialization as needed.
*/
ChimeraDbV3Viewer.prototype.initTransformChromosome = function(chr, chrIndex) {
    chr.attr("data-orientation", "horizontal");
};

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
ChimeraDbV3Viewer.prototype.convertBpToPx = function(chr, bp) {

  var i, band, bpToIscnScale, iscn, px;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    
//    console.log( bp + " " + band.bp.start + " " + band.bp.stop );
    if (bp >= band.bp.start && bp <= band.bp.stop) {

      bpToIscnScale = (band.iscn.stop - band.iscn.start)/(band.bp.stop - band.bp.start);
      iscn = band.iscn.start + (bp - band.bp.start) * bpToIscnScale;

      px = 30 + band.px.start + (band.px.width * (iscn - band.iscn.start)/(band.iscn.stop - band.iscn.start));

      return px;
    }
  }

  throw new Error(
    "Base pair out of range.  " +
    "bp: " + bp + "; length of chr" + chr.name + ": " + band.bp.stop
  );

};

/**
* Converts base pair coordinates to pixel offsets.
* Bp-to-pixel scales differ among cytogenetic bands.
*/
ChimeraDbV3Viewer.prototype.convertPxToBp = function(chr, px) {

  var i, band, prevBand, bpToIscnScale, iscn;

  for (i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    if (px >= band.px.start && px <= band.px.stop) {

      pxToIscnScale = (band.iscn.stop - band.iscn.start)/(band.px.stop - band.px.start);
      iscn = band.iscn.start + (px - band.px.start) * pxToIscnScale;

      bp = band.bp.start + ((band.bp.stop - band.bp.start) * (iscn - band.iscn.start)/(band.iscn.stop - band.iscn.start));

      return Math.round(bp);
    }
  }

  throw new Error(
    "Pixel out of range.  " +
    "px: " + bp + "; length of chr" + chr.name + ": " + band.px.stop
  );

};

/**
* Draws a trapezoid connecting a genomic range on
* one chromosome to a genomic range on another chromosome;
* a syntenic region.
*/
ChimeraDbV3Viewer.prototype.drawSynteny = function(syntenicRegions) {

  var t0 = new Date().getTime();

  var r1, r2,
      c1Box, c2Box,
      chr1Plane, chr2Plane,
      polygon,
      region,
      syntenies, synteny,
      i, svg, color, opacity,
      regionID,
      ideo = this;

  syntenies = d3.select("svg")
    .insert("g", ":first-child")
    .attr("class", "synteny");

  for (i = 0; i < syntenicRegions.length; i++) {

    regions = syntenicRegions[i];

    r1 = regions.r1;
    r2 = regions.r2;

    color = "#CFC";
    if ("color" in regions) {
      color = regions.color;
    }

    opacity = 1;
    if ("opacity" in regions) {
      opacity = regions.opacity;
    }

    r1.startPx = this.convertBpToPx(r1.chr, r1.start);
    r1.stopPx = this.convertBpToPx(r1.chr, r1.stop);
    r2.startPx = this.convertBpToPx(r2.chr, r2.start);
    r2.stopPx = this.convertBpToPx(r2.chr, r2.stop);

    c1Box = document.querySelectorAll("#" + r1.chr.id + " path")[0].getBBox();
    c2Box = document.querySelectorAll("#" + r2.chr.id + " path")[0].getBBox();

    chr1Plane = c1Box.y - 31;
    chr2Plane = c2Box.y - 28;

    regionID = (
      r1.chr.id + "_" + r1.start + "_" + r1.stop + "_" +
      "__" +
      r2.chr.id + "_" + r2.start + "_" + r2.stop
    );

    syntenicRegion = syntenies.append("g")
      .attr("class", "syntenicRegion")
      .attr("id", regionID)
      .on("click", function() {

        var activeRegion = this;
        var others = d3.selectAll(".syntenicRegion")
          .filter(function(d, i) {
            return (this !== activeRegion);
          });

        others.classed("hidden", !others.classed("hidden"));

      })
      .on("mouseover", function() {
        var activeRegion = this;
        d3.selectAll(".syntenicRegion")
          .filter(function(d, i) {
            return (this !== activeRegion);
          })
          .classed("ghost", true);
      })
      .on("mouseout", function() {
        d3.selectAll(".syntenicRegion").classed("ghost", false);
      });


    syntenicRegion.append("polygon")
      .attr("points",
        chr1Plane + ', ' + r1.startPx + ' ' +
        chr1Plane + ', ' + r1.stopPx + ' ' +
        chr2Plane + ', ' + r2.stopPx + ' ' +
        chr2Plane + ', ' + r2.startPx
      )
      .attr('style', "fill: " + color + "; fill-opacity: " + opacity);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", chr1Plane)
      .attr("x2", chr2Plane)
      .attr("y1", r1.startPx)
      .attr("y2", r2.startPx);

    syntenicRegion.append("line")
      .attr("class", "syntenyBorder")
      .attr("x1", chr1Plane)
      .attr("x2", chr2Plane)
      .attr("y1", r1.stopPx)
      .attr("y2", r2.stopPx);
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time in drawSyntenicRegions: " + (t1 - t0) + " ms");
  }
};

/**
* Initializes various annotation settings.  Constructor help function.
*/
ChimeraDbV3Viewer.prototype.initAnnotSettings = function() {

  if (this.config.annotationsPath || this.config.localAnnotationsPath
    || this.annots || this.config.annotations) {

    if (!this.config.annotationHeight) {
      var annotHeight = Math.round(this.config.chrHeight/100);
      this.config.annotationHeight = annotHeight;
    }

    if (this.config.annotationTracks) {
      this.config.numAnnotTracks = this.config.annotationTracks.length;
    } else {
      this.config.numAnnotTracks = 1;
    }
    this.config.annotTracksHeight = this.config.annotationHeight * this.config.numAnnotTracks;

    if (typeof this.config.barWidth === "undefined") {
      this.config.barWidth = 3;
    }

  } else {
    this.config.annotTracksHeight = 0;
  }

  if (typeof this.config.annotationsColor === "undefined") {
    this.config.annotationsColor = "#F00";
  }

};

/**
* Draws annotations defined by user
*/
ChimeraDbV3Viewer.prototype.drawAnnots = function(friendlyAnnots) {

  var ideo = this,
      i, j, annot,
      rawAnnots = [],
      rawAnnot, keys,
      chr,
      chrs = ideo.chromosomes[ideo.config.taxid]; // TODO: multiorganism

  // Occurs when filtering
  if ("annots" in friendlyAnnots[0]) {
    return ideo.drawProcessedAnnots(friendlyAnnots);
  }

  for (chr in chrs) {
    rawAnnots.push({"chr": chr, "annots": []});
  }

  for (i = 0; i < friendlyAnnots.length; i++) {
    annot = friendlyAnnots[i];

    for (j = 0; j < rawAnnots.length; j++) {
      if (annot.chr === rawAnnots[j].chr) {
        rawAnnot = [
          annot.name,
          annot.start,
          annot.stop - annot.start
        ];
        if ("color" in annot) {
          rawAnnot.push(annot.color);
        }
        if ("shape" in annot) {
          rawAnnot.push(annot.shape);
        }
        rawAnnots[j]["annots"].push(rawAnnot);
        break;
      }
    }
  }

  keys = ["name", "start", "length"];
  if ("color" in friendlyAnnots[0]) {
    keys.push("color");
  }
  if ("shape" in friendlyAnnots[0]) {
    keys.push("shape");
  }
  ideo.rawAnnots = {"keys": keys,  "annots": rawAnnots};

  ideo.annots = ideo.processAnnotData(ideo.rawAnnots);

  ideo.drawProcessedAnnots(ideo.annots);

};

/**
* Proccesses genome annotation data.
* Genome annotations represent features like a gene, SNP, etc. as
* a small graphical object on or beside a chromosome.
* Converts raw annotation data from server, which is structured as
* an array of arrays, into a more verbose data structure consisting
* of an array of objects.
* Also adds pixel offset information.
*/
ChimeraDbV3Viewer.prototype.processAnnotData = function(rawAnnots) {

  var keys = rawAnnots.keys,
      rawAnnots = rawAnnots.annots,
      i, j, annot, annots, rawAnnot, annotsByChr,
      chr, start, stop,
      chrModel, ra,
      startPx, stopPx, px,
      trackIndex, color,
      ideo = this;

  annots = [];

  for (i = 0; i < rawAnnots.length; i++) {
    annotsByChr = rawAnnots[i];

    annots.push({"chr": annotsByChr.chr, "annots": []});

    for (j = 0; j < annotsByChr.annots.length; j++) {

      chr = annotsByChr.chr;
      ra = annotsByChr.annots[j];
      annot = {};

      for (var k = 0; k < keys.length; k++) {
        annot[keys[k]] = ra[k];
      }

      annot['stop'] = annot.start + annot.length;

      chrModel = ideo.chromosomes["9606"][chr];

      startPx = ideo.convertBpToPx(chrModel, annot.start);
      stopPx = ideo.convertBpToPx(chrModel, annot.stop);

      px = Math.round((startPx + stopPx)/2) - 28;

      color = ideo.config.annotationsColor;
      if (ideo.config.annotationTracks) {
        annot['trackIndex'] = ra[3];
        color = ideo.config.annotationTracks[annot.trackIndex].color;
      } else {
        annot['trackIndex'] = 0;
      }

      if ('color' in annot) {
        color = annot['color'];
      }

      annot['chr'] = chr;
      annot['chrIndex'] = i;
      annot['px'] = px;
      annot['color'] = color;

      annots[i]["annots"].push(annot);
    }
  }

  return annots;

};

/*
* Can be used for bar chart or sparkline
*/
ChimeraDbV3Viewer.prototype.getHistogramBars = function(annots) {

  var t0 = new Date().getTime();

  var i, j, chrs, chr,
      chrModels, chrPxStop, px,
      chrAnnots, chrName, chrIndex, annot, start, stop,
      bars, bar, barPx, nextBarPx, barIndex, barWidth,
      maxAnnotsPerBar, barHeight, color,
      firstGet = false,
      histogramScaling,
      ideo = this;

  bars = [];

  barWidth = ideo.config.barWidth;
  chrModels = ideo.chromosomes[ideo.config.taxid];
  color = ideo.config.annotationsColor;

  if ("histogramScaling" in ideo.config) {
      histogramScaling = ideo.config.histogramScaling;
  } else {
    histogramScaling = "relative";
  }

  if (typeof ideo.maxAnnotsPerBar === "undefined") {
      ideo.maxAnnotsPerBar = {};
      firstGet = true;
  }

  for (chr in chrModels) {
    chrModel = chrModels[chr];
    chrIndex = chrModel.chrIndex;
    lastBand = chrModel["bands"][chrModel["bands"].length - 1];
    chrPxStop = lastBand.px.stop;
    numBins = Math.round(chrPxStop / barWidth);
    bar = {"chr": chr, "annots": []};
    for (i = 0; i < numBins; i++) {
      px = i*barWidth - ideo.bump;
      bp = ideo.convertPxToBp(chrModel, px + ideo.bump);
      bar["annots"].push({
        "bp": bp,
        "px": px,
        "count": 0,
        "chrIndex": chrIndex,
        "chrName": chr,
        "color": color
      });
    }
    bars.push(bar);
  }

  for (chr in annots) {
    chrAnnots = annots[chr].annots;
    chrName = annots[chr].chr;
    chrModel = chrModels[chrName];
    chrIndex = chrModel.chrIndex;
    barAnnots = bars[chrIndex - 1]["annots"];
    for (i = 0; i < chrAnnots.length; i++) {
      annot = chrAnnots[i];
      px = annot.px;
      for (j = 0; j < barAnnots.length - 1; j++) {
        barPx = barAnnots[j].px;
        nextBarPx = barAnnots[j + 1].px;
        if (px > barPx && px < nextBarPx) {
          bars[chrIndex - 1]["annots"][j]["count"] += 1;
          break;
        }
      }
    }
  }

  if (firstGet === true || histogramScaling === "relative") {
    maxAnnotsPerBar = 0;
    for (i = 0; i < bars.length; i++) {
      annots = bars[i]["annots"];
      for (j = 0; j < annots.length; j++) {
        barCount = annots[j]["count"];
        if (barCount > maxAnnotsPerBar) {
          maxAnnotsPerBar = barCount;
        }
      }
    }
    ideo.maxAnnotsPerBar[chr] = maxAnnotsPerBar;
  }

  // Set each bar's height to be proportional to
  // the height of the bar with the most annotations
  for (i = 0; i < bars.length; i++) {
    annots = bars[i]["annots"];
    for (j = 0; j < annots.length; j++) {
      barCount = annots[j]["count"];
      height = (barCount/ideo.maxAnnotsPerBar[chr]) * ideo.config.chrMargin;
      //console.log(height)
      bars[i]["annots"][j]["height"] = height;
    }
  }

  var t1 = new Date().getTime();
  if (ideo.debug) {
    console.log("Time spent in getHistogramBars: " + (t1 - t0) + " ms");
  }

  return bars;

};


/**
* Draws genome annotations on chromosomes.
* Annotations can be rendered as either overlaid directly
* on a chromosome, or along one or more "tracks"
* running parallel to each chromosome.
*/
ChimeraDbV3Viewer.prototype.drawProcessedAnnots = function(annots) {

  var chrMargin, chrWidth, layout,
      annotHeight, triangle, circle, r, chrAnnot,
      x1, x2, y1, y2,
      ideo = this;

  chrMargin = this.config.chrMargin;
  chrWidth = this.config.chrWidth;

  layout = "tracks";
  if (this.config.annotationsLayout) {
    layout = this.config.annotationsLayout;
  }

  if (layout === "histogram") {
    annots = ideo.getHistogramBars(annots);
  }

  annotHeight = ideo.config.annotationHeight;

  triangle = 'l -' + annotHeight + ' ' + (2*annotHeight) + ' l ' + (2*annotHeight) + ' 0 z';

  // From http://stackoverflow.com/a/10477334, with a minor change ("m -r, r")
  // Circles are supported natively via <circle>, but having it as a path
  // simplifies handling triangles, circles and other shapes in the same
  // D3 call
  r = annotHeight;
  circle =
    'm -' + r  + ', ' + r +
    'a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0' +
    'a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';

  chrAnnot = d3.selectAll(".chromosome")
    .data(annots)
      .selectAll("path.annot")
      .data(function(d) {
        return d["annots"];
      })
      .enter();

  if (layout === "tracks") {

    chrAnnot
      .append("g")
      .attr("id", function(d, i) { return d.id; })
      .attr("class", "annot")
      .attr("transform", function(d) {
        var y = (d.chrIndex + 1) * chrMargin + chrWidth + (d.trackIndex * annotHeight * 2);
        return "translate(" + d.px + "," + y + ")";
      })
      .append("path")
      .attr("d", function(d) {
          if (!d.shape || d.shape === "triangle") {
            return "m0,0" + triangle;
          } else if (d.shape === "circle") {
            return circle;
          }
      })
      .attr("fill", function(d) { return d.color; });

    } else if (layout === "overlay") {
      // Overlaid annotations appear directly on chromosomes

      chrAnnot.append("polygon")
        .attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) {

          x1 = d.px - 0.5;
          x2 = d.px + 0.5;
          y1 = (d.chrIndex + 1) * (chrMargin) + chrWidth;
          y2 = (d.chrIndex + 1) * (chrMargin);

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );

        })
        .attr("fill", function(d) { return d.color; });

    } else if (layout === "histogram") {

      chrAnnot.append("polygon")
        //.attr("id", function(d, i) { return d.id; })
        .attr("class", "annot")
        .attr("points", function(d) {

          x1 = d.px + ideo.bump;
          x2 = d.px + ideo.config.barWidth + ideo.bump;
          y1 = (d.chrIndex) * (chrMargin) + chrWidth;
          y2 = (d.chrIndex) * (chrMargin) + chrWidth + d.height;

          var thisChrWidth = ideo.chromosomesArray[d.chrIndex - 1].width;

          if (x2 > thisChrWidth) {
            x2 = thisChrWidth;
          }

          return (
            x1 + "," + y1 + " " +
            x2 + "," + y1 + " " +
            x2 + "," + y2 + " " +
            x1 + "," + y2
          );

        })
        .attr("fill", function(d) { return d.color; });

    }

  if (ideo.onDrawAnnotsCallback) {
    ideo.onDrawAnnotsCallback();
  }
};


ChimeraDbV3Viewer.prototype.putChromosomesInRows = function() {

    var ideo = this,
        rows = ideo.config.rows,
        chrs,
        chrsPerRow,
        rowIndex, rowIndexStop,
        riCorrection,
        rowHeight, chrIndex, chrWidth, chrMargin;

    chrsPerRow = Math.floor(ideo.numChromosomes/rows);

    riCorrection = 0;
    if (d3.select("svg > *").nodes()[0].tagName !== "g") {
      // Accounts for cross-browser differences in handling of nth-child
      riCorrection = 2;
    }

    for (var i = 1; i < rows; i++) {

      rowIndex = (chrsPerRow * i) + 1 + riCorrection;
      rowIndexStop = rowIndex + chrsPerRow;
      range = "nth-child(n+" + rowIndex + "):nth-child(-n+" + rowIndexStop + ")";

      rowHeight = ideo.config.chrHeight + 20;

      chrIndex = rowIndex + 1 - riCorrection;
      chrWidth = ideo.config.chrWidth;
      chrMargin = ideo.config.chrMargin * chrIndex;

      if (!ideo.config.showBandLabels) {
        chrIndex += 2;
      }

      if (ideo.config.showChromosomeLabels) {
        rowHeight += 12; // TODO: Account for variable font size
      }

      // Similar to "tPadding" in other contexts
      rowWidth = (chrMargin + (chrWidth-4)*(chrIndex)) + 8;

      d3.selectAll("#ideogram .chromosome:" + range)
        .attr("transform", function(d, j) {

          var currentTransform, translation;

          currentTransform = d3.select(this).attr("transform");
          translation = "translate(" + rowHeight + ", " + rowWidth + ")";

          return currentTransform + translation;
        });
    }
};

ChimeraDbV3Viewer.prototype.onBrushMove = function() {
  call(this.onBrushMoveCallback);
};

ChimeraDbV3Viewer.prototype.createBrush = function(from, to) {

  var ideo = this,
      width = ideo.config.chrWidth + 6.5,
      length = ideo.config.chrHeight,
      chr = ideo.chromosomesArray[0],
      chrLengthBp = chr.bands[chr.bands.length - 1].bp.stop,
      x, x0, x1,
      y,
      domain = [0],
      range = [0],
      band;

  for (var i = 0; i < chr.bands.length; i++) {
    band = chr.bands[i];
    domain.push(band.bp.stop);
    range.push(band.px.stop);
  }

  x = d3.scaleLinear().domain(domain).range(range);
  y = d3.select(".band").nodes()[0].getBBox().y - 3.25;

  if (typeof from === "undefined") {
    from = Math.floor(chrLengthBp/10);
  }

  if (typeof right === "undefined") {
    to = Math.ceil(from*2);
  }

  x0 = ideo.convertBpToPx(chr, from);
  x1 = ideo.convertBpToPx(chr, to);

  ideo.selectedRegion = {"from": from, "to": to, "extent": (to - from)};

  ideo.brush = d3.brushX()
    .extent([[0, 0], [length, width]])
    .on("brush", onBrushMove);

  var brushg = d3.select("#ideogram").append("g")
    .attr("class", "brush")
    .attr("transform", "translate(0, " + y + ")")
    .call(ideo.brush)
    .call(ideo.brush.move, [x0, x1]);

  function onBrushMove() {

    var extent = d3.event.selection.map(x.invert),
        from = Math.floor(extent[0]),
        to = Math.ceil(extent[1]);

    ideo.selectedRegion = {"from": from, "to": to, "extent": (to - from)};

    if (ideo.onBrushMove) {
      ideo.onBrushMoveCallback();
    }
    //console.log(ideo.selectedRegion)
  }
};

/**
* Called when ChimeraDbV3Viewer has finished initializing.
* Accounts for certain ideogram properties not being set until
* asynchronous requests succeed, etc.
*/
ChimeraDbV3Viewer.prototype.onLoad = function() {

  call(this.onLoadCallback);
};

ChimeraDbV3Viewer.prototype.onDrawAnnots = function() {
  call(this.onDrawAnnotsCallback);
};


ChimeraDbV3Viewer.prototype.getBandColorGradients = function() {

  var color, colors,
      stain, color1, color2, color3,
      css,
      gradients = "";

  colors = [
    ["gneg", "#FFF", "#FFF", "#DDD"],
    ["gpos25", "#C8C8C8", "#DDD", "#BBB"],
    ["gpos33", "#BBB", "#BBB", "#AAA"],
    ["gpos50", "#999", "#AAA", "#888"],
    ["gpos66", "#888", "#888", "#666"],
    ["gpos75", "#777", "#777", "#444"],
    ["gpos100", "#444", "#666", "#000"],
    ["acen", "#FEE", "#FEE", "#FDD"]
  ];

  for (var i = 0; i < colors.length; i++) {
    stain = colors[i][0];
    color1 = colors[i][1];
    color2 = colors[i][2];
    color3 = colors[i][3];
    gradients +=
      '<linearGradient id="' + stain + '" x1="0%" y1="0%" x2="0%" y2="100%">';
    if (stain === "gneg") {
      gradients +=
        '<stop offset="70%" stop-color="' + color2 + '" />' +
        '<stop offset="95%" stop-color="' + color3 + '" />' +
        '<stop offset="100%" stop-color="' + color1 + '" />';
    } else {
      gradients +=
        '<stop offset="5%" stop-color="' + color1 + '" />' +
        '<stop offset="15%" stop-color="' + color2 + '" />' +
        '<stop offset="60%" stop-color="' + color3 + '" />';
    }
    gradients +=
      '</linearGradient>';
  }

  gradients +=
    '<pattern id="stalk" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#CCE" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#88B; stroke-width:0.7;" />' +
    '</pattern>' +
    '<pattern id="gvar" width="2" height="1" patternUnits="userSpaceOnUse" ' +
      'patternTransform="rotate(-30 0 0)">' +
      '<rect x="0" y="0" width="10" height="2" fill="#DDF" /> ' +
       '<line x1="0" y1="0" x2="0" y2="100%" style="stroke:#99C; stroke-width:0.7;" />' +
    '</pattern>';

  gradients = "<defs>" + gradients + "</defs>";
  css = "<style>" +
    '.gneg {fill: url("#gneg")} ' +
    '.gpos25 {fill: url("#gpos25")} ' +
    '.gpos33 {fill: url("#gpos33")} ' +
    '.gpos50 {fill: url("#gpos50")} ' +
    '.gpos66 {fill: url("#gpos66")} ' +
    '.gpos75 {fill: url("#gpos75")} ' +
    '.gpos100 {fill: url("#gpos100")} ' +
    '.acen {fill: url("#acen")} ' +
    '.stalk {fill: url("#stalk")} ' +
    '.gvar {fill: url("#gvar")} ' +
  '</style>';
  gradients = css + gradients;

  //alert(gradients)

  return gradients;
};


/*
  Returns an NCBI taxonomy identifier (taxid) for the configured organism
*/
ChimeraDbV3Viewer.prototype.getTaxidFromEutils = function(callback) {

  var organism, taxonomySearch, taxid,
      ideo = this;

  organism = ideo.config.organism;

  taxonomySearch = ideo.esearch + "&db=taxonomy&term=" + organism;

  d3.json(taxonomySearch, function(data) {
    taxid = data.esearchresult.idlist[0];
    return callback(taxid);
  });
};


/**
* Returns an array of taxids for the current ideogram
* Also sets configuration parameters related to taxid(s), whether ideogram is
* multiorganism, and adjusts chromosomes parameters as needed
**/
ChimeraDbV3Viewer.prototype.getTaxids = function(callback) {

  var ideo = this,
    taxid, taxids,
    org, orgs, i,
    taxidInit, tmpChrs,
    assembly, chromosomes,
    multiorganism,
    fetchTaxid = true;

  taxidInit = "taxid" in ideo.config;

  ideo.config.multiorganism = (
    ("organism" in ideo.config && ideo.config.organism instanceof Array) ||
    (taxidInit && ideo.config.taxid instanceof Array)
  );

  multiorganism = ideo.config.multiorganism;

  if ("organism" in ideo.config) {
    // ChimeraDbV3Viewer instance was constructed using common organism name(s)
    if (multiorganism) {
      orgs = ideo.config.organism;
    } else {
      orgs = [ideo.config.organism];
    }

    taxids = [];
    tmpChrs = {};
    for (i = 0; i < orgs.length; i++) {
      // Gets a list of taxids from common organism names
      org = orgs[i];
      for (taxid in ideo.organisms) {
        if (ideo.organisms[taxid]["commonName"].toLowerCase() === org) {
          taxids.push(taxid);
          if (multiorganism) {
            // Adjusts 'chromosomes' configuration parameter to make object
            // keys use taxid instead of common organism name
            tmpChrs[taxid] = ideo.config.chromosomes[org];
          }
        }
      }
    }

    if (taxids.length === 0) {
      promise = new Promise(function(resolve, reject) {
        ideo.getTaxidFromEutils(resolve);
      });
      promise.then(function(data){
        taxid = data;
        taxids.push(taxid);

        ideo.config.taxids = taxids;
        ideo.organisms[taxid] = {
          "commonName": "",
          "scientificName": ideo.config.organism,
          "scientificNameAbbr": ""
        };
        return new Promise(function(resolve, reject) {
          ideo.getAssemblyAndChromosomesFromEutils(resolve);
        });
      })
      .then(function(asmChrArray) {
        assembly = asmChrArray[0];
        chromosomes = asmChrArray[1];
        ideo.config.chromosomes = chromosomes;
        ideo.organisms[taxid]["assemblies"] = {
          "default": assembly
        };

        callback(taxids);
      });
    } else {

      ideo.config.taxids = taxids;
      if (multiorganism) {
        ideo.config.chromosomes = tmpChrs;
      }

      callback(taxids);
    }
  } else {

    if (multiorganism) {
      ideo.coordinateSystem = "bp";
      if (taxidInit) {
        taxids = ideo.config.taxid;
      }
    } else {
      if (taxidInit) {
        taxids = [ideo.config.taxid];
      }
      ideo.config.taxids = taxids;
    }

    callback(taxids);
  }
};


ChimeraDbV3Viewer.prototype.isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

/**
Sorts an array of chromosomes by name, per biological convention.
For example: 1, 2, 3, ..., 22, X, Y
*/
ChimeraDbV3Viewer.prototype.sortChromosomesByName = function(chromosomes) {

  var ideo = this;

  return chromosomes.sort(function(a, b) {

    var a = a.name,
        b = b.name,
        isANumeric = ideo.isNumber(a),
        isBNumeric = ideo.isNumber(b);

    if (isANumeric) a = parseInt(a, 10);
    if (isBNumeric) b = parseInt(b, 10);

    if (isANumeric && isBNumeric) {
        return a - b;
    } else if (!isANumeric && !isBNumeric){
      return (a > b) ? 1 : -1;
    } else {
      return (isANumeric === false) ? 1 : -1;
    }
  });

};


/**
  Returns names and lengths of chromosomes for an organism's best-known
  genome assembly.  Gets data from NCBI EUtils web API.
*/
ChimeraDbV3Viewer.prototype.getAssemblyAndChromosomesFromEutils = function(callback) {

    var asmAndChrArray, // [assembly_accession, chromosome_objects_array]
      assemblyAccession, chromosomes, asmSearch,
      asmUid, asmSummary,
      rsUid, nuccoreLink,
      links, ntSummary,
      results, result, chrIndex, chrName, chrLength, chromosome,
      ideo = this;

    organism = ideo.config.organism;

    asmAndChrArray = [];
    chromosomes = [];

    asmSearch =
      ideo.esearch +
      "&db=assembly" +
      "&term=" + organism +
      "AND%20(%22latest%20refseq%22[filter])%20AND%20%22chromosome%20level%22[filter]";

    var promise = d3.promise.json(asmSearch);

    promise
      .then(function(data) {

        // NCBI Assembly database's internal identifier (uid) for this assembly
        asmUid = data.esearchresult.idlist[0];
        asmSummary = ideo.esummary + "&db=assembly&id=" + asmUid;

        return d3.promise.json(asmSummary);
      })
      .then(function(data) {

        // RefSeq UID for this assembly
        rsUid = data.result[asmUid].rsuid;
        assemblyAccession = data.result[asmUid].assemblyaccession;

        asmAndChrArray.push(assemblyAccession);

        // Get a list of IDs for the chromosomes in this genome.
        //
        // This information does not seem to be available from well-known
        // NCBI databases like Assembly or Nucleotide, so we use GenColl,
        // a lesser-known NCBI database.
        nuccoreLink = ideo.elink + "&db=nuccore&linkname=gencoll_nuccore_chr&from_uid=" + rsUid;

        return d3.promise.json(nuccoreLink);
      })
      .then(function(data) {

        links = data.linksets[0].linksetdbs[0].links.join(",");
        ntSummary = ideo.esummary + "&db=nucleotide&id=" + links;

        return d3.promise.json(ntSummary);
      })
      .then(function(data) {

        results = data.result;

        for (var x in results) {

          result = results[x];

          // omit list of reult uids, and skip chrMT
          if (x === "uids" || result.genome === "mitochondrion") {
            continue;
          }

          cnIndex = result.subtype.split("|").indexOf("chromosome");

          chrName = result.subname.split("|")[cnIndex];
          chrLength = result.slen;

          chromosome = {
            "name": chrName,
            "length": chrLength
          };

          chromosomes.push(chromosome);
        }

        chromosomes = ideo.sortChromosomesByName(chromosomes);
        asmAndChrArray.push(chromosomes);
        return callback(asmAndChrArray);
    });

};


ChimeraDbV3Viewer.prototype.initDrawChromosomes = function(bandsArray) {

  var ideo = this,
      taxids = ideo.config.taxids,
      taxid,
      chrIndex = 0,
      i, j, chrs, chromosome, chromosomeModel;

  for (i = 0; i < taxids.length; i++) {

    taxid = taxids[i];
    chrs = ideo.config.chromosomes[taxid];

    ideo.chromosomes[taxid] = {};

// chrIndex is started by 0
    for (j = 0; j < chrs.length; j++) {
      bands = bandsArray[chrIndex];

      chromosome = chrs[j];
      chromosomeModel = ideo.getChromosomeModel(bands, chromosome, taxid, chrIndex);

      ideo.chromosomes[taxid][chromosome] = chromosomeModel;
      ideo.chromosomesArray.push(chromosomeModel);

      ideo.drawChromosome(chromosomeModel, chrIndex);

      chrIndex += 1;
    }

    if (ideo.config.showBandLabels === true) {
        ideo.drawBandLabels(ideo.chromosomes, chrs);
    }

  }
};


/**
* Initializes an ideogram.
* Sets some high-level properties based on instance configuration,
* fetches band and annotation data if needed, and
* writes an SVG element to the document to contain the ideogram
*
*/
ChimeraDbV3Viewer.prototype.init = function() {

  var bandDataFile, bandDataFileNames,
      taxid, taxids, i, svgClass,
      chrs;

  var ideo = this;

  var t0 = new Date().getTime();

  var bandsArray = [],
      maxLength = 0,
      numBandDataResponses = 0,
      resolution = this.config.resolution,
      accession;

  var promise = new Promise(function(resolve, reject) {
    ideo.getTaxids(resolve);
  });

  promise.then(function(taxids) {

  taxid = taxids[0];
  ideo.config.taxid = taxid;
  ideo.config.taxids = taxids;

  for (i = 0; i < taxids.length; i++) {
    taxid = taxids[i];

    if (!ideo.config.assembly) {
      ideo.config.assembly = "default";
    }
    accession = ideo.organisms[taxid]["assemblies"][ideo.config.assembly];

    bandDataFileNames = {
      // Homo sapiens (human)
      "9606": "native/ideogram_9606_" + accession + "_" + resolution + "_V1.js",
      //"9606": "ncbi/ideogram_9606_" + accession + "_" + resolution + "_V1.tsv",

      // Mus musculus (mouse)
      "10090": "native/ideogram_10090_" + accession + "_NA_V2.js",

      // Drosophila melanogaster (fly)
      "7227": "ucsc/drosophila_melanogaster_dm6.tsv"
    };

    if (typeof chrBands === "undefined" && taxid in bandDataFileNames) {

      d3.request(ideo.config.bandDir + bandDataFileNames[taxid])
        .on("beforesend", function(data) {
          // Ensures correct taxid is processed in response callback; using
          // simply 'taxid' variable gives the last *requested* taxid, which
          // fails when dealing with multiple taxa.
          data.taxid = taxid;
        })
        .get(function(error, data) {
          ideo.bandData[data.taxid] = data.response;
          numBandDataResponses += 1;

          if (numBandDataResponses === taxids.length) {
            processBandData();
            writeContainer();
          }
        });
    } else {
      if (typeof chrBands !== "undefined") {
        // If bands already available,
        // e.g. via <script> tag in initial page load
        ideo.bandData[taxid] = chrBands;
      }
      processBandData();
      writeContainer();
    }
  }
});

  function writeContainer() {

    if (ideo.config.annotationsPath) {
      d3.json(
        ideo.config.annotationsPath, // URL
        function(data) { // Callback
          ideo.rawAnnots = data;
        }
      );
    }

    svgClass = "";
    if (ideo.config.showChromosomeLabels) {
      if (ideo.config.orientation === "horizontal") {
        svgClass += "labeledLeft ";
      } else {
        svgClass += "labeled ";
      }
    }

    if (
      ideo.config.annotationsLayout &&
      ideo.config.annotationsLayout === "overlay"
    ) {
      svgClass += "faint";
    }

    var ideoHeight;

        // Container 높이 조절하는 부분
      ideoHeight = ideo.config.chrMargin * ideo.numChromosomes + 100;

    var gradients = ideo.getBandColorGradients();

    var svg = d3.select(ideo.config.container)
      .append("svg")
        .attr("id", "ideogram")
        .attr("class", svgClass)
        .attr("width", "97%")
        .attr("height", ideoHeight)
        .html(gradients);

    finishInit();

  }

  /*
  * Completes default ideogram initialization
  * by calling downstream functions to
  * process raw band data into full JSON objects,
  * render chromosome and cytoband figures and labels,
  * apply initial graphical transformations,
  * hide overlapping band labels, and
  * execute callbacks defined by client code
  */
  function processBandData() {

    var j, k, chromosome, bands, chromosomeModel,
        chrLength,
        bandData, bands, bandsByChr,
        stopType,
        taxid, taxids, chrs, chrsByTaxid;

    bandsArray = [];
    maxLength = 0;

    if (ideo.config.multiorganism === true) {
      ideo.coordinateSystem = "bp";
      taxids = ideo.config.taxids;
      for (i = 0; i < taxids.length; i++) {
        taxid = taxids[i];
      }
    } else {
      if (typeof ideo.config.taxid === "undefined") {
        ideo.config.taxid = ideo.config.taxids[0];
      }
      taxid = ideo.config.taxid;
      taxids = [taxid];
      ideo.config.taxids = taxids;
    }

    if ("chromosomes" in ideo.config) {
      chrs = ideo.config.chromosomes;
    }
    if (ideo.config.multiorganism) {
      chrsByTaxid = chrs;
    }
    ideo.config.chromosomes = {};

    var t0_b = new Date().getTime();
    for (j = 0; j < taxids.length; j++) {

      taxid = taxids[j];
      bandData = ideo.bandData[taxid];
      if (ideo.config.multiorganism) {
        chrs = chrsByTaxid[taxid];
      }
      bandsByChr = ideo.getBands(bandData, taxid, chrs);

//      chrs = Object.keys(bandsByChr);

      ideo.config.chromosomes[taxid] = chrs.slice();

      ideo.numChromosomes += ideo.config.chromosomes[taxid].length;

      for (k = 0; k < chrs.length; k++) {

        chromosome = chrs[k];
        bands = bandsByChr[chromosome];
        bandsArray.push(bands);

        chrLength = {
          "iscn": bands[bands.length - 1].iscn.stop,
          "bp": bands[bands.length - 1].bp.stop
        };

        if (chrLength.iscn > ideo.maxLength.iscn) {
          ideo.maxLength.iscn = chrLength.iscn;
        }

        if (chrLength.bp > ideo.maxLength.bp) {
          ideo.maxLength.bp = chrLength.bp;
        }
      }
    }
    var t1_b = new Date().getTime();
    if (ideo.debug) {
      console.log("Time in processBandData: " + (t1_b - t0_b) + " ms");
    }
}

function finishInit() {

    try {

    var t0_a = new Date().getTime();

    var chrIndex = 0,
        taxids,
        chr, chrModel, chromosome,
        i, j, m, n;
    
    ideo.initDrawChromosomes(bandsArray);
    
    ideo.initDrawGeneStructure();

    taxids = ideo.config.taxids;

    chrIndex = 0;
    for (m = 0; m < taxids.length; m++) {
      taxid = taxids[m];
      chrs = ideo.config.chromosomes[taxid];
      for (n = 0; n < chrs.length; n++) {
        chrIndex += 1;
        chromosome = chrs[n];

        chrModel = ideo.chromosomes[taxid][chromosome];

        chr = d3.select("#chr" + chromosome + "-" + taxid);

        ideo.initTransformChromosome(chr, chrIndex);
      }

    }

    // Waits for potentially large annotation dataset
    // to be received by the client, then triggers annotation processing
    if (ideo.config.annotationsPath) {

      function pa() {

        if (typeof timeout !== "undefined") {
          window.clearTimeout(timeout);
        }

        ideo.annots = ideo.processAnnotData(ideo.rawAnnots);
        ideo.drawProcessedAnnots(ideo.annots);

        if (ideo.initCrossFilter) {
          ideo.initCrossFilter();
        }

      }

      if (ideo.rawAnnots) {
        pa();
      } else {
        (function checkAnnotData() {
          timeout = setTimeout(function() {
            if (!ideo.rawAnnots) {
              checkAnnotData();
            } else {
              pa();
            }
            },
            50
          );
        })();
      }
    }

    if (ideo.config.showBandLabels === true) {
      var bandsToShow = ideo.bandsToShow.join(",");

      // d3.selectAll resolves to querySelectorAll (QSA).
      // QSA takes a surprisingly long time to complete,
      // and scales with the number of selectors.
      // Most bands are hidden, so we can optimize by
      // Hiding all bands, then QSA'ing and displaying the
      // relatively few bands that are shown.
      var t0_c = new Date().getTime();
      d3.selectAll(".bandLabel, .bandLabelStalk").style("display", "none");
      d3.selectAll(bandsToShow).style("display", "");
      var t1_c = new Date().getTime();
      if (ideo.debug) {
        console.log("Time in showing bands: " + (t1_c - t0_c) + " ms");
      }
    }

    if (ideo.config.showChromosomeLabels === true) {
      ideo.drawChromosomeLabels(ideo.chromosomes);
    }

    if (ideo.config.rows > 1) {
      ideo.putChromosomesInRows();
    }

    if (ideo.config.brush === true) {
      ideo.createBrush();
    }

    if (ideo.config.annotations) {
      ideo.drawAnnots(ideo.config.annotations);
    }

    if (ideo.config.armColors) {
      var ac = ideo.config.armColors;
      ideo.colorArms(ac[0], ac[1]);
    }

    var t1_a = new Date().getTime();
    if (ideo.debug) {
      console.log("Time in drawChromosome: " + (t1_a - t0_a) + " ms");
    }

    var t1 = new Date().getTime();
    if (ideo.debug) {
      console.log("Time constructing ideogram: " + (t1 - t0) + " ms");
    }

    if (ideo.onLoadCallback) {
      ideo.onLoadCallback();
    }

     d3.selectAll(".chromosome").style("cursor", "default");

     } catch (e) {
       console.log(e.stack)
      //  throw e;
    }

  }
};

ChimeraDbV3Viewer.prototype.initDrawGeneStructure = function() {
    var ideo = this;
    
        var chrs = ideo.chromosomes;
    var genes = ideo.genes;
    
    taxids = ideo.config.taxids;

    chrs = Object.keys(genes);
    var gene_length = 0;
    for(i=0; i<chrs.length; i++) {
        var gene = genes[chrs[i]];
        
        gene_length += gene.end - gene.start + 1;
    }

    for (m = 0; m < taxids.length; m++) {
      taxid = taxids[m];
      chrs = ideo.config.chromosomes[taxid];
      for (n = 0; n < chrs.length; n++) {
        chromosome = chrs[n];
        chrModel = ideo.chromosomes[taxid][chromosome];
        chrIndex = chrModel.chrIndex;
        
        gene = genes[chromosome];
        length_ratio = (gene.end-gene.start + 1) / gene_length;
        
        ideo.drawGeneStructure( chrModel, gene, length_ratio );
      }
    }
};

ChimeraDbV3Viewer.prototype.drawGeneStructure = function( chrModel, gene, length_ratio ) {
    var ideo = this;
    
    container = this.config.container,
    rect = document.querySelector(container).getBoundingClientRect();

    // 유전자의 길이를 상대적으로 계산해 보여준다
    var backbone_width = (ideo.config.chrHeight) * length_ratio;
    
    var BASE_Y = 200;
    
    var MARGIN = 50;
    var start_x = 0;
    var end_x = 0;
    if( chrModel.chrIndex === 0 ) {
        start_x = MARGIN;
        end_x = backbone_width - MARGIN;
    }else {
        start_x += (ideo.config.chrHeight * (1-length_ratio)) + MARGIN;
        end_x = start_x + backbone_width - MARGIN;
    }
    
    gene_backbone = d3.select("svg")
    .append("g")
      .attr("id", gene.gene)
      .attr("class", "gene-structure");
      
      gene_backbone.append('line')
    .attr("class", "gene-backbone")
    .attr('x1', start_x)
    .attr('y1', BASE_Y)
    .attr('x2', end_x)
    .attr("y2", BASE_Y);
    
    var tmp = [{"point":gene.start, "x":start_x, "direction":"5'"}, {"point":gene.end, "x":end_x, "direction":"3'"}];
  
    gene_backbone.append("line")
            .attr("style", "stroke:#aaa;stroke-width:0.5;")
            .attr("x1", start_x)
            .attr("y1", BASE_Y)
            .attr("x2", start_x)
            .attr("y2", BASE_Y + 10);
   
    gene_backbone.append("line")
            .attr("style", "stroke:#aaa;stroke-width:0.5;")
            .attr("x1", end_x)
            .attr("y1", BASE_Y)
            .attr("x2", end_x)
            .attr("y2", BASE_Y + 10);
    
    gene_backbone.selectAll(".gene-structure-Label")
      .data(tmp)
      .enter()
      .append("g")
        .attr("class", function(i) { return "gene-structure-Label bsbsl-" + i;  })
        .attr("transform", function(d) {

          var x, y;

          x = d.x;
          y = BASE_Y + 20;
          return "translate(" + x + "," + y + ")";
        })
        .append("text")
        .text(function(d) { return d.point; });

    gene_backbone.selectAll(".gene-structure-dir-Label")
      .data(tmp)
      .enter()
      .append("g")
        .attr("class", function(i) { return "gene-structure-dir-Label bsbsl-" + i;  })
        .attr("transform", function(d) {

          var x, y;

          x = d.x;
          y = BASE_Y - 20;
          return "translate(" + x + "," + y + ")";
        })
        .append("text")
        .text(function(d) { return d.direction; });


        var unit_len_nt = (backbone_width - 2*MARGIN) / (gene.end-gene.start+1);

        var rnas = gene.rnas;
        for(i=0; i<rnas.length; i++) {
            var rna = rnas[i];
            
            var exons = rna.features;

            for(j=0; j<exons.length; j++) {
                var start = exons[j].start - gene.start;
                var end = exons[j].end - gene.start;
                
                var x1 = start_x + (start*unit_len_nt);
                var y1 = BASE_Y - 10;
                var width = (end-start+1) * unit_len_nt;

                gene_backbone.append("rect")
                        .style("fill", "#ff3ee8")
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .attr("x", x1)
                        .attr("y", y1)
                        .attr("width", width)
                        .attr("height", 20);
            }
        }
        
        var startPx1 = ideo.convertBpToPx(chrModel, gene.start);
        var stopPx1 = ideo.convertBpToPx(chrModel, gene.end);

        var aa = d3.selectAll(".chromosome").each(function(d, i) {
          if( this.id.startsWith("chr" + gene.chromosome) ){
              var rect = getBoundary(this.getBoundingClientRect(), getVpPos(this) );

            var y1 = rect.bottom;
            var y2 = BASE_Y - 30;
            var startPx2 = start_x;
            var stopPx2 = end_x;
                        
                if( i > 0) {
                    startPx2 = startPx1;
                    stopPx2 = stopPx1;
                    
                    y2 = rect.top;
                    y1 = BASE_Y + 30;
                    startPx1 = start_x;
                    stopPx1 = end_x;
                }
                
            var path1 = "M" + startPx1 + " " + y1;
            path1 += " L" + startPx1 + " " + (y1+20);
            path1 += " L" + startPx2 + " " + (y2-20);
            path1 += " L" + startPx2 + " " + y2;
            path1 += " ";
            
            var path2 = "M" + stopPx1 + " " + y1;
            path2 += " L" + stopPx1 + " " + (y1+20);
            path2 += " L" + stopPx2 + " " + (y2-20);
            path2 += " L" + stopPx2 + " " + y2;
            path2 += " ";

            gene_backbone.append("path")
                    .attr("d", path1 )
                    .attr("style", "stroke:#4f3;stroke-width:0.5;")
                    .attr("fill", "none");
            
            
            gene_backbone.append("path")
                    .attr("d", path2 )
                    .attr("style", "stroke:#4f3;stroke-width:0.5;")
                    .attr("fill", "none");
            }
        });
        
//        console.log( gene_backbone );
};

function getBoundary(base, el) {
    return {
        top: base.top - el.top - 15,
//        top: base.top - el.top,
        left: base.left - el.left,
        width: base.width,
//        bottom: base.bottom - el.top,
        bottom: base.bottom - el.top - 15,
        height: base.height,
        right: base.right - el.left
    };
}

function getVpPos(el) {
    if(el.parentNode.nodeName === 'svg') {
        return el.parentNode.getBoundingClientRect();
    }
    return getVpPos(el.parentNode);
}