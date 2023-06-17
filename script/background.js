// Load the blacklist from the JSON file
function loadBlacklist(callback) {
  fetch(chrome.runtime.getURL("../blacklist.json"))
    .then((response) => response.json())
    .then((data) => callback(data))
    .catch((error) => console.error("Error loading blacklist:", error));
}

// Check if the accessed website is blacklisted
function isBlacklisted(url, callback) {
  loadBlacklist(function (blacklist) {
    var isBlacklisted = blacklist.includes(url);
    callback(isBlacklisted);
  });
}

function updateBlockedHistoryCount() {
  // Get the current date
  var currentDate = new Date().toLocaleDateString();

  // Get the blocked count from storage
  chrome.storage.sync.get(["dailyCount", "historyCount"], function (data) {
    var dailyCount = data.dailyCount || 0;
    var historyCount = data.historyCount || [];
    console.log("dt: ", dailyCount, historyCount);

    // Check if there is an entry for the current date
    var existingEntry = historyCount.find(function (entry) {
      return entry.date === currentDate;
    });

    if (existingEntry) {
      // If an entry for the current date exists, update the blocked count
      existingEntry.count += 1;
    } else {
      // If no entry for the current date exists, create a new entry
      dailyCount = 0;
      historyCount.push({ date: currentDate, count: dailyCount + 1 });
    }

    // Update the blocked count and history in storage
    chrome.storage.sync.set({
      dailyCount: dailyCount + 1,
      historyCount: historyCount,
    });
  });
}

// Function to redirect the tab to the warning page
function blockTab(tabId, url, domain) {
  var redirectUrl = chrome.runtime.getURL(
    `notification.html?url=${encodeURIComponent(
      url
    )}&domain=${encodeURIComponent(domain)}`
  );
  chrome.tabs.update(tabId, { url: redirectUrl });

  // Update the blocked count
  chrome.storage.sync.get(["blockedCount"], function (data) {
    var blockedCount = data.blockedCount || 0;
    chrome.storage.sync.set({ blockedCount: blockedCount + 1 });
  });

  // Update the blocked URL history
  chrome.storage.sync.get(["blockedHistory"], function (data) {
    var blockedHistory = data.blockedHistory || [];
    blockedHistory.push(domain);
    chrome.storage.sync.set({ blockedHistory: blockedHistory });
  });
  updateBlockedHistoryCount();
}

// Function to handle tab navigation
function handleNavigation(details) {
  var url = new URL(details.url);
  var domain = url.hostname;

  // Check if the extension is disabled
  chrome.storage.sync.get(["disabled"], function (data) {
    var isDisabled = data.disabled || false;
    if (isDisabled) {
      return;
    }

    // Check if the accessed website is on the whitelist
    chrome.storage.sync.get(["whitelist"], function (data) {
      var whitelist = data.whitelist || [];
      var isWhitelisted = whitelist.some(function (item) {
        return domain.includes(item);
      });

      if (isWhitelisted) {
        return;
      }
      if (
        redirectedTabs.some(
          (tab) => tab.tabId === details.tabId && tab.domain === domain
        )
      ) {
        // The warning page has sent a "continue" message, allow access
        return;
      } else {
        // Check if the accessed website is on the blacklist
        isBlacklisted(domain, function (blacklisted) {
          if (blacklisted) {
            // Check if the tab has been redirected previously
            blockTab(details.tabId, details.url, domain);
          } else {
            // The website is not blacklisted, scan resources for cryptojacking detection
            scanResources(details.tabId, details.url, domain); // Pass the necessary information
          }
        });
      }
    });
  });
}

// Declare redirectedTabs global
var redirectedTabs = [];

// Listen for tab navigation events
chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation, {
  url: [{ schemes: ["http", "https"] }],
});

// Listen for tab navigation events
chrome.webNavigation.onCompleted.addListener(handleNavigation, {
  url: [{ schemes: ["http", "https"] }],
});

// Function to scan text-based resources for cryptojacking detection
async function scanResources(tabId, url, domain) {
  console.log("Scanning resource:", url);

  try {
    // Fetch the resource content
    const response = await fetch(url);
    const text = await response.text();

    // Define cryptojacking keywords
    const cryptojackingKeywords = [
      "miner.start",
      "deepMiner.j",
      "deepMiner.min.j",
      "?proxy=wss://",
      "?proxy=ws://",
      "coinhive.min.js",
      "monero-miner.js",
      "wasmminer.wasm",
      "wasmminer.js",
      "cn-asmjs.min.js",
      "plugins/aj-cryptominer",
      "plugins/ajcryptominer",
      "plugins/wp-monero-miner-pro",
      "lib/crlt.js",
      "pool/direct.js",
      "n.2.1.js",
      "n.2.1.l*.js",
      "gridcash.js",
      "worker-asmjs.min.js",
      "?perfekt=wss://",
      "vbb/me0w.js",
      "webmr.js",
      "webxmr.js",
      "miner.js",
      "webmr4.js",
      "static/js/tpb.js",
      "lib/crypta.js",
      "bitrix/js/main/core/core_tasker.js",
      "bitrix/js/main/core/core_loader.js",
    ];

    // Check if any keyword is present in the resource content
    const detectedKeywords = cryptojackingKeywords.filter((keyword) =>
      text.includes(keyword)
    );

    if (detectedKeywords.length > 0) {
      console.log("Cryptojacking detected in resource:", url);
      console.log("Detected keywords:", detectedKeywords);
      // block tab
      blockTab(tabId, url, domain);
    } else {
      //Do CPUU Monitoring if cryptojacking activity is not detected after scanning
      cpuMonitoring(tabId, url, domain);
    }
  } catch (error) {
    console.error("Error fetching resource:", error);
  }
}

// Function to monitor CPU Usage to detect cryptojacking
async function cpuMonitoring(tabId, url, domain) {
  console.log("Monitoring CPU:", url);

  var idle = 0;
  var totalCPU = 0;
  var treshold = 90; //cpu treshold to indicate cryptojacking

  setInterval(function () {
    chrome.system.cpu.getInfo(function (info) {
      idle = 0;
      totalCPU = 0;

      //Get CPU idle percentage from each processors
      info.processors.forEach(function (processor) {
        idle += processor.usage.idle;
        totalCPU += processor.usage.total;
      });
      var cpuUsagePercentage = 100 - ((idle / totalCPU) * 100);
      console.log("CPU usage percentage:", cpuUsagePercentage);

      //When CPU usage is higher than treshold, then its potential cryptojacking
      if (cpuUsagePercentage >= treshold) {
        // block tab
        blockTab(tabId, url, domain);
      }
    });
  }, 10000); // Run every 10 seconds
}

// Message listener from the warning page
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "continue") {
    // Get the URL & domain from the query string
    var urlParams = new URLSearchParams(message);
    var blockedUrl = urlParams.get("url");
    let blockedDomain = new URL(blockedUrl).hostname;
    var isWhitelisted = message.whitelist;
    console.log("iswhitelisted " + isWhitelisted);

    // Check if there is an existing entry with the same tab ID
    var existingTab = redirectedTabs.find(function (tab) {
      return tab.tabId === sender.tab.id;
    });

    if (existingTab) {
      // Remove the existing entry with the same tab ID
      redirectedTabs = redirectedTabs.filter(function (tab) {
        return tab.tabId !== sender.tab.id;
      });
    }

    // Add the redirected tab ID and domain to the redirectedTabs array
    redirectedTabs.push({ tabId: sender.tab.id, domain: blockedDomain });

    if (isWhitelisted && blockedDomain) {
      // Add the domain to the whitelist
      chrome.storage.sync.get(["whitelist"], function (data) {
        var whitelist = data.whitelist || [];
        whitelist.push(blockedDomain);
        chrome.storage.sync.set({ whitelist: whitelist }, function () {
          // Update the whitelist immediately after it's modified
          chrome.webNavigation.getAllFrames(
            { tabId: sender.tab.id },
            function (frames) {
              frames.forEach(function (frame) {
                handleNavigation({ tabId: sender.tab.id, url: frame.url });
              });
            }
          );
        });
      });
    }

    // Redirect the tab to the blocked URL
    console.log("redirect");
    chrome.tabs.update(sender.tab.id, { url: blockedUrl });
  } else if (message.type === "goback") {
    // Go back to the previous site
    chrome.tabs.get(sender.tab.id, function (tab) {
      if (tab && tab.url) {
        chrome.tabs.goBack(tab.id, function () {
          if (chrome.runtime.lastError) {
            chrome.tabs.update(sender.tab.id, { url: "about:blank" });
          }
        });
      }
    });
  }
});
