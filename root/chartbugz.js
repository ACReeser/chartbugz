(function () {
    var chartbugz = window.chartbugz || {};

    if (localStorage == null) {
        $("#pie").html("Your browser does not support local storage");
    }

    chartbugz.initialize = function () {
        chartbugz.filterMap = JSON.parse(localStorage.getItem("chartbugz.filterMap")) || { "default": "default.rss" };
        chartbugz.defaultFilterNickname = localStorage.getItem("chartbugz.defaultFilterNickname") || "default";
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
    };

    chartbugz.saveFilterList = function () {
        localStorage.setItem("chartbugz.filterMap", JSON.stringify(chartbugz.filterMap));
        localStorage.setItem("chartbugz.defaultFilterNickname", chartbugz.currentFilterNickname);
    };

    chartbugz.refreshFilterList = function () {
        $("#currentList").empty();
        for (var nickname in chartbugz.filterMap) {
            var newLink = document.createElement("a");
            newLink.href = "javascript:void(0);";
            newLink.text = nickname;
            $(newLink).click(function () {
                chartbugz.currentFilterNickname = this.text;
                chartbugz.loadData();
            })
            var newDiv = document.createElement("div");
            $(newDiv).append(newLink);
            $(".current-list").append(newDiv);
        }
        
    };

    chartbugz.loadData = function () {
        var data = [];
        var subUrl = chartbugz.filterMap[chartbugz.currentFilterNickname];
        jQuery.getFeed({
            url: (subUrl == "default.rss") ? "http://localhost:80/default.rss" : "http://localhost:80/proxy/"+subUrl,
            success: function (feed) {
                if (!feed)
                    return;

                for (var i = 0; i < feed.items.length; i++) {
                    var splitEstimate = /.*Estimate(.*)/.exec(feed.items[i].description);
                    var estimateString = "0";
                    if (splitEstimate && splitEstimate.length > 0)
                        estimateString = splitEstimate[1].replace(/[: \na-zA-Z]/g, '');

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