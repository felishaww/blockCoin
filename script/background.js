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
      // Periodically check CPU usage every 10 seconds
      console.log("monitoring cpu usage");
      //setInterval(() => checkCpuUsage(tabId), 10000);
    }
  } catch (error) {
    console.error("Error fetching resource:", error);
  }
}

// Function to check CPU usage periodically
function checkCpuUsage(tabId) {
  console.log("msk");
  try {
    chrome.tabs.get(tabId, function (tab) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: estimateCpuUsage,
        },
        function (result) {
          if (chrome.runtime.lastError) {
            console.error("Error estimating CPU usage:", chrome.runtime.lastError);
            return;
          }

          const cpuUsage = result[0].result;
          // Define the threshold for high CPU usage
          const cpuThreshold = 0.7; // 70% CPU usage
          console.log("curr: ", cpuUsage);
          if (cpuUsage > cpuThreshold) {
            console.log("High CPU usage detected:", cpuUsage);
            // Check if the current tab is already in the redirectedTabs array
            const currentTab = redirectedTabs.find((tab) => tab.tabId === tabId);
            if (currentTab) {
              // Cryptojacking detected, block the tab
              blockTab(currentTab.tabId, currentTab.url, currentTab.domain);
            }
          }
        }
      );
    });
  } catch (error) {
    console.error("Error checking CPU usage:", error);
  }
}

// Function to estimate CPU usage using the performance API
function estimateCpuUsage() {
  const start = performance.now();
  for (let i = 0; i < 1000000; i++) {
    // Perform some CPU-intensive operations
    Math.sqrt(i);
  }
  const end = performance.now();
  const executionTime = end - start;

  // Estimate CPU usage based on the execution time
  const cpuUsage = executionTime / 1000; // Normalize to seconds

  // Return the estimated CPU usage
  cpuUsage;
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
