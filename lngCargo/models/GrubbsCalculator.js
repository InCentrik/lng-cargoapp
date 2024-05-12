var GrubbsCalculator = {

    calculateSize : function(data){
        return data.length;
    },

    calculateAverage : function(data){
      var sum = data.reduce(function (acc, obj) { return acc + obj.Value; }, 0);
      return sum / data.length;
    },

    calculateAverage_Normalized : function(average) {
      avg_scnt = average.toExponential();
      return avg_scnt;
    },
    calculateAverage_Rounded : function(average) {
      avg_rounded = average.toFixed(4);
      return avg_rounded;
    },

    calculateStandardDeviation : function(samples, average){
      var squareDiffs = samples.map(function(sample){
        var diff = sample.Value - average;
        var sqrDiff = diff * diff;
        return sqrDiff;
      });

      var sum = squareDiffs.reduce(function(sum, value){
        return sum + value;
      }, 0);
      var avgSquareDiff = (sum / samples.length);
      var stdDev = Math.sqrt(avgSquareDiff);
      return stdDev;
    },

    calculateStandardDeviation_Sample : function(samples, average){
      var squareDiffs = samples.map(function(sample){
        var diff = sample.Value - average;
        var sqrDiff = diff * diff;
        return sqrDiff;
      });
      
      var sum = squareDiffs.reduce(function(sum, value){
        return sum + value;
      }, 0);
      var avgSquareDiff = (sum / (samples.length-1));
      var stdDev = Math.sqrt(avgSquareDiff);
      return stdDev;
    },

    calculateT_TestSignificance : function(values, significanceLevel){
      return significanceLevel / (2 * values.length);
    },

    calculateGrubbsValue : function(size, probabilty){
      var tInvVal = jStat.studentt.inv(probabilty,size - 2);
      return (size - 1) * (tInvVal / Math.sqrt(size * (size - 2 + (tInvVal * tInvVal))));
    },


    calculateAutoCovariance : function(range1, range2) {
      var size = range1.length;
      var sumProduct = 0.0;


      var range1Average = range1.reduce(function (acc, obj) { return acc + obj.Value; }, 0);
      range1Average = range1Average / range1.length;
      var range2Average = range2.reduce(function (acc, obj) { return acc + obj.Value; }, 0);
      range2Average = range2Average / range2.length;

      for(var i = 0; i < size; i++){
        
        if (typeof range2[i] !== 'undefined'){
	    var product = (range1[i].Value - range1Average) * (range2[i].Value - range2Average);
        }
	sumProduct += product;
      }
      return sumProduct / (size - 1)
    },

    identifyJunk  : function(samples){
          var name = samples[0].mapTo;
          var gcName = name.substring(name.indexOf(".") + 1);
    },

    identifyOutliers : function(samples, grubbsValue, average, standardDeviation) {
      console.log("Identifying outliers");
      var theseOutliers = [];
      var count = 0;
      samples.forEach(function(sample){
        var minThreshold = (average - (grubbsValue * standardDeviation));
        var maxThreshold = (average + (grubbsValue * standardDeviation));
        
        
        count++;
        // Testing Variable. To be removed.
        var xxx = {
          time : sample.Timestamp,
          value : sample.Value,
          average : average,
          grubbsValue : grubbsValue,
          standardDev : standardDeviation,
          min : minThreshold,
          max : maxThreshold,
          isOutlier : false,
          sampleSize : samples.length
        }
        
        if (sample.Value > maxThreshold || sample.Value < minThreshold){
          if(theseOutliers.indexOf(sample.Timestamp) === -1) {
           // console.log("outlier!");
            xxx.isOutlier = true;
            theseOutliers.push(sample.Timestamp);
            console.log(xxx);
          }
        } else {
          //console.log(xxx);
        }
        
      });
      return theseOutliers;
    },

    // identifies outliers similar to the original function but, groups the
    // gas component along with the associated timestamp.
    identifyComponentOutliers : function(samples, grubbsValue, average, standardDeviation, gasComponentName) {
      console.log("Identifying outliers");
      var theseOutliers = [];
      samples.forEach(function(sample){
        var minThreshold = (average - (grubbsValue * standardDeviation));
        var maxThreshold = (average + (grubbsValue * standardDeviation));
        if (sample.Value > maxThreshold || sample.Value < minThreshold){
            theseOutliers.push({"timestamp": sample.Timestamp, "component": gasComponentName});
        }
      });
      return theseOutliers;
    },

    removeOutliers : function(dataItems, outliers) {
      //console.log("removing " + outliers.length + " outliers.");
      var items = [];
      dataItems.forEach(function(item){
          if (outliers.indexOf(item.Timestamp) == -1) {
            items.push(item);
          }
      });
      return items;

    }

}