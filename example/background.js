/// Declare redirectedTabs globally
var redirectedTabs = [];

// Function to detect cryptojacking activity
chrome.runtime.onInstalled.addListener(function () {
  console.log("hey");
  chrome.storage.sync.get(['whitelist'], function (result) {
    var whitelist = result.whitelist || [];

    // Load the blacklist from the JSON file
    function loadBlacklist(callback) {
      fetch(chrome.runtime.getURL('blacklist.json'))
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => console.error('Error loading blacklist:', error));
    }

    // Check if the accessed website is on the blacklist
    function isBlacklisted(url, callback) {
      loadBlacklist(function (blacklist) {
        var isBlacklisted = blacklist.includes(url);
        callback(isBlacklisted);
      });
    }

    // Check if the warning page is already open
    function isWarningPageOpen(tabId, callback) {
      chrome.tabs.get(tabId, function (tab) {
        var warningUrl = chrome.runtime.getURL('warning.html');
        var isOpen = tab.url === warningUrl;
        callback(isOpen);
      });
    }

    chrome.webNavigation.onBeforeNavigate.addListener(
      function (details) {
        var url = new URL(details.url);
        var domain = url.hostname;

        // Check if the extension is disabled
        chrome.storage.sync.get(['disabled'], function (data) {
          var isDisabled = data.disabled || false;
          if (isDisabled) {
            return;
          }

          // Check if the accessed website is on the whitelist
          if (whitelist.some(function (item) { return domain.includes(item); })) {
            return;
          }

          // Check if the warning page is already open
          isWarningPageOpen(details.tabId, function (isOpen) {
            if (isOpen) {
              return;
            }

            // Check if the accessed website is on the blacklist
            isBlacklisted(domain, function (blacklisted) {
              if (blacklisted) {
                var redirectUrl = chrome.runtime.getURL(`warning.html?url=${encodeURIComponent(details.url)}&domain=${encodeURIComponent(domain)}`);
                chrome.tabs.update(details.tabId, { url: redirectUrl });

                // Update the blocked count
                chrome.storage.sync.get(['blockedCount'], function (data) {
                  var blockedCount = data.blockedCount || 0;
                  chrome.storage.sync.set({ blockedCount: blockedCount + 1 });
                });

                // Update the blocked URL history
                chrome.storage.sync.get(['blockedHistory'], function (data) {
                  var blockedHistory = data.blockedHistory || [];
                  blockedHistory.push(details.url);
                  chrome.storage.sync.set({ blockedHistory: blockedHistory });
                });
              } else {
                // Store the tab ID of the redirected tab
                redirectedTabs.push(details.tabId);

                // Start CPU monitoring for the redirected tab
                startCPUUsageMonitoring(details.tabId);
              }
            });
          });
        });
      },
      {
        url: [{ schemes: ['http', 'https'] }],
      }
    );
  });
});

// Message listener from the warning page
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'continue') {
    // Remove the redirected tab ID from the redirectedTabs array
    var index = redirectedTabs.indexOf(sender.tab.id);
    if (index !== -1) {
      redirectedTabs.splice(index, 1);
    }
  } else if (message.type === 'whitelist') {
    var domain = message.domain;
    // Add the domain to the whitelist
    chrome.storage.sync.get(['whitelist'], function (data) {
      var whitelist = data.whitelist || [];
      whitelist.push(domain);
      chrome.storage.sync.set({ whitelist: whitelist });
    });
  }
});

// Function to monitor CPU usage for a specific tab
function startCPUUsageMonitoring(tabId) {
  // Calculate the average CPU usage over a period of time
  function calculateAverageUsage(samples) {
    var totalUsage = samples.reduce(function (sum, sample) {
      return sum + sample;
    }, 0);
    return totalUsage / samples.length;
  }

  // Store the CPU usage samples
  var cpuUsageSamples = [];

  // Monitor CPU usage at regular intervals
  setInterval(function () {
    chrome.system.cpu.getInfo(function (cpuInfo) {
      var totalUsage = cpuInfo.processors.reduce(function (sum, processor) {
        return sum + processor.usage.total;
      }, 0);
      console.log("total usage" + totalUsage);
      var usagePercentage = (totalUsage * 100) / cpuInfo.processors.length;
      console.log("usage percentage" + usagePercentage);

      // Add the CPU usage percentage to the samples
      cpuUsageSamples.push(usagePercentage);

      // Keep only the last 10 samples
      if (cpuUsageSamples.length > 10) {
        cpuUsageSamples.shift();
      }

      // Calculate the average CPU usage
      var averageUsage = calculateAverageUsage(cpuUsageSamples);
      console.log(averageUsage + "avg avggg");
    });
  }, 1000);
}

// Start monitoring CPU usage for all redirected tabs
function monitorCPUUsage() {
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (redirectedTabs.includes(tabs[i].id)) {
        startCPUUsageMonitoring(tabs[i].id);
      }
    }
  });
}

// Start monitoring CPU usage
//monitorCPUUsage();
