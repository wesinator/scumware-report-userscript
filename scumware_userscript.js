// ==UserScript==
// @author    wesinator
// @match    *://www.scumware.org/report/*
// @match    *://*.scumware.org/search.php
// @name    Scumware report download
// @version    2.0.0
// ==/UserScript==

/* 5 second wait for page to load and deobfuscate URLs
(Scumware obfuscates the URLs on static page to prevent scraping)
*/
setTimeout(function() {
  	// report will have url at a minimum. may have several URLs
    var reportData = {};

    // Search results from /search.php will not have link/indicator. There is no easy way to get the search query value either.
    if (window.location.pathname != "/search.php") {
        reportData.scumware_link = window.location.href;

        // handle additional 'indicator' data in bold
        var bs = document.getElementsByTagName('b');

        // parsing indicator from here and not window.location to avoid .html extension in URL (some site links add .html)
        reportData.indicator = {value: bs[1].nextSibling.innerText.trim(), type: bs[1].innerText.toLowerCase()};

        // add additional sections if present
        for (val of bs) {
            try {
                label = val.innerText.toLowerCase()
                next_text = val.nextSibling.innerText.trim();
                if (label == "file size")
                    reportData.indicator.file_size = next_text;
                else if (label == "country")
                    reportData.indicator.ip_country_name = val.children[0].innerText.trim();
                else if (label == "network")
                    reportData.indicator.ip_network = next_text;
                else if (label == "as")
                    // ignore if listed as AS 0
                    if (next_text != 0)
                        reportData.indicator.ip_as = next_text;
            }
            catch {}; 
        }
    }
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

        a.download = (reportData.indicator.value ?? `search_${reportData.urls[0].ip}_${reportData.urls[0].md5}`)  + "_scumware_urls_generated_" + utcDate + ".json";
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
                        // for partial '...' URLs given in default scumware report page
                        if (text.endsWith("..."))
                            urlObject.url_partial = text;
                        else
                            urlObject.url = text.replace('\n', '');
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
