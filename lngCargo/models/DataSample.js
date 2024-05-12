
/**
 * NAME: DataSample
 * CREATED: 12/29/2018
 * UPDATED: 12/29/2018
 * DESCRIPTION: Object which represents the current set of Archived PI Data and its associated metrics.
 */

function DataSample(tag, samples, mapTo, sampleType, mapToName, index) {
    this.tag = tag;
    this.size = 0.0;
    this.average = 0.0;
    this.roundedAverage = 0.0;
    this.normalizedAverage = 0.0;
    this.standardDeviation = 0.0;
    this.significanceLevel = 0.05;
    this.t_TestSignificance = 0.0;
    this.grubbsTestValue = 0.0;
    this.samples = samples;
    this.mapTo = mapTo;
    this.sampleType = sampleType;  
    this.mapToName = mapToName;
    this.displayIndex = index;  

};

function ResultingData(){
    this.tagSamples = new Array();
    this.roundedAverageTotal = 0.000000;
    this.normalizedAverageTotal = 0.000000;
    this.cargoNo = "";
    this.limsSamples = new Array();
    
};


