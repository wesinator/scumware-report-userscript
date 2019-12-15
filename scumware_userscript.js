// ==UserScript==
// @author    wesinator
// @match    *://www.scumware.org/report/*
// @match    *://*.scumware.org/search.php
// @name    Scumware report download
// @version    1.0.0
// ==/UserScript==

/* 5 second wait for page to load and deobfuscate URLs
(Scumware obfuscates the URLs on static page to prevent scraping)
*/
setTimeout(function() {
    // template for report data including link
    var reportData = {
        indicator: "",
        scumware_link: "https://www.scumware.org/report/",
        urls: []
    };

    reportData.scumware_link = window.location.href;
    reportData.indicator = window.location.pathname.replace("/report/", "");
    reportData.urls = scumwareReportData();

    var downloadData = confirm("Scumware userscript here: do you want to save the data for this report?");
    if (downloadData) {
        reportJson = JSON.stringify(reportData, null, 2);

        // Get date UTC
        var utcDate = new Date().toJSON().slice(0,10);

        // JSON dump report url data to file
        // https://stackoverflow.com/questions/34101871/save-data-using-greasemonkey-tampermonkey-for-later-retrieval
        var a = document.createElement("a");

        // need encodeURIComponent to include json newlines properly
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(reportJson);

        a.download = reportData.indicator + "_scumware_urls_generated_" + utcDate + ".json";
        a.click();
    }
    else
        return
}, 5000);

function scumwareReportData() {
    // scumware table struct
    var scumwareReportTable = document.getElementsByClassName("wider")[0]; // table
    var scumwareReportUrls = scumwareReportTable.children[1].children; // children of tbody

    var urlObjects = [];

    for (row in scumwareReportUrls) {
        var urlEntry = scumwareReportUrls[row].children;
        //console.log(urlEntry);

        var urlObject = {
            date: "",

            url: "",
            url_partial: "", // for partial '...' URLs given in default scumware report page
            md5: "",
            ip: "",
            country: "",

            threat: "",
        };

        if (urlEntry) {
            for (var i = 0; i < urlEntry.length; i++) {
                var text = urlEntry[i].innerText;
                //console.log(text);

                switch (i) {
                    case 0:
                        urlObject.date = text;
                        break;
                    case 1:
                        if (text.endsWith("..."))
                            urlObject.url_partial = text;
                        else
                            urlObject.url = text;
                        break;
                    case 2:
                        urlObject.md5 = text;
                        addLink(urlEntry[i], text);
                        break;
                    case 3:
                        urlObject.ip = text;
                        addLink(urlEntry[i], text);
                        break;
                    case 4:
                        urlObject.country = text;
                        break;
                    case 5:
                        urlObject.threat = text;
                        break;
                }
            }

            //console.log(urlObject);
            urlObjects.push(urlObject);
        }

    }

    //console.log(urlObjects)
    return urlObjects;
}

// add missing links for pivot to other reports
function addLink(element, text) {
    return element.innerHTML = "<a href=\"https://www.scumware.org/report/" + text + "\" target=_blank>" + text + "</a>";
}
