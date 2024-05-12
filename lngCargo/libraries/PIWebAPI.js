var apiRoot = "https://lngcargo.cameronlng.com/piwebapi";


// Creates a deferred jQuery object to get PI Web API JSON data. Usually accessed by one of the get* functions
var errorStatusText;
var jqXHRstatus;
var webReqErrorGlobalBool = false;
function webRequest(url) {
    var promise = $.Deferred();
	var webReqErrorLocalBool = false;

	$.ajax({
		url: url,
		type: "GET",
		contentType: "application/json; charset=utf-8",
		crossDomain: true,
		xhrFields: {
			withCredentials: true
		},
		success: function(result) {
			promise.resolve(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			jqXHRstatus = jqXHR.status;
			errorStatusText = textStatus;
			webReqErrorGlobalBool = true;
			webReqErrorLocalBool = true;
			if (jqXHR.status == undefined || jqXHR.status == 0) {
				//return; //Skip this error
				$('#treeViewLoaderPadding').hide();
				alert("Network Error - Please check your connection to the business network, then refresh the page.")
			} else if (jqXHR.status == 400) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Bad Request");
			} else if (jqXHR.status == 401 || jqXHR.status == 403) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Authorization Error");
			} else if (jqXHR.status == 404) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Resource Not Found");
			} else if (jqXHR.status > 404 && jqXHR.status < 500) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Client Error");
			} else if (jqXHR.status >= 500 && jqXHR.status < 600) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Server Error");
			}
			promise.reject(jqXHR);
		}
	});
    return promise;
}
function webPostRequest(url, body) {
    var promise = $.Deferred();
	var webReqErrorLocalBool = false;
	$.ajax({
		url: url,
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify(body),
		crossDomain: true,
		xhrFields: {
			withCredentials: true
		},
		success: function(result) {
			promise.resolve(result);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			jqXHRstatus = jqXHR.status;
			errorStatusText = textStatus;
			webReqErrorGlobalBool = true;
			webReqErrorLocalBool = true;
			if (jqXHR.status == undefined || jqXHR.status == 0) {
				//return; //Skip this error
				$('#treeViewLoaderPadding').hide();
				alert("Network Error - Please check your connection to the business network, then refresh the page.")
			} else if (jqXHR.status == 400) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Bad Request");
			} else if (jqXHR.status == 401 || jqXHR.status == 403) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Authorization Error");
			} else if (jqXHR.status == 404) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Resource Not Found");
			} else if (jqXHR.status > 404 && jqXHR.status < 500) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Client Error");
			} else if (jqXHR.status >= 500 && jqXHR.status < 600) {
				$('#treeViewLoaderPadding').hide();
				alert("HTTP " + jqXHR.status + ": Server Error");
			}
			promise.reject(jqXHR);
		}
	});
    return promise;
}

// // Works similarly to webRequest, but uses JSON string as input and can return multiple API calls at once
// function batchRequest(queryData) {
//     var promise = $.Deferred();
//     $.ajax({
//         type: "POST",
//         url: apiRoot + "/batch/",
// 		data: queryData,
// 		contentType: "application/json; charset=utf-8",
// 		//dataType: 'jsonp',
// 		crossDomain: true,
//         xhrFields: {
//             withCredentials: true
//         },
//         success: function(result) {
//             promise.resolve(result);
//         },
//         error: function(error) {
//             promise.reject(error);
//         }
//     });
//     return promise;
// }


// Returns immediate children of element, specified by element web ID
function getElements(id) {
	var reqTS = "?requestTimestamp=" + (new Date().getTime());
	//If element is a database, need to make a slightly different call to get child elements
	if (id[0]=="D") {
		return webRequest(apiRoot + "/assetdatabases/" + id + "/elements" + reqTS);	
	} else {
		return webRequest(apiRoot + "/elements/" + id + "/elements" + reqTS);
	}
}

// Returns attributes of an element, specified by element web ID
function getAttributes(id) {
	var reqTS = "?requestTimestamp=" + (new Date().getTime());
    return webRequest(apiRoot + "/elements/" + id + "/attributes" + reqTS);
}

// Returns attribute's current value, specified by attribute web ID
function getAttribValue(id) {
	var reqTS = "?requestTimestamp=" + (new Date().getTime());
    return webRequest(apiRoot + "/streamsets/" + id + "/end" + reqTS);
}

// Returns recorded values of the attributes of an element or an attribute, specified by either element or attribute web ID and a start time and end time
function getRecordedData(id, startTime, endTime) {
	var reqTS = "&requestTimestamp=" + (new Date().getTime());
    return webRequest(apiRoot + "/streams/" + id + "/recorded?starttime=" + startTime + "&endtime=" + endTime + "&selectedfields=items.timestamp;items.value" + reqTS);
}

// Returns values of the attributes of an element or an attribute, specified by either element or attribute web ID, a start time, an end time, and "intervals" which typically represents the number of pixels in the width of the graph
// Similar to getRecorded, but typically returns a fewer number of data points
function getPlotData(id, startTime, endTime, intervals) {
	var reqTS = "&requestTimestamp=" + (new Date().getTime());
    return webRequest(apiRoot + "/streams/" + id + "/plot?starttime=" + startTime + "&endtime=" + endTime + "&intervals=" + interval.toString() + "&selectedfields=items.timestamp;items.value" + reqTS);
}

//https://azr01pi01.lng.pvt/piwebapi/streams/P04fzRUyKOPUK7lpmO6iv2GgrSMAAAQVpSMDFQSTAxXDA4Nzk3MTAyLThGMTctMTFFNi04MEUxLTAwMEQzQTcwMjJFOF9BQ1RJT04/interpolated

function getInterpolatedData(id, startTime, endTime, interval) {
	var reqTS = "&requestTimestamp=" + (new Date().getTime());
    return webRequest(apiRoot + "/streams/" + id + "/interpolated?starttime=" + startTime + "&endtime=" + endTime + "&interval=" + interval.toString() + "&selectedfields=items.timestamp;items.value" + reqTS);
}


// Returns immediate children of an attribute, specified by attribute web ID
function getChildAttributes(id) {
	var reqTS = "?requestTimestamp=" + (new Date().getTime());
    return webRequest(apiRoot + "/attributes/" + id + "/attributes" + reqTS);
} 

// Returns an element's attributes and child attributes of those attributes, along with the most recent values (works like getAttribValue but includes child attributes).
function getFullAttributes(id) {
    var reqTS = "&requestTimestamp=" + (new Date().getTime());
    return webRequest(apiRoot + "/streamsets/" + id + "/end?searchFullHierarchy=true" + reqTS);
}

function postData(id, value, timestamp) {
	data = {
		"Value" : value,
		"Timestamp": timestamp
	}
	//	return webPostRequest(apiRoot + "/streams/P04fzRUyKOPUK7lpmO6iv2Gg6rsAAAQVpSMDFQSTAxXENBTTpMTkdfU0hJUC5DMQ/value", value);
	// https://azr01pi01.lng.pvt/piwebapi/points?path=\\AZR01PI01\CAM_DCS:AI1001A_CO2
	
	//return webPostRequest(apiRoot + "/streams/" + id + "/value?updateoption=insert", data);
	return webPostRequest(apiRoot + "/streams/" + id + "/value?updateOption=Insert&bufferOption=BufferIfPossible", data);

	}
