angular.module('GCDarseReplacementApp', ['ngMaterial', 'ngMessages']).controller('mainCtrl', function($scope){

 
    // Controller variables
    this.startDate = new Date()
    this.endDate = new Date();
    this.jetty = "";
    this.analyzer = "";
    this.analyzerTagSet = "";
    this.cargoName = "";
    this.roundedTotal = 0.0;
    this.normalizedTotal = 0.0;
    this.startTime = "";
    this.endTime = "";
    this.startDateTime = "";
    this.endDateTime = "";
    var resultingData = new ResultingData();
    this.startDateTime = "";
    this.endDateTime = "";
    this.resultingFlowTotals = [];
    this.flowToggleSwitch = false;

    // Charts
    this.methaneTrend = "";
    this.ethaneTrend = "";


    var keepFlowUnder4000 = false;
    var cargo = "";
    var interval = "4m";
    var outliers = new Array();
    var rememberOutliers = [];
    var rememberGasComponentOutliers = [];
    var jettyTags = [];
    var limsTags = [];
    var rawFlowTotals = [];



    var analyzerTags = ["CAM_DCS:AI1001A_C6", "CAM_DCS:AI1001A_ETH", "CAM_DCS:AI1001A_IPEN", "CAM_DCS:AI1001A_IBU", "CAM_DCS:AI1001A_METH", "CAM_DCS:AI1001A_N2", "CAM_DCS:AI1001A_NPEN", "CAM_DCS:AI1001A_NBU", "CAM_DCS:AI1001A_PRO", "CAM_DCS:AI1001A_CO2", "CAM_DCS:AI1001B_C6", "CAM_DCS:AI1001B_ETH", "CAM_DCS:AI1001B_IPEN", "CAM_DCS:AI1001B_IBU", "CAM_DCS:AI1001B_METH", "CAM_DCS:AI1001B_N2", "CAM_DCS:AI1001B_NPEN", "CAM_DCS:AI1001B_NBU", "CAM_DCS:AI1001B_PRO", "CAM_DCS:AI1001B_CO2", "CAM_DCS:AI1101A9", "CAM_DCS:AI1101A3", "CAM_DCS:AI1101A7", "CAM_DCS:AI1101A5", "CAM_DCS:AI1101A2", "CAM_DCS:AI1101A1", "CAM_DCS:AI1101A8", "CAM_DCS:AI1101A6", "CAM_DCS:AI1101A4", "CAM_DCS:AI1101A_CO2.PV", "CAM_DCS:AI1101B1", "CAM_DCS:AI1101B2", "CAM_DCS:AI1101B3", "CAM_DCS:AI1101B4", "CAM_DCS:AI1101B5", "CAM_DCS:AI1101B6", "CAM_DCS:AI1101B7", "CAM_DCS:AI1101B8", "CAM_DCS:AI1101B9", "CAM_DCS:AI1101B_CO2.PV"];


    // For each WebId get the interpolated data from start to end time on the interval.
    async function getData(start, end){
        var piData = [];
        for (const tag of jettyTags) {
            const interpolatedData = await getInterpolatedData(tag.WebID, start, end, interval);
            piData.push(interpolatedData);
        }
        return piData
    };

    async function getLimsData(tags, start, end){
        var piData = [];
        for (const tag of tags) {
            const recordedData = await getRecordedData(tag.WebID, start, end);
            piData.push(recordedData);
        }
        return piData
    };

  
    var dataSamples = [];
    var rawAnalyzerSamples = [];
    var limsSamples = [];
    var roundedAverageTotal = 0.0;
    var normalizedAverageTotal = 0.0;

    this.changeCallback = function() {
        //this.flowToggleSwitch = this.flowToggleSwitch;
        keepFlowUnder4000 = this.flowToggleSwitch;
        console.log('Keep Flow < 4,000 gpm: ' + keepFlowUnder4000);
    };

    this.resetForm = function(){

        this.startDate = new Date()
        this.endDate = new Date();
        this.jetty = "";
        this.cargoName = "";
        this.roundedTotal = 0.0;
        this.normalizedTotal = 0.0;
        this.startTime = "";
        this.endTime = "";
        this.startDateTime = "";
        this.endDateTime = "";
        this.startDateTime = "";
        this.endDateTime = "";
        this.rawFlowTotals = [];
        dataSamples = [];
        limsSamples = [];
        roundedAverageTotal = 0.0;
        normalizedAverageTotal = 0.0;
        $('#calculateButton').prop('disabled', false);
    };

    this.myDate = new Date();
    this.minDate = new Date(
        this.myDate.getFullYear(),
        this.myDate.getMonth()-24,
        this.myDate.getDay(),
        this.myDate.getDate()
    );

    this.printResults = function(){
        var resultsTableElement = $("#resultsTable");
        print(resultsTableElement);
    };


    this.IWantData = function() {

        $('#calculateButton').prop('disabled', true);
        this.startDateTime = formatDateTime(this.startDate, this.startTime);
        this.endDateTime = formatDateTime(this.endDate, this.endTime);
        cargo = this.cargoName;

        // Conditional matrix for jetty and analyzer selections
        if (this.jetty !== "" && this.analyzer !== "") {
            if (this.jetty == "North"){
                if (this.analyzer == "North"){
                    this.analyzerTagSet = "AI1001A"
                } else {
                    this.analyzerTagSet = "AI1101B"
                }
            } else {
                if (this.analyzer == "North"){
                    this.analyzerTagSet = "AI1001B"
                } else {
                    this.analyzerTagSet = "AI1101A"
                }
            }
        }
        console.log(this.analyzerTagSet);
        jettyTags = getJettyTags(this.jetty, this.analyzer);
        console.log("----PI Tags ----");
        console.log(jettyTags);

        var start = new Date(this.startDateTime);
        var end = new Date(this.endDateTime);
        var startISO = start.toISOString();
        var endISO = end.toISOString();
        var oneHourBeforeStart = start;
        var oneHourAfterEnd = end;
        oneHourBeforeStart.setHours(oneHourBeforeStart.getHours() - 1);
        oneHourBeforeStart.setMinutes(oneHourBeforeStart.getMinutes() - 4);
        oneHourAfterEnd.setHours(oneHourAfterEnd.getHours() + 1);
        oneHourBeforeStart = getDate(oneHourBeforeStart);
        oneHourAfterEnd = getDate(oneHourAfterEnd);

        limsTags = getLimsJettyTags(this.jetty);
        fetchLimsData(limsTags, oneHourBeforeStart, this.endDateTime);

        getData(oneHourBeforeStart, oneHourAfterEnd).then(function(data) {
            rawData =  Object.create(data);
            //console.log("data...");
            //console.log(rawData);
    
            console.log("Preparing DataSamples...");
            setUpDataSamples(data);
            setUpRawDataSamples(data);

            // ----->
            //console.log("----rawAnalyzerSamples-----");
            //console.log(rawAnalyzerSamples);

            console.log("Preparing Flow Totals & Autocovariance...");
            calculateTotalFlow();

            // Remove old Flow Samples, keeping the Flow Total.
            cleanDataSamples();
            var copyFlowSamples = dataSamples.filter(function(sample){
                return sample.tag == "Total Flow"
            })[0].samples;
            rawFlowTotals = JSON.parse(JSON.stringify(copyFlowSamples));

            
            console.log("----rawFlowTotals-----");
            console.log(rawFlowTotals);

            // Set all Flow Totals < 4,000 gpm as outliers.
            console.log("Keep Flow  under 4,000 gpm?: " + keepFlowUnder4000);
            if (!keepFlowUnder4000) {
                removeJunk();
            }
            // Calculate the autocovariance for each flow total value.
            console.log("Calculating autocovariance...")
            var autocovSamples = calculateAutoCovariance(startISO, endISO);
            console.log(autocovSamples);
            for(var i = 0; i < dataSamples.length; i++){
                if (dataSamples[i].tag == "Total Flow") {
                    dataSamples[i].samples = autocovSamples;
                }
            };
            

        }).then(function(){

            console.log("Gathering samples from within Loading Window (start-end)...")
            dataSamples.forEach(function(set){
                var samplesInWindow = getLoadingSamples(set.samples,startISO, endISO);
                set.samples = [];
                set.samples = samplesInWindow;
            });

            // identify all outliers for flow(autocovarience).
            performGrubbsOnFlow();
            console.log("...outlier count after flow(autocovarience): " + outliers.length);

        }).then(function(){

            console.log("\n\nCalculating grubbs data from dataSamples...");
            performCalculations();  
        }).then(function(){          

            console.log("Calculating resulting averages...");
            calculateRoundedAverageTotal();

            console.log("Calculating normalized averages...")
            calculateNormalizedAverages();

            // console.log("Displaying DataSamples before Resulting...");
            //displaysResultingData();

            console.log("Preparing ResultingData...")
            prepareResultingData();            

            const resultingFlowData = [];
            var copyFlowResultingSamples = dataSamples.filter(function(sample){
                return sample.tag == "Total Flow"
            })[0].samples;

            for (var i = 0; i < rawFlowTotals.length; i++){
                const found = copyFlowResultingSamples.some(el => el.Timestamp === rawFlowTotals[i].Timestamp);
                if (!found) {
                    if (rawFlowTotals[i].Timestamp >= startISO && rawFlowTotals[i].Timestamp <= endISO) {
                        var sample = {
                            Timestamp: rawFlowTotals[i].Timestamp,
                            Value : ""
                        }
                        resultingFlowData.push(sample);
                    }
                } else {
                    resultingFlowData.push(rawFlowTotals[i]);
                }
            }
            // console.log("resulting flow data");
            // console.log(resultingFlowData);
            //this.rawFlowTotals = rawFlowTotals;
            var resultingFlowTotals = resultingFlowData;


            console.log("----OUTLIERS----");
            console.log(rememberOutliers);
            console.log("----GC OUTLIERS----");
            console.log(rememberGasComponentOutliers);
        }).then(function(){
            console.log("Building HTML Tables....");
            buildTable();

            //--- merge rawFlow total new DataSample( "", rawFlowTotals, "", "", "Flow");
            rawAnalyzerSamples.push(new DataSample( "", rawFlowTotals, "", "", "Flow", 0));
            rawAnalyzerSamples.sort(function (a, b) {
                return a.displayIndex - b.displayIndex;
            });



            this.methaneTrend = buildTrend(rawAnalyzerSamples, "C1", "methaneChart", startISO, endISO);
            this.ethaneTrend = buildTrend(rawAnalyzerSamples, "C2", "ethaneChart", startISO, endISO);

            buildRawOutlierTable(rememberOutliers, startISO, endISO, rawAnalyzerSamples, rememberGasComponentOutliers);

            console.log("Writing data to PI...");
            writeDataToPI();
            console.log(dataSamples);
            console.log("---Resulting Data---");
            console.log(resultingData);
     
        }).then(function(){
            console.log("----END----");
        });
    };

    // buildTrend(rawAnalyzerSamples, "C1");
    function buildTrend(rawSamples, gasComponent, chartName, loadingStart, loadingEnd){
        
        var gasSamples = [];
        var sampleTimestamps = [];
        var sampleValues = [];
        
        // get samples for the given gasComponent

        for(var i=0; i<rawSamples.length; i++) {
            if (rawSamples[i].mapToName == gasComponent){
                gasSamples = rawSamples[i].samples;
            }   
        }

        // separate samples into two arrays timestamps and values.
        for(var i=0; i<gasSamples.length; i++){
            var time = getDate(gasSamples[i].Timestamp);
            var startDate = new Date(loadingStart);
            var endDate = new Date(loadingEnd);
            var thisTime = new Date(time);
            if ((+thisTime >= +startDate) && (+thisTime <= +endDate)) {
                sampleTimestamps.push(getDate(gasSamples[i].Timestamp));
                sampleValues.push(gasSamples[i].Value);
            }
        }

        console.log("---Chart---");
        console.log(gasComponent);
        console.log(gasSamples);
        var ctx = document.getElementById(chartName).getContext('2d');
        var chart = new Chart(ctx, {
            type: 'line', // Chart type            
            data: {
                labels: sampleTimestamps,
                datasets: [{
                    label: gasComponent, // The label for the dataset which appears in the legend and tooltips.
                    fill: false, // Fill area under the curve.
                    borderColor: 'rgb(255, 99, 132)', // Line stroke color.
                    tension: 0, // Bézier curve tension (0 for no Bézier curves).
                    steppedLine: true, // Step function applied to the chart. Slope vs no slope.
                    cubicInterpolationMode: 'monotone',
                    data: sampleValues
                }]
            },
            options: {
                responsive: false, // Resizes the chart canvas when its container does
                responsiveAnimationDuration: 2, // Duration in milliseconds it takes to animate to new size after a resize event.
                scales: {
                    yAxes: [{
                        ticks: {
                            suggestedMin: Math.max.apply(null, sampleValues),
                            suggestedMax: Math.min.apply(null, sampleValues)
                        }
                    }]
                }
            }
        });
        
       return chart
    };

    function buildRawOutlierTable(outliersFound, loadingStart, loadingEnd, myArray, gasComponentOutliers) {
        var rawFlowTotalsTable = $('<table id="rawFlowTotalsTable" class="table"></table>');
        
        // table header
        var rawTableHeader = $('<tr class="thead-dark"></tr>');
        var rawheaderCol = '<th scope="col">Time</th>';
        rawheaderCol += '<th scope="col">Outlier</th>'; 
        for(var i=0; i<myArray.length; i++) {
            rawheaderCol += '<th scope="col">'+ myArray[i].mapToName + '</th>';   
        }
        var headerCol = $(rawheaderCol);
        headerCol.appendTo(rawTableHeader);
        rawTableHeader.appendTo(rawFlowTotalsTable);
        
        
        for(var i=0; i<myArray[0].samples.length; i++) {
            var time = getDate(myArray[0].samples[i].Timestamp);
            var startDate = new Date(loadingStart);
            var endDate = new Date(loadingEnd);
            var thisTime = new Date(time);
            if ((+thisTime >= +startDate) && (+thisTime <= +endDate)) {
                var rawTableRow = $('<tr></tr>');
                var rawTableCol = '<td>' + time + '</td>';
                if (outliersFound.indexOf(myArray[0].samples[i].Timestamp) > -1) {
                    rawTableCol += "<td>XXX</td>";
                } else {
                    rawTableCol += "<td> </td>";
                }
                for(var j=0; j<myArray.length; j++){
                    var valWith2Decimals = truncateWith2Decimals(myArray[j].samples[i].Value);
                    var foundGcOutlier = gasComponentOutliers.some( outlier =>  outlier.timestamp === myArray[j].samples[i].Timestamp && outlier.component === "CAM:LNG_Ship." + myArray[j].mapToName);
                    if (foundGcOutlier){
                        rawTableCol += "<td style='background-color:#FF0000 !important;-webkit-print-color-adjust:exact;'>" + valWith2Decimals + "</td>";
                    } else {
                        rawTableCol += "<td>" + valWith2Decimals + "</td>";
                    }
                }
                var rawCol = $(rawTableCol);
                rawCol.appendTo(rawTableRow);
                rawTableRow.appendTo(rawFlowTotalsTable);
            }
        }        
        rawFlowTotalsTable.appendTo("#rawFlowTotals");
    };

    function calculateTotalFlow(){
        // get all flow tags
        var flowSamples = dataSamples.filter(function(tag){
            return tag.sampleType == "Flow"
        });

        var sampleSize = flowSamples[0].samples.length;
        var totalFlows = new Array(sampleSize).fill(0.0);

        // Calculate the total flow for the given time stamp.
        flowSamples.forEach(function(tag){
            for (var i=0; i < sampleSize; i++) {
                totalFlows[i] += tag.samples[i].Value;
            }

        });

        // Replace the first Flow tag name and values with the total flow.
        flowSamples[0].tag = "Total Flow"
        for (var i=0; i < sampleSize; i++) {
            flowSamples[0].samples[i].Value = totalFlows[i];
        }

    };

    function calculateAutoCovariance(start, end){
        var flowSamples = dataSamples.filter(function(sample){
            return sample.tag == "Total Flow"
        })[0].samples;

        var autocovSamples = [];
        for(var i = 0; i < flowSamples.length; i++){
            if (flowSamples[i].Timestamp >= start){
                //if((i+1) < flowSamples.length) {
                    var currentTime = flowSamples[i].Timestamp;
                    var prevTime = flowSamples[i-1].Timestamp;
                    var currentRange = getOneHourRange(flowSamples, currentTime);
                    var prevRange = getOneHourRange(flowSamples, prevTime);
                    var autocovariance = GrubbsCalculator.calculateAutoCovariance(currentRange, prevRange);
                    var sample = {
                        Timestamp : currentTime,
                        Value : autocovariance
                    };
                    autocovSamples.push(sample);
               // }
            }
        }; 

        // Merge the calculated autcovariance values with the flowSamples
        flowSamples.forEach(function(sample){
            autocovSamples.forEach(function(autocovSample){
                if (sample.Timestamp == autocovSample.Timestamp){
                    sample.Value = autocovSample.Value;
                }
            });
        });
        return flowSamples
    };

    function getOneHourRange(samples, currentTime) {
        var oneHourBefore = new Date(currentTime);
        oneHourBefore.setHours(oneHourBefore.getHours() - 1);
        oneHourBefore = oneHourBefore.toISOString();
        var oneHourRange = samples.filter(function(sample){
            return (sample.Timestamp >= oneHourBefore && sample.Timestamp <= currentTime)
        });
        return oneHourRange
    };

    function cleanDataSamples(){
        dataSamples = dataSamples.filter(function(set){
            return set.tag == "Total Flow" || set.sampleType == "Analyzer"
        });
    };

    function getLoadingSamples(samples, start, end) {

        var startDate = new Date(start);
        var endDate = new Date(end);
        var loadingSamples = samples.filter(function(sample){
            var currentDate = new Date(sample.Timestamp);
            return (+currentDate >= +startDate) && (+currentDate <= +endDate);
        });
        return loadingSamples;
    };

    function getSum(total, num) {
        return total + num.Value;
    };

    function setUpDataSamples(data){
        for(var i = 0; i < data.length; i++){
            var sample = new DataSample( jettyTags[i].Name, data[i].Items, jettyTags[i].MapToWebID, jettyTags[i].TagType, jettyTags[i].MapTo, jettyTags[i].Index);
            dataSamples.push(sample);

        }
    };

    function setUpRawDataSamples(data){
        for(var i = 0; i < data.length; i++){

            var name = jettyTags[i].MapTo;
            var gcName = name.substring(name.indexOf(".") + 1);
            var sample = new DataSample( jettyTags[i].Name, data[i].Items, jettyTags[i].MapToWebID, jettyTags[i].TagType, gcName, jettyTags[i].Index);
            rawAnalyzerSamples.push(sample);
        }
        rawAnalyzerSamples = rawAnalyzerSamples.filter(function(sample){
            return sample.sampleType == "Analyzer"
        });
    };

    function getJettyTags(jetty, analyzer){
        return SampledData.piTags.filter(function(tag) {
            return ((tag.Jetty == jetty && tag.Analyzer == analyzer) || tag.TagType == "Flow");
        });
    };

    function removeJunk(){
        console.log("Removing Junk!");
        var iterations = 0;
        var outliers = [];
     do {
            outliers = [];
                // perform grubbs calculations on the dataSamples
                dataSamples.forEach(function(set){

                    set.samples.forEach(function(sample){
                        var name = set.mapToName;
                        
                        var gcName = name.substring(name.indexOf(".") + 1);
                        //console.log("MapTo NAME: " + gcName);
                        if (set.sampleType == "Flow"  && sample.value < 4000) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "N2" && sample.value > 0.03) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "C1" && sample.value < 0.7) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "C2" && sample.value > 0.15) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "C3" && sample.value > 0.05) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "iC4" && sample.value > 0.03) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "nC4" && sample.value > 0.03) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "iC5" && sample.value > 0.01) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "nC5" && sample.value > 0.01) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "C6+" && sample.value > 0.01) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        } else if (gcName == "CO2" && sample.value < 0.0002) {
                            console.log("outlier! MapTo NAME: " + gcName);
                            outliers = outliers.concat(copyFlowSamples[i].Timestamp);
                            rememberOutliers = rememberOutliers.concat(copyFlowSamples[i].Timestamp);
                        }
                    });
                
                });
                if (outliers.length > 0) {
                    dataSamples.forEach(function(set){
                        set.samples = GrubbsCalculator.removeOutliers(set.samples, outliers);
                    });
                }
                console.log("doLoop: " + iterations++);
                console.log("outliers length: " + outliers.length);
                console.log("rememberoutliers length: " + rememberOutliers.length);
                console.log(rememberOutliers);
        } while (outliers.length > 0);
    };

    function performGrubbsOnFlow(){
        var iterations = 0;
        var outliers = [];
     do {
         outliers = [];
             // perform grubbs calculations on the dataSamples
             dataSamples.forEach(function(set){
                if (set.sampleType == "Flow") {
                    set.size = GrubbsCalculator.calculateSize(set.samples);
                    set.average = GrubbsCalculator.calculateAverage(set.samples);
                    set.roundedAverage = set.average.toFixed(2);
                    set.standardDeviation = GrubbsCalculator.calculateStandardDeviation_Sample(set.samples, set.average);
                    var significanceLevel =  0.15;
                    
                    set.t_TestSignificance = GrubbsCalculator.calculateT_TestSignificance(set.samples, significanceLevel);
                    
                    // Find the closest value equal to the 1 - tTestSignificance
                    var counts = T_InverseTable.probabilities;
                    var goal = 1 - set.t_TestSignificance;
                    var closestProbability = counts.reduce(function(prev, curr) {
                        return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
                    });
                    console.log("actualy prob: " + goal + " closest prob: " + closestProbability + " grubbsVal: " + set.grubbsTestValue + " size: " +set.size + " t_sig: " + set.t_TestSignificance);
                    set.grubbsTestValue = GrubbsCalculator.calculateGrubbsValue(set.size,closestProbability);
                    var setOutliers = new Array();
                    setOutliers = GrubbsCalculator.identifyOutliers(set.samples, set.grubbsTestValue, set.average, set.standardDeviation);
                    if (setOutliers.length > 0) {
                        outliers = outliers.concat(setOutliers);
                        rememberOutliers = rememberOutliers.concat(setOutliers);
                        //console.log("setoutliers returned: " + setOutliers.length);
                    }
                }
             });
             if (outliers.length > 0) {
                 dataSamples.forEach(function(set){
                     set.samples = GrubbsCalculator.removeOutliers(set.samples, outliers);
                 });
             }
             console.log("doLoop: " + iterations++);
             console.log("outliers length: " + outliers.length);
             console.log("rememberoutliers length: " + rememberOutliers.length);
             console.log(rememberOutliers);
         } while (outliers.length > 0);
     };

    function performCalculations(){
       var iterations = 0;
       var outliers = [];
       var gcOutliers = [];
    do {
        outliers = [];
        gcOutliers = [];
            // perform grubbs calculations on the dataSamples
            dataSamples.forEach(function(set){
    
                set.size = GrubbsCalculator.calculateSize(set.samples);
                set.average = GrubbsCalculator.calculateAverage(set.samples);
                set.roundedAverage = set.average.toFixed(2);
                set.standardDeviation = GrubbsCalculator.calculateStandardDeviation_Sample(set.samples, set.average);  
                

                var significanceLevel = (set.sampleType == "Flow") ? 0.15 : 0.05;
                set.t_TestSignificance = GrubbsCalculator.calculateT_TestSignificance(set.samples, significanceLevel);
                
                // Find the closest value equal to the 1 - tTestSignificance
                var counts = T_InverseTable.probabilities;
                var goal = 1 - set.t_TestSignificance;
                var closestProbability = counts.reduce(function(prev, curr) {
                    return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
                });
                set.grubbsTestValue = GrubbsCalculator.calculateGrubbsValue(set.size,closestProbability);
                console.log("actualy prob: " + goal + " closest prob: " + closestProbability + " grubbsVal: " + set.grubbsTestValue + " size: " +set.size + " t_sig: " + set.t_TestSignificance);
                var setOutliers = new Array();
                var gasComponentOutliers = new Array();
                setOutliers = GrubbsCalculator.identifyOutliers(set.samples, set.grubbsTestValue, set.average, set.standardDeviation);
                gasComponentOutliers = GrubbsCalculator.identifyComponentOutliers(set.samples, set.grubbsTestValue, set.average, set.standardDeviation, set.mapToName);
                if (setOutliers.length > 0) {
                    outliers = outliers.concat(setOutliers);
                    rememberOutliers = rememberOutliers.concat(setOutliers);
                    //console.log("setoutliers returned: " + setOutliers.length);
                }
                if (gasComponentOutliers.length > 0) {
                    gcOutliers = outliers.concat(gasComponentOutliers);
                    rememberGasComponentOutliers = rememberGasComponentOutliers.concat(gasComponentOutliers);
                }
            });
            if (outliers.length > 0) {
                dataSamples.forEach(function(set){
                    set.samples = GrubbsCalculator.removeOutliers(set.samples, outliers);
                });
            }
        } while (outliers.length > 0);
    };

    function calculateRoundedAverageTotal(){
        dataSamples.forEach(function(set){
            if (analyzerTags.indexOf(set.tag) >= 0) {
                roundedAverageTotal += Number(set.roundedAverage);
            }
        });
    };

    function calculateNormalizedAverages(){
        dataSamples.forEach(function(set){
            if (analyzerTags.indexOf(set.tag) >= 0 && set.mapTo.slice(-2) != 'C1') {
                var normalizedAverage = set.roundedAverage / roundedAverageTotal * 100;
                set.normalizedAverage = normalizedAverage.toFixed(2);
                normalizedAverageTotal += Number(set.normalizedAverage);
            }
        });
        dataSamples.forEach(function(set){
            if (analyzerTags.indexOf(set.tag) >= 0 && set.mapTo.slice(-2) == 'C1') {
                set.normalizedAverage = 100 - normalizedAverageTotal;
                normalizedAverageTotal += Number(set.normalizedAverage.toFixed(2));
            }
        });
    };

    function getLimsJettyTags(jetty){
        return SampledData.limsTags.filter(function(tag) {
            return tag.Jetty == jetty;
          });
    };

    function fetchLimsData(tags, startDateTime, endDateTime){

        getLimsData(tags, startDateTime, endDateTime).then(function(data) {
            console.log("LIMS Data.....");
            console.log(data);
            for(var i = 0; i < data.length; i++){
                if (data[i].Items.length > 0){
                    let mostRecentSample = data[i].Items.sort(function(a,b) { 
                        return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime() 
                    })[0];
                    if (mostRecentSample.Value != null) {
                        var tagSample = {
                            name : tags[i].Name,
                            rounded : mostRecentSample.Value,
                            normalized :  mostRecentSample.Value,
                            mapTo : tags[i].MapToWebID
                        };
                        limsSamples.push(tagSample);
                    }
                }


            }
        });
    };

    function prepareResultingData(){
        dataSamples.sort(function (a, b) {
            return a.displayIndex - b.displayIndex;
        });

        dataSamples.forEach(function(set){
            if (analyzerTags.indexOf(set.tag) >= 0) {
                var roundedAverage = Math.round(set.roundedAverage * 100) / 100;
                var normalizedAverage = Math.round(set.normalizedAverage * 100) / 100;
                var tagSample = {
                    name : set.mapToName,
                    rounded : roundedAverage.toFixed(6),
                    normalized : normalizedAverage.toFixed(6),
                    mapTo : set.mapTo
                };
                resultingData.tagSamples.push(tagSample);
                
            }
        });
        roundedAverageTotal = Math.round(roundedAverageTotal * 100) / 100;
        normalizedAverageTotal = Math.round(normalizedAverageTotal * 100) / 100;
        resultingData.roundedAverageTotal = roundedAverageTotal.toFixed(6);
        resultingData.normalizedAverageTotal = normalizedAverageTotal.toFixed(6);
        resultingData.cargoNo = cargo;
        resultingData.limsSamples = limsSamples;

    };

    function displaysResultingData(){
        dataSamples.forEach(function(set){
            console.log("\n\n-------Results-----");
            console.log("tagName: " + set.tag);
            console.log("samples length: " + set.samples.length);
            console.log("average: " + set.average);
            console.log("rounded average: " + set.roundedAverage);
            console.log("normalized average: " + set.normalizedAverage);
            console.log("standard dev: " + set.standardDeviation);
            console.log("t_Test: " + set.t_TestSignificance);
            console.log("Grubb's: " + set.grubbsTestValue);
        });
        console.log("\ntesting outliers...");
        console.log("outliers length: " + outliers.length);
        console.log("total rounded Average: " + roundedAverageTotal);
        console.log("total normalized Average: " + normalizedAverageTotal);
    };



    function buildTable(){
        mytable = $('<table id="resultsTable" class="table table"></table>');
        
        $('<tr class="thead-dark"><th scope="col"></th><th scope="col"></th><th scope="col">'+ dataSamples[0].samples.length +' remaining samples</th></tr>').appendTo(mytable);
        $('<tr class="thead-dark"><th scope="col">Tag</th><th scope="col">Rounded</th><th scope="col">Normalized</th></tr>').appendTo(mytable);
        for (var i = 0; i < resultingData.tagSamples.length; i++) {
            var name = resultingData.tagSamples[i].name;
            var gcName = name.substring(name.indexOf(".") + 1);
            var roundedValWith2Decimals = truncateWith2Decimals(resultingData.tagSamples[i].rounded);
            var normalizedValWith2Decimals = truncateWith2Decimals(resultingData.tagSamples[i].normalized);
            $('<tr scope="row"><td scope="col" col width="230">' + gcName + '</td><td scope="col">' + roundedValWith2Decimals + '</td><td scope="col">' + normalizedValWith2Decimals + '</td></tr>').appendTo(mytable);        
        }
        var roundedValWith2Decimals = truncateWith2Decimals(resultingData.roundedAverageTotal);
        var normalizedValWith2Decimals = truncateWith2Decimals(resultingData.normalizedAverageTotal);
        $('<tr scope="row"><td scope="col">Total</td><td scope="col">' + roundedValWith2Decimals + '</td><td scope="col">' + normalizedValWith2Decimals + '</td></tr>').appendTo(mytable);
        mytable.appendTo("#box");


    };

    function truncateWith2Decimals(val) {
        if (val <= 0 || !val) {
            return "0.00"
        } else {
            var with2Decimals = val.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
            return with2Decimals
        }
    };

    function writeDataToPI() { 
        var now = new Date();
        var nowStr = formatDate(now);
        var sampleTimestamp = SampledData.piTags.find(obj => {
            return obj.Name === "CAM:LNG_Ship.Sample_Timestamp"
        });
        postData(sampleTimestamp.WebID, nowStr, nowStr);

        resultingData.tagSamples.forEach(function(sample){
            postData(sample.mapTo,sample.normalized, nowStr);
        });
        resultingData.limsSamples.forEach(function(sample){
            postData(sample.mapTo,sample.rounded, nowStr);
        });

        var cargoNumber = SampledData.piTags.find(obj => {
            return obj.Name === "CAM:LNG_Ship.Cargo_No"
        });
        postData(cargoNumber.MapToWebID, resultingData.cargoNo, nowStr);
    };

    function formatDate(date) {
        now = new Date();
        year = "" + now.getFullYear();
        month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
        day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
        hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
        minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
        second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
        return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    };

    function formatDateTime(date, time){
        var thisTime = new Date(time);
        var dateTime = new Date((date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear() + " " + thisTime.getHours() + ":" + thisTime.getMinutes());
        var dateString = getDate(dateTime);
        return dateString;
    };

    function getDate(dateTime) {
       var date = new Date(dateTime);
        year = date.getFullYear();
        month = (date.getMonth() + 1).toString();
        formatedMonth = (month.length === 1) ? ("0" + month) : month;
        day = date.getDate().toString();
        formatedDay = (day.length === 1) ? ("0" + day) : day;
        hour = date.getHours().toString();
        formatedHour = (hour.length === 1) ? ("0" + hour) : hour;
        minute = date.getMinutes().toString();
        formatedMinute = (minute.length === 1) ? ("0" + minute) : minute;
        second = date.getSeconds().toString();
        formatedSecond = (second.length === 1) ? ("0" + second) : second;
        var ampm = hour >= 12 ? 'pm' : 'am';
        hour = hour % 12;
        hour = hour ? hour : 12; // the hour '0' should be '12'
        minute = minute < 10 ? '0'+ minute : minute;
        var strTime = hour + ':' + minute + ' ' + ampm;
        return  formatedMonth + "/" + formatedDay + "/" + year + " " + strTime;
    };

});