(function () {
    var chartbugz = window.chartbugz || {}, AUTO_INTERVAL_TIMEOUT = 120000, autoIntervalID;

    if (localStorage == null) {
        $("#pie").html("Your browser does not support local storage");
    }

    chartbugz.initialize = function () {
		//can be either "chart" or "calendar"
		chartbugz.tab = "chart";
        chartbugz.filterMap = JSON.parse(localStorage.getItem("chartbugz.filterMap")) || { "default": "default.rss" };
        chartbugz.defaultFilterNickname = localStorage.getItem("chartbugz.defaultFilterNickname") || "default";
		chartbugz.setAutoRefresh( localStorage.getItem("chartbugz.autoRefresh") || true, false );
        chartbugz.currentFilterNickname = chartbugz.defaultFilterNickname;
        chartbugz.wireEvents();
        chartbugz.refreshFilterList();
        chartbugz.loadData();
    };

    chartbugz.wireEvents = function () {
        $("#newFilterBtn").click(function () {
            var newRSS = $("#newFilterRSS").val();
            newRSS = newRSS.replace(/.*default.asp/, "default.asp");
            chartbugz.filterMap[$("#newFilterNickname").val()] = newRSS;
            $("#newFilterRSS, #newFilterNickname").val("");
            chartbugz.refreshFilterList();
            chartbugz.saveFilterList();
        });
		$(".refresh-row input[type=checkbox]")[0].checked = chartbugz.autoRefresh;
		$(".refresh-row input[type=checkbox]").change(function() {
			chartbugz.setAutoRefresh($(this)[0].checked, true);
		});
		$(".refresh-row button").click(function() {
			chartbugz.loadData();
		});
		$(".tab-row .chart-btn").click(function() {
			chartbugz.setTabVisible('chart', 'calendar');
		});
		$(".tab-row .calendar-btn").click(function() {
			chartbugz.setTabVisible('calendar', 'chart');
		});
    };
	
	//TODO: persist this
	chartbugz.setTabVisible = function(visible, invisible) {
	  $(".tab-row ."+visible+"-btn").prop("disabled", "disabled");
	  $(".tab-row ."+invisible+"-btn").prop("disabled", null);
	  $("#"+invisible).hide();
	  $("#"+visible).show();
	  chartbugz.tab = visible;
	  chartbugz.loadData();
	};
	
	chartbugz.setAutoRefresh = function(doAutoRefresh, doSave) {
		chartbugz.autoRefresh = doAutoRefresh;
		if (doSave) {
			localStorage.setItem("chartbugz.autoRefresh", chartbugz.autoRefresh);
		}
		if (doAutoRefresh && autoIntervalID == null) {
			autoIntervalID = setInterval(chartbugz.loadData, AUTO_INTERVAL_TIMEOUT);
		} else if (!doAutoRefresh && autoIntervalID != null) {
			clearInterval(autoIntervalID);
		}
	};
	
    chartbugz.saveFilterList = function () {
        localStorage.setItem("chartbugz.filterMap", JSON.stringify(chartbugz.filterMap));
        localStorage.setItem("chartbugz.defaultFilterNickname", chartbugz.currentFilterNickname);
    };
	
	//this allows us to stash the nickname in a closure
	//so we don't have to stick it in the DOM or something
	function curriedDelete(nickname){
		return function() {
			chartbugz.filterMap[nickname] = undefined;
			chartbugz.saveFilterList();
			$(this).parent().empty();
		};
	}
    chartbugz.refreshFilterList = function () {
		var nickname, newLink, delLink, newDiv;
        $(".current-list").empty();
        for (nickname in chartbugz.filterMap) {
            newLink = document.createElement("a");
            newLink.href = "javascript:void(0);";
            newLink.text = nickname;
            $(newLink).click(function () {
                chartbugz.currentFilterNickname = this.text;
                chartbugz.loadData();
            });
            delLink = document.createElement("a");
            delLink.href = "javascript:void(0);";
            delLink.text = "[x]";
			$(delLink).css({"margin-left": 15});
            $(delLink).click(curriedDelete(nickname));
            newDiv = document.createElement("div");
            $(newDiv).append(newLink);
			$(newDiv).append(delLink);
            $(".current-list").append(newDiv);
        }
        
    };
	
	chartbugz.loadChartItem = function(item){
		var splitEstimate, estimateString;
		
		splitEstimate = /.*Estimate(.*)/.exec(item.description);
		estimateString = "0";
		if (splitEstimate && splitEstimate.length > 0) {
			estimateString = splitEstimate[1].replace(/[: \na-zA-Z]/g, '');
		}
		
		return {
			name: item.title,
			value: Number(estimateString)
		}
	};
	
	chartbugz.loadCalendarItem = function(item){
		var openedString, splitString = /.*opened (.*PM)/.exec(item.description);
		
		if (splitString && splitString.length > 0) {
			openedString = splitString[1];
		}
		
		return {
			title: item.title,
			start: moment(openedString, "M/DD/YYYY h:mm a").format(),
			end: moment(item.updated).format(), //, "ddd, MM MMM YYYY hh:mm:ss z" this isn't working, no idea why
			backgroundColor: /.*<br \/>Active.*/.test(item.description) ? "#3a87ad" : "#127F47"
		}
	};

    chartbugz.loadData = function () {
        var data = [], subUrl = chartbugz.filterMap[chartbugz.currentFilterNickname];
        $.getFeed({
            url: (subUrl == "default.rss") ? "http://localhost:80/default.rss" : "http://localhost:80/proxy/"+subUrl,
            success: function (feed) {
				var i;
                if (!feed) {
                    return; //no need to render anything if we have no data :(
				}

                for (i = 0; i < feed.items.length; i++) {
					if (chartbugz.tab === 'chart')
						data.push(chartbugz.loadChartItem(feed.items[i]));
					else
						data.push(chartbugz.loadCalendarItem(feed.items[i]));
                }
				
				if (chartbugz.tab === 'chart'){
					d3plus.viz()
					  .container("#chart")
					  .data(data)
					  .type("pie")
					  .id("name")
					  .size("value")
					  .draw();
				} else {
					//this doesn't throw an error if there's nothing to destroy
				    $('#calendar').fullCalendar('destroy');
					$('#calendar').fullCalendar({
						header: {
							left: 'prev,next today',
							center: 'title',
							right: 'month,agendaWeek,agendaDay'
		
						},
						defaultDate: '2015-02-12',
						businessHours: true, // display business hours
						editable: true,
						events: data
					});
				}
            }
        });
    };

    chartbugz.initialize();
})();