function block(blacklist) {
  console.log("Ready to block");
  console.log(blacklist);
  //   chrome.webRequest.onBeforeRequest.addListener(
  //     callback,
  //     {
  //       urls: blacklist,
  //     },
  //     ["blocking"]
  //   );
  //   chrome.webRequest.onBeforeRequest.addListener(
  //     callback,
  //     {
  //       urls: blacklist,
  //     },
  //     ["blocking"]
  //   );

  //   if (chrome.webRequest.onBeforeRequest.hasListener(callback)) {
  //     console.log("Listening");
  //   }
  const adblockRuleID = 2; // give any id to indetify the rule but must be greater than 1
  chrome.declarativeNetRequest.updateDynamicRules(
    {
      addRules: [{
        "id" : adblockRuleID,
        "priority": 1,
        "action" : { "type" : "block" },
        "condition" : {
            "urlFilter": "*://example.com/*",
            "resourceTypes": ['main_frame', 'csp_report', 'media', 'object', 'other', 'ping', 'script', 'stylesheet', 'sub_frame', 'webbundle', 'websocket', 'webtransport', 'xmlhttprequest']
        }
      }
      ],
      removeRuleIds: [adblockRuleID], // this removes old rule if any
    },
    () => {
      console.log("block rule added");
    }
  );
}

function start() {
  fetch(
    "https://raw.githubusercontent.com/andreas0607/CoinHive-blocker/master/blacklist.json"
  )
    .then(function (response) {
      console.log(response.ok);
      if (!response.ok) {
        throw new Error("network response not ok");
      }
      console.log("wow");
      return response.json();
    })
    .then(block)
    .catch(function (error) {
      console.log(error.message);
      //will retry every 10 secs
      console.log("masuk fetch local");
      fetch("../blacklist.json")
        .then(function (response) {
          return response.json();
        })
        .then(block);
    });
}

var callback = function deny(block) {
  chrome.storage.sync.get("stat", function (res) {
    if (res.stat === undefined) {
      var obj = {};
      chrome.storage.sync.set({ stat: obj }, function () {});
    } else {
      var obj = res.stat;
      chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        function (tabs) {
          console.log(tabs[0].url);
          var site = tabs[0].url;
          if (!(site in obj)) {
            var l = site;
            obj[l] = 1;
            chrome.storage.sync.set({ stat: obj }, function () {});
          } else {
            var l = site;
            obj[l] = obj[l] + 1;
            chrome.storage.sync.set({ stat: obj }, function () {});
          }
        }
      );
    }
  });
  return { cancel: true };
};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.sync.get("stat", function (res) {
    var obj = res.stat;
    if (res.stat === null) {
      chrome.storage.sync.set({ stat: {} }, function () {});
    } else {
      if (!(request.site in obj)) {
        var l = request.site;
        obj[l] = 1;
        chrome.storage.sync.set({ stat: obj }, function () {});
      } else {
        var l = request.site;
        obj[l] = obj[l] + 1;
        chrome.storage.sync.set({ stat: obj }, function () {});
      }
    }
  });
});
start();
