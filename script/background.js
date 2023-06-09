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
    blockedHistory.push(url);
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

      // Check if the accessed website is on the blacklist
      isBlacklisted(domain, function (blacklisted) {
        if (blacklisted) {
          // Check if the tab has been redirected previously
          if (
            redirectedTabs.some(
              (tab) => tab.tabId === details.tabId && tab.domain === domain
            )
          ) {
            // The warning page has sent a "continue" message, allow access
            return;
          } else {
            console.log("redirectedTabs: " + redirectedTabs);
            console.log("details.tabId: " + details.tabId);
            console.log("domain: " + domain);
            console.log("no");
          }

          blockTab(details.tabId, details.url, domain);
        }
      });
    });
  });
}

// Declare redirectedTabs global
var redirectedTabs = [];

// Listen for tab navigation events
chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation, {
  url: [{ schemes: ["http", "https"] }],
});

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
    chrome.tabs.update(sender.tab.id, { url: blockedUrl });
  } else if (message.type === "whitelist") {
    var domain = message.domain;
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
