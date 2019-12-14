// ==UserScript==
// @author    wesinator
// @match    *://www.scumware.org/report/*
// @match    *://*.scumware.org/search.php
// @name    Scumware report download
// @version    0.1.0
// ==/UserScript==

/* 5 second wait for page to load and deobfuscate URLs
(Scumware obfuscates the URLs on static page to prevent scraping)
*/
setTimeout(function() {
    var getData = confirm("Scumware userscript here: do you want to save the data for this report?");

    if (getData) {
        reportObjects = scumwareReportData();
        objectsJson = JSON.stringify(reportObjects, null, 2);

        // JSON dump report url data to file
        // https://stackoverflow.com/questions/34101871/save-data-using-greasemonkey-tampermonkey-for-later-retrieval
        var a = document.createElement("a");

        // need encodeURIComponent to include json newlines properly
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(objectsJson);

        indicator = window.location.pathname.replace("/report/", "");
        a.download = indicator + "_scumware_urls.json";
        a.click();
    } else
        return
}, 5000);

function scumwareReportData() {
    // scumware table struct
    var scumwareReportTable = document.getElementsByClassName("wider")[0];
    var scumwareReportUrls = scumwareReportTable.children[1].children;

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
                        break;
                    case 3:
                        urlObject.ip = text;
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
