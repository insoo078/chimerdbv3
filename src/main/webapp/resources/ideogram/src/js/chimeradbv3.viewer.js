// https://github.com/stefanpenner/es6-promise
(function(){"use strict";function t(t){return"function"==typeof t||"object"==typeof t&&null!==t}function e(t){return"function"==typeof t}function n(t){G=t}function r(t){Q=t}function o(){return function(){process.nextTick(a)}}function i(){return function(){B(a)}}function s(){var t=0,e=new X(a),n=document.createTextNode("");return e.observe(n,{characterData:!0}),function(){n.data=t=++t%2}}function u(){var t=new MessageChannel;return t.port1.onmessage=a,function(){t.port2.postMessage(0)}}function c(){return function(){setTimeout(a,1)}}function a(){for(var t=0;J>t;t+=2){var e=tt[t],n=tt[t+1];e(n),tt[t]=void 0,tt[t+1]=void 0}J=0}function f(){try{var t=require,e=t("vertx");return B=e.runOnLoop||e.runOnContext,i()}catch(n){return c()}}function l(t,e){var n=this,r=new this.constructor(p);void 0===r[rt]&&k(r);var o=n._state;if(o){var i=arguments[o-1];Q(function(){x(o,r,i,n._result)})}else E(n,r,t,e);return r}function h(t){var e=this;if(t&&"object"==typeof t&&t.constructor===e)return t;var n=new e(p);return g(n,t),n}function p(){}function _(){return new TypeError("You cannot resolve a promise with itself")}function d(){return new TypeError("A promises callback cannot return that same promise.")}function v(t){try{return t.then}catch(e){return ut.error=e,ut}}function y(t,e,n,r){try{t.call(e,n,r)}catch(o){return o}}function m(t,e,n){Q(function(t){var r=!1,o=y(n,e,function(n){r||(r=!0,e!==n?g(t,n):S(t,n))},function(e){r||(r=!0,j(t,e))},"Settle: "+(t._label||" unknown promise"));!r&&o&&(r=!0,j(t,o))},t)}function b(t,e){e._state===it?S(t,e._result):e._state===st?j(t,e._result):E(e,void 0,function(e){g(t,e)},function(e){j(t,e)})}function w(t,n,r){n.constructor===t.constructor&&r===et&&constructor.resolve===nt?b(t,n):r===ut?j(t,ut.error):void 0===r?S(t,n):e(r)?m(t,n,r):S(t,n)}function g(e,n){e===n?j(e,_()):t(n)?w(e,n,v(n)):S(e,n)}function A(t){t._onerror&&t._onerror(t._result),T(t)}function S(t,e){t._state===ot&&(t._result=e,t._state=it,0!==t._subscribers.length&&Q(T,t))}function j(t,e){t._state===ot&&(t._state=st,t._result=e,Q(A,t))}function E(t,e,n,r){var o=t._subscribers,i=o.length;t._onerror=null,o[i]=e,o[i+it]=n,o[i+st]=r,0===i&&t._state&&Q(T,t)}function T(t){var e=t._subscribers,n=t._state;if(0!==e.length){for(var r,o,i=t._result,s=0;s<e.length;s+=3)r=e[s],o=e[s+n],r?x(n,r,o,i):o(i);t._subscribers.length=0}}function M(){this.error=null}function P(t,e){try{return t(e)}catch(n){return ct.error=n,ct}}function x(t,n,r,o){var i,s,u,c,a=e(r);if(a){if(i=P(r,o),i===ct?(c=!0,s=i.error,i=null):u=!0,n===i)return void j(n,d())}else i=o,u=!0;n._state!==ot||(a&&u?g(n,i):c?j(n,s):t===it?S(n,i):t===st&&j(n,i))}function C(t,e){try{e(function(e){g(t,e)},function(e){j(t,e)})}catch(n){j(t,n)}}function O(){return at++}function k(t){t[rt]=at++,t._state=void 0,t._result=void 0,t._subscribers=[]}function Y(t){return new _t(this,t).promise}function q(t){var e=this;return new e(I(t)?function(n,r){for(var o=t.length,i=0;o>i;i++)e.resolve(t[i]).then(n,r)}:function(t,e){e(new TypeError("You must pass an array to race."))})}function F(t){var e=this,n=new e(p);return j(n,t),n}function D(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function K(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}function L(t){this[rt]=O(),this._result=this._state=void 0,this._subscribers=[],p!==t&&("function"!=typeof t&&D(),this instanceof L?C(this,t):K())}function N(t,e){this._instanceConstructor=t,this.promise=new t(p),this.promise[rt]||k(this.promise),I(e)?(this._input=e,this.length=e.length,this._remaining=e.length,this._result=new Array(this.length),0===this.length?S(this.promise,this._result):(this.length=this.length||0,this._enumerate(),0===this._remaining&&S(this.promise,this._result))):j(this.promise,U())}function U(){return new Error("Array Methods must be provided an Array")}function W(){var t;if("undefined"!=typeof global)t=global;else if("undefined"!=typeof self)t=self;else try{t=Function("return this")()}catch(e){throw new Error("polyfill failed because global object is unavailable in this environment")}var n=t.Promise;(!n||"[object Promise]"!==Object.prototype.toString.call(n.resolve())||n.cast)&&(t.Promise=pt)}var z;z=Array.isArray?Array.isArray:function(t){return"[object Array]"===Object.prototype.toString.call(t)};var B,G,H,I=z,J=0,Q=function(t,e){tt[J]=t,tt[J+1]=e,J+=2,2===J&&(G?G(a):H())},R="undefined"!=typeof window?window:void 0,V=R||{},X=V.MutationObserver||V.WebKitMutationObserver,Z="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),$="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,tt=new Array(1e3);H=Z?o():X?s():$?u():void 0===R&&"function"==typeof require?f():c();var et=l,nt=h,rt=Math.random().toString(36).substring(16),ot=void 0,it=1,st=2,ut=new M,ct=new M,at=0,ft=Y,lt=q,ht=F,pt=L;L.all=ft,L.race=lt,L.resolve=nt,L.reject=ht,L._setScheduler=n,L._setAsap=r,L._asap=Q,L.prototype={constructor:L,then:et,"catch":function(t){return this.then(null,t)}};var _t=N;N.prototype._enumerate=function(){for(var t=this.length,e=this._input,n=0;this._state===ot&&t>n;n++)this._eachEntry(e[n],n)},N.prototype._eachEntry=function(t,e){var n=this._instanceConstructor,r=n.resolve;if(r===nt){var o=v(t);if(o===et&&t._state!==ot)this._settledAt(t._state,e,t._result);else if("function"!=typeof o)this._remaining--,this._result[e]=t;else if(n===pt){var i=new n(p);w(i,t,o),this._willSettleAt(i,e)}else this._willSettleAt(new n(function(e){e(t)}),e)}else this._willSettleAt(r(t),e)},N.prototype._settledAt=function(t,e,n){var r=this.promise;r._state===ot&&(this._remaining--,t===st?j(r,n):this._result[e]=n),0===this._remaining&&S(r,this._result)},N.prototype._willSettleAt=function(t,e){var n=this;E(t,void 0,function(t){n._settledAt(it,e,t)},function(t){n._settledAt(st,e,t)})};var dt=W,vt={Promise:pt,polyfill:dt};"function"==typeof define&&define.amd?define(function(){return vt}):"undefined"!=typeof module&&module.exports?module.exports=vt:"undefined"!=typeof this&&(this.ES6Promise=vt),dt()}).call(this);

// https://github.com/kristw/d3.promise
!function(a,b){"function"==typeof define&&define.amd?define(["d3"],b):"object"==typeof exports?module.exports=b(require("d3")):a.d3.promise=b(a.d3)}(this,function(a){var b=function(){function b(a,b){return function(){var c=Array.prototype.slice.call(arguments);return new Promise(function(d,e){var f=function(a,b){return a?void e(Error(a)):void d(b)};b.apply(a,c.concat(f))})}}var c={};return["csv","tsv","json","xml","text","html"].forEach(function(d){c[d]=b(a,a[d])}),c}();return a.promise=b,b});


/* Constructs a prototypal Ideogram class */
var ChimeraDbV3Viewer = function(config) {

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
    var orientation = "vertical";
    this.config.orientation = orientation;
  }

  if (!this.config.chrHeight) {
      var chrHeight,
          container = this.config.container,
          rect = document.querySelector(container).getBoundingClientRect();

      if (orientation === "vertical") {
        chrHeight = rect.height;
      } else {
        chrHeight = rect.width;
      }

      if (container == "body") {
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
        "GRCh37": "GCF_000001305.13",
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

  this.init();
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
    })

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

                    if (numBandDataResponses == taxids.length) {
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
    }
    );


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
          if (ideo.config.orientation == "horizontal") {
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

        if (ideo.config.orientation === "vertical") {
          ideoHeight = ideo.config.chrHeight + 30;
          if (ideo.config.rows > 1) {
            ideoHeight = ideo.config.rows * (ideoHeight - 30);
          }
        } else {
          ideoHeight = ideo.config.chrMargin * ideo.numChromosomes + 30;
        }

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
            if (typeof ideo.config.taxid == "undefined") {
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

            chrs = Object.keys(bandsByChr);

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
                (
                    function checkAnnotData() {
                        timeout = setTimeout(function() {
                            if (!ideo.rawAnnots) {
                                checkAnnotData();
                            } else {
                                pa();
                            }
                        },
                            50
                        );
                    }
                )();
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

                if (ideo.config.orientation === "vertical") {
                    for (var i = 0; i < ideo.chromosomesArray.length; i++) {
                        ideo.rotateChromosomeLabels(d3.select("#" + ideo.chromosomesArray[i].id), i);
                    }
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

            if (!("rotatable" in ideo.config && ideo.config.rotatable === false)) {
              d3.selectAll(".chromosome").on("click", function() {
                ideogram.rotateAndToggleDisplay(this.id);
              });
            } else {
              d3.selectAll(".chromosome").style("cursor", "default");
            }

        } catch (e) {
            console.log(e.stack)
            //  throw e;
        }
    }
};