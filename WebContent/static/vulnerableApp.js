const detail = document.querySelector(".detail");
const detailTitle = document.querySelector(".detail-title");
const master = document.querySelector(".master");
const innerMaster = document.querySelector(".inner-master");

let vulnerabilitySelected = "";
let vulnerabilityLevelSelected = "";
let applicationSelected = "";

let currentVulnerabilityTypeElementId;
let currentVulnerabilityLevelElementId;

/**
 * Renders the entire User Interface using application's VulnerabilityDefinitions.
 * @param applicationNameVsVulnerabilityDefinitions 
 */
function render(applicationNameVsVulnerabilityDefinitions) {
  let isFirst = true;
  let identifier = 0;
  let isFirstElementAutoSelectionHandled = false;
  for(let applicationName in applicationNameVsVulnerabilityDefinitions) {
    let vulnerabilityDefinitions = applicationNameVsVulnerabilityDefinitions[applicationName];
    for (let index in vulnerabilityDefinitions) {
      let column = document.createElement("div");
      if (isFirst) {
        column.className = "master-item  active-item";
        isFirst = false;
      } else {
        column.className = "master-item";
      }
      column.dataset.internalid=index;
      column.id = identifier;
      let textNode = document.createTextNode(
        vulnerabilityDefinitions[index]["Name"]
      );
      identifier++;
      column.appendChild(textNode);
      master.appendChild(column);
      if(!isFirstElementAutoSelectionHandled) {
        _addEventListenerToVulnerabilityTypesAndLevels(column, applicationName, vulnerabilityDefinitions);
        column.click();
        isFirstElementAutoSelectionHandled = true;
      } else {
        _addEventListenerToVulnerabilityTypesAndLevels(column, applicationName, vulnerabilityDefinitions);
      }
    }
  }
}

function getUrlForVulnerabilityLevel() {
  return applicationSelected + "/" + vulnerabilitySelected + "/" + vulnerabilityLevelSelected;
}

function genericResponseHandler(xmlHttpRequest, callBack, isJson) {
  if (xmlHttpRequest.readyState == XMLHttpRequest.DONE) {
    // XMLHttpRequest.DONE == 4
    if (xmlHttpRequest.status == 200 || xmlHttpRequest.status == 401) {
      if (isJson) {
        callBack(JSON.parse(xmlHttpRequest.responseText));
      } else {
        callBack(xmlHttpRequest.responseText);
      }
    } else if (xmlHttpRequest.status == 400) {
      alert("There was an error 400");
    } else {
      alert("something else other than 200/401 was returned");
    }
  }
}

function doGetAjaxCallForVulnerabilityLevel(callBack, isJson) {
  let url = getUrlForVulnerabilityLevel();
  this.doGetAjaxCall(callBack, url, isJson);
}

function doGetAjaxCall(callBack, url, isJson) {
  let xmlHttpRequest = new XMLHttpRequest();
  xmlHttpRequest.onreadystatechange = function () {
    genericResponseHandler(xmlHttpRequest, callBack, isJson);
  };
  xmlHttpRequest.open("GET", url, true);
  xmlHttpRequest.setRequestHeader(
    "Content-Type",
    isJson ? "application/json" : "text/html"
  );
  xmlHttpRequest.send();
}

function doPostAjaxCall(callBack, url, isJson, data) {
  let xmlHttpRequest = new XMLHttpRequest();
  xmlHttpRequest.onreadystatechange = function () {
    return genericResponseHandler(xmlHttpRequest, callBack, isJson);
  };
  xmlHttpRequest.open("POST", url, true);
  xmlHttpRequest.send(data);
}

/** private member variables*/
/**
 * Generic Utility to fetch the Javascript and CSS dynamically
 * Appends the .js and .css to the provided template url. 
 * @param urlToFetchHtmlTemplate 
 */
function _loadDynamicJSAndCSS(urlToFetchHtmlTemplate) {
  let dynamicScriptsElement = document.getElementById("dynamicScripts");
  let cssElement = document.createElement("link");
  cssElement.href = urlToFetchHtmlTemplate + ".css";
  cssElement.type = "text/css";
  cssElement.rel = "stylesheet";
  dynamicScriptsElement.appendChild(cssElement);
  if (urlToFetchHtmlTemplate === "error") {
    document.getElementById("hideHelp").style.display = "none";
    document.getElementById("showHelp").style.display = "none";
  } else {
    document.getElementById("hideHelp").style.display = "inline-block";
    document.getElementById("showHelp").style.display = "inline-block";
    let jsElement = document.createElement("script");
    jsElement.type = "module";
    jsElement.src = urlToFetchHtmlTemplate + ".js?p=" + new Date().getTime();
    dynamicScriptsElement.appendChild(jsElement);
  }
}

/**
 * @param {*} vulnerabilityDefinitions 
 * @param {*} applicationName 
 * @param {*} clickedVulnerabilityTypeElementId - html element's unique identifier
 * @param {*} vulnerabilityIndex - index of vulnerability in provided vulnerabilityDefinitions
 * @param {*} clickedVulnerabilityLevelElementId 
 * @param {*} vulnerabilitySelected 
 */
function _callbackForHandlingClickEventOnLevelColumn(
  vulnerabilityDefinitions,
  applicationName,
  clickedVulnerabilityTypeElementId,
  vulnerabilityIndex,
  clickedVulnerabilityLevelElementId,
  vulnerabilitySelected
) {
  return function () {
    if (currentVulnerabilityTypeElementId == clickedVulnerabilityTypeElementId && currentVulnerabilityLevelElementId == clickedVulnerabilityLevelElementId) {
      return;
    }
    currentVulnerabilityTypeElementId = clickedVulnerabilityTypeElementId;
    currentVulnerabilityLevelElementId = clickedVulnerabilityLevelElementId;
    _resetSelectedVulnerabilityLevel();
    vulnerabilityLevelSelected =
      vulnerabilityDefinitions[vulnerabilityIndex]["Detailed Information"][clickedVulnerabilityLevelElementId]["Level"];
    this.classList.add("active-item");
    let htmlTemplate =
      vulnerabilityDefinitions[vulnerabilityIndex]["Detailed Information"][clickedVulnerabilityLevelElementId][
        "HtmlTemplate"
      ];
    document.getElementById("vulnerabilityDescription").innerHTML =
      vulnerabilityDefinitions[vulnerabilityIndex]["Description"];
    let urlToFetchHtmlTemplate = htmlTemplate
      ? applicationName + "/templates/" + vulnerabilitySelected + "/" + htmlTemplate
      : "error";
    let parentNodeWithAllDynamicScripts = document.getElementById(
      "dynamicScripts"
    );
    let dynamicScriptNode = parentNodeWithAllDynamicScripts.lastElementChild;
    //Might not require to iterate but iterating for safe side. can be removed after proper testing.
    while (dynamicScriptNode) {
      dynamicScriptNode.remove();
      dynamicScriptNode = parentNodeWithAllDynamicScripts.lastElementChild;
    }
    doGetAjaxCall((responseText) => {
      detailTitle.innerHTML = responseText;
      _loadDynamicJSAndCSS(urlToFetchHtmlTemplate);
    }, urlToFetchHtmlTemplate + ".html");
  };
}
/**
 * Resets the provided active items
 * @param {*} items 
 */
function _resetActiveItems(items) {
  for (let item of items) {
    item.classList.remove("active-item");
  }
}

function _resetSelectedVulnerabilityType() {
  //console.log('Clicked item');
  const vulnerabilityTypeItems = document.querySelectorAll(".master-item");
  //Making back to learning vulnerability
  document.getElementById("vulnLearnBtn").click();
  _resetActiveItems(vulnerabilityTypeItems);
  _resetHelpRelatedElements();
}

function _resetSelectedVulnerabilityLevel() {
  //console.log('Clicked item');
  const vulnerabilityLevelItems = document.querySelectorAll(".inner-master-item");
  _resetActiveItems(vulnerabilityLevelItems);
  _resetHelpRelatedElements();
}

function _addEventListenerToVulnerabilityTypesAndLevels(item, applicationName, vulnerabilityDefinitions) {
  item.addEventListener("click", function () {
    _resetSelectedVulnerabilityType();
    this.classList.add("active-item");
    detail.classList.remove("hidden-md-down");
    innerMaster.innerHTML = "";
    applicationSelected = applicationName;
    vulnerabilitySelected = vulnerabilityDefinitions[this.dataset.internalid]["Name"];
    let isFirst = true;
    for (let key in vulnerabilityDefinitions[this.dataset.internalid][
      "Detailed Information"
    ]) {
      let column = document.createElement("div");
      column.id = this.id + "." + key;
      let textNode = document.createTextNode(
        vulnerabilityDefinitions[this.dataset.internalid]["Detailed Information"][key][
          "Level"
        ]
      );
      column.appendChild(textNode);
      column.className = "inner-master-item";
      column.addEventListener(
        "click",
        _callbackForHandlingClickEventOnLevelColumn(
          vulnerabilityDefinitions,
          applicationName,
          this.id,
          this.dataset.internalid,
          key,
          vulnerabilitySelected
        )
      );
      if (isFirst) {
        column.click();
        isFirst = false;
      }
      innerMaster.appendChild(column);
      _addEventListenerToShowHideHelpButton(vulnerabilityDefinitions, this.dataset.internalid, key);
    }
  });
}

//Resets the html elements related to Help.
function _resetHelpRelatedElements() {
  document.getElementById("showHelp").disabled = false;
  document.getElementById("helpText").innerHTML = "";
  document.getElementById("hideHelp").disabled = true;
}

function _addEventListenerToShowHideHelpButton(vulnerableAppEndPointData, internalid, key) {
  document.getElementById("showHelp").addEventListener("click", function () {
    document.getElementById("showHelp").disabled = true;
    let helpText = "<ol>";
    for (let index in vulnerableAppEndPointData[internalid][
      "Detailed Information"
    ][key]["AttackVectors"]) {
      let attackVector =
        vulnerableAppEndPointData[internalid]["Detailed Information"][
          key
        ]["AttackVectors"][index];
      let curlPayload = attackVector["CurlPayload"];
      let description = attackVector["Description"];
      helpText =
        helpText +
        "<li><b>Description about the attack:</b> " +
        description +
        "<br/><b>Payload:</b> " +
        curlPayload +
        "</li>";
    }
    helpText = helpText + "</ol>";
    document.getElementById("helpText").innerHTML = helpText;
    document.getElementById("hideHelp").disabled = false;
  });

  document.getElementById("hideHelp").addEventListener("click", function () {
    _resetHelpRelatedElements();
  });
}

/**
 * Autoregister Event listeners for handling basic user interactions with UI component
 */
(function _autoRegister() {
  document
    .getElementById("learnAndPracticeBtn")
    .addEventListener("click", () => {
      document.getElementById("testScanner").classList.add("hide-component");
      document
        .getElementById("learnAndPractice")
        .classList.remove("hide-component");
      document.getElementById("chooseMode").classList.add("hide-component");
    });

  document.getElementById("testScannerBtn").addEventListener("click", () => {
    document.getElementById("testScanner").classList.remove("hide-component");
    document.getElementById("learnAndPractice").classList.add("hide-component");
    document.getElementById("chooseMode").classList.add("hide-component");
  });

  document.getElementById("vulnPracticeBtn").addEventListener("click", () => {
    document.getElementById("vulnPractice").classList.remove("hide-component");
    document
      .getElementById("vulnerabilityDescription")
      .classList.add("hide-component");
    document.getElementById("vulnLearnBtn").classList.remove("hide-component");
    document.getElementById("vulnPracticeBtn").classList.add("hide-component");
  });

  document.getElementById("vulnLearnBtn").addEventListener("click", () => {
    document.getElementById("vulnPractice").classList.add("hide-component");
    document
      .getElementById("vulnerabilityDescription")
      .classList.remove("hide-component");
    document
      .getElementById("vulnPracticeBtn")
      .classList.remove("hide-component");
    document.getElementById("vulnLearnBtn").classList.add("hide-component");
  });
})();