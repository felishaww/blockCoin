document.addEventListener("DOMContentLoaded", function () {
  // Initialize the default active menu
  var activeMenu = "summary-menu";

  // Get the elements for each section
  var summarySection = document.getElementById("summary-section");
  var whitelistSection = document.getElementById("whitelist-section");
  var historySection = document.getElementById("history-section");
  var aboutSection = document.getElementById("about-section");

  // Get the elements for each menu button
  var summaryMenuBtn = document.getElementById("summary-menu");
  var whitelistMenuBtn = document.getElementById("whitelist-menu");
  var historyMenuBtn = document.getElementById("history-menu");
  var aboutMenuBtn = document.getElementById("about-menu");

  // Set the initial active section and menu
  summarySection.style.display = "block";
  summaryMenuBtn.classList.add("active");

  // Function to switch active section and menu
  function switchSection(menuId, section) {
    document.getElementById(activeMenu).classList.remove("active");
    document.getElementById(menuId).classList.add("active");
    document.getElementById(
      activeMenu.replace("-menu", "-section")
    ).style.display = "none";
    section.style.display = "block";
    activeMenu = menuId;
  }

  // Event listeners for menu buttons
  summaryMenuBtn.addEventListener("click", function () {
    switchSection("summary-menu", summarySection);
  });

  whitelistMenuBtn.addEventListener("click", function () {
    switchSection("whitelist-menu", whitelistSection);
  });

  historyMenuBtn.addEventListener("click", function () {
    switchSection("history-menu", historySection);
  });

  aboutMenuBtn.addEventListener("click", function () {
    switchSection("about-menu", aboutSection);
  });

  var whitelist = document.getElementById("whitelist");
  var whitelistInput = document.getElementById("whitelist-input");
  var addButton = document.getElementById("add-button");
  var deleteAllButton = document.getElementById("delete-all-button");
  var errorMessage = document.getElementById("error-message");
  var deleteWhitelistButton = document.getElementById("delete-whitelist-btn");

  // Load the whitelist items from storage
  chrome.storage.sync.get("whitelist", function (data) {
    var whitelistUrls = data.whitelist || [];
    whitelistUrls.forEach(function (url) {
      addWhitelistItem(url);
    });
  });

  // Load the blocked history items from storage
  chrome.storage.sync.get("blockedHistory", function (data) {
    var blockedUrls = data.blockedHistory || [];
    blockedUrls.forEach(function (url) {
      addBlockedHistoryItem(url);
    });
  });

  // Add whitelist item
  addButton.addEventListener("click", function () {
    var url = whitelistInput.value.trim();
    if (isValidUrl(url)) {
      // Save the new whitelist item to storage
      chrome.storage.sync.get("whitelist", function (data) {
        var whitelistUrls = data.whitelist || [];
        whitelistUrls.push(url);
        chrome.storage.sync.set({ whitelist: whitelistUrls });

        // Add the new whitelist item to the options page
        addWhitelistItem(url);

        // Clear the input field and error message
        whitelistInput.value = "";
        errorMessage.style.display = "none";
      });
    } else {
      // Display error message for invalid URL
      errorMessage.textContent = "Invalid URL. Please enter a valid URL.";
      errorMessage.style.display = "block";
    }
  });

  // Delete all blocked history items
  deleteAllButton.addEventListener("click", function () {
    var confirmed = confirm(
      "Are you sure you want to delete all blocked history?"
    );
    if (confirmed) {
      // Clear the blocked history in storage
      chrome.storage.sync.set({ blockedHistory: [] });

      // Clear the blocked history items on the options page
      blockedHistory.innerHTML = "";
    }
  });

  // Delete all whitelist items
  deleteWhitelistButton.addEventListener("click", function () {
    var confirmed = confirm("Are you sure you want to delete all whitelist?");
    if (confirmed) {
      // Clear the whitelist in storage
      chrome.storage.sync.set({ whitelist: [] });

      // Clear the whitelist items on the options page
      whitelist.innerHTML = "";
    }
  });

  // Function to validate the URL
  function isValidUrl(url) {
    // Regular expression pattern to validate URL or domain name
    var pattern = /^(https?:\/\/)?([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    return pattern.test(url);
  }

  // Function to add whitelist item to the options page
  function addWhitelistItem(url) {
    var listItem = document.createElement("li");
    listItem.textContent = url;

    var deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
      // Remove the whitelist item from storage
      chrome.storage.sync.get("whitelist", function (data) {
        var whitelistUrls = data.whitelist || [];
        var index = whitelistUrls.indexOf(url);
        if (index !== -1) {
          whitelistUrls.splice(index, 1);
          chrome.storage.sync.set({ whitelist: whitelistUrls });

          // Remove the whitelist item from the options page
          listItem.remove();
        }
      });
    });

    listItem.appendChild(deleteButton);
    whitelist.appendChild(listItem);
  }

  // Function to add blocked history item to the options page
  function addBlockedHistoryItem(url) {
    var blockedHistoryList = document.getElementById("blockedHistory");

    // Check if the URL already exists in the blocked history list
    var existingItem = Array.from(blockedHistoryList.children).find(function (
      item
    ) {
      return item.textContent === url;
    });

    // If the URL is not already in the blocked history list, add it
    if (!existingItem) {
      var listItem = document.createElement("li");
      listItem.textContent = url;
      blockedHistoryList.appendChild(listItem);
    }
  }

  var blockedCount = document.getElementById("blockedCount");
  // Update the blocked count
  function updateBlockedCount() {
    // Fetch the blocked count from storage and update the DOM
    chrome.storage.sync.get("blockedCount", function (data) {
      blockedCount.textContent = data.blockedCount || 0;
    });
  }
  // Update the blocked count initially
  updateBlockedCount();

  // Listen for changes to the blocked count
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.blockedCount) {
      updateBlockedCount();
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes && changes.historyCount && changes.historyCount.newValue) {
      var historyCount = changes.historyCount.newValue;
      constructChart(historyCount);
    }
  });

  // Get the historyCount from storage and send the initial update
  chrome.storage.sync.get(["historyCount"], function (data) {
    if (data && data.historyCount) {
      var historyCount = data.historyCount;
      constructChart(historyCount);
    }
  });

  //function that makes chart
  function constructChart(historyCount) {
    //chart data
    var chartjson = {
      title: "",
      data: historyCount,
      xtitle: "",
      ytitle: "Blocked Domain",
      ymax: 100,
      ykey: "count",
      xkey: "date",
    };

    //chart colors
    var colors = ["one", "two", "three", "four", "five", "six", "seven"];

    //constants
    var TROW = "tr",
      TDATA = "td";
    
    //get highest count value 
    var maxCount = Math.max(...historyCount.map(o => o.count));

    var chart = document.createElement("div");
    //create the chart canvas
    var barchart = document.createElement("table");
    //create the title row
    var titlerow = document.createElement(TROW);
    //create the title data
    var titledata = document.createElement(TDATA);
    //make the colspan to number of records
    titledata.setAttribute("colspan", chartjson.data.length + 1);
    titledata.setAttribute("class", "charttitle");
    titledata.innerText = chartjson.title;
    titlerow.appendChild(titledata);
    barchart.appendChild(titlerow);
    chart.appendChild(barchart);

    //create the bar row
    var barrow = document.createElement(TROW);

    //lets add data to the chart
    for (var i = 0; i < chartjson.data.length; i++) {
      barrow.setAttribute("class", "bars");
      //create the bar data
      var bardata = document.createElement(TDATA);
      var bar = document.createElement("div");
      bar.setAttribute("class", (colors[i] + " bars"));

      var count = chartjson.data[i][chartjson.ykey];
      bar.style.height = ((count/maxCount)*100) + '%';
      bardata.innerText = count;
      bardata.appendChild(bar);
      barrow.appendChild(bardata);
    }

    //create legends
    var legendrow = document.createElement(TROW);
    var legend = document.createElement(TDATA);
    legend.setAttribute("class", "legend");
    legend.setAttribute("colspan", chartjson.data.length);

    var dataLength = 7;
    if(chartjson.data.length < 7){
      dataLength = chartjson.data.length;
    }

    //add legend data
    for (var i = 0; i < dataLength; i++) {
      var legbox = document.createElement("span");
      legbox.setAttribute("class", "legbox");
      var barname = document.createElement("span");
      barname.setAttribute("class", colors[i] + " xaxisname");
      var bartext = document.createElement("span");
      bartext.innerText = chartjson.data[i][chartjson.xkey];
      legbox.appendChild(barname);
      legbox.appendChild(bartext);
      legend.appendChild(legbox);
    }
    barrow.appendChild(legend);
    barchart.appendChild(barrow);
    barchart.appendChild(legendrow);
    chart.appendChild(barchart);
    document.getElementById("chart").innerHTML = chart.outerHTML;
  }
});
