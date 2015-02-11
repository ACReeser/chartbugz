(function () {
    var chartbugz = window.chartbugz || {}, AUTO_INTERVAL_TIMEOUT = 60000, autoIntervalID;

    if (localStorage == null) {
        $("#pie").html("Your browser does not support local storage");
    }

    chartbugz.initialize = function () {
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
		$(".refresh-list input[type=checkbox]")[0].checked = chartbugz.autoRefresh;
		$(".refresh-list input[type=checkbox]").change(function() {
			chartbugz.setAutoRefresh($(this)[0].checked, true);
		});
		$(".refresh-list button").click(function() {
			chartbugz.loadData();
		});
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

    chartbugz.loadData = function () {
        var data = [], subUrl = chartbugz.filterMap[chartbugz.currentFilterNickname];
        $.getFeed({
            url: (subUrl == "default.rss") ? "http://localhost:80/default.rss" : "http://localhost:80/proxy/"+subUrl,
            success: function (feed) {
				var i, splitEstimate, estimateString;
                if (!feed) {
                    return;
				}

                for (i = 0; i < feed.items.length; i++) {
                    splitEstimate = /.*Estimate(.*)/.exec(feed.items[i].description);
                    estimateString = "0";
                    if (splitEstimate && splitEstimate.length > 0) {
                        estimateString = splitEstimate[1].replace(/[: \na-zA-Z]/g, '');
					}

                    data.push({
                        name: feed.items[i].title,
                        value: Number(estimateString)
                    });
                }

                d3plus.viz()
                  .container("#pie")
                  .data(data)
                  .type("pie")
                  .id("name")
                  .size("value")
                  .draw();
            }
        });
    };

    chartbugz.initialize();
})();