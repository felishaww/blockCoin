// document.addEventListener("DOMContentLoaded", function () {
//   var continueButton = document.getElementById("continueBtn");
//   var whitelistButton = document.getElementById("whitelistBtn");
//   var urlElement = document.getElementById("url");
//   var domainElement = document.getElementById("domain");

//   // Continue button listener
//   continueButton.addEventListener("click", function () {
//     var url = urlElement.textContent;
//     if (url && url !== "") {
//       chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//         var tab = tabs[0];
//         if (tab && tab.url && tab.url !== "") {
//           var redirectUrl = new URL(tab.url);
//           redirectUrl.searchParams.delete("url"); // Remove the 'url' parameter
//           redirectUrl.searchParams.delete("domain"); // Remove the 'domain' parameter
//           chrome.tabs.update(tab.id, { url: redirectUrl.href });
//         } else {
//           console.error("Invalid URL");
//         }
//       });
//     } else {
//       console.error("Invalid URL");
//     }
//   });

//   // Whitelist button listener
//   whitelistButton.addEventListener("click", function () {
//     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//       var tab = tabs[0];
//       if (tab && tab.url && tab.url !== "") {
//         var url = new URL(tab.url);

//         // Retrieve the whitelist from storage
//         chrome.storage.sync.get("whitelist", function (data) {
//           var whitelistUrls = data.whitelist || [];

//           // Check if the current URL is already in the whitelist
//           if (!whitelistUrls.includes(url.hostname)) {
//             // Add the current URL to the whitelist
//             whitelistUrls.push(url.hostname);

//             // Update the whitelist in storage
//             chrome.storage.sync.set({ whitelist: whitelistUrls }, function () {
//               // Show a success message
//               var successMessage = document.getElementById("success-message");
//               successMessage.style.display = "block";

//               // Disable the whitelist button
//               whitelistButton.disabled = true;
//             });
//           }
//         });
//       } else {
//         console.error("Invalid URL");
//       }
//     });
//   });

//   // Retrieve URL and domain information from query parameters
//   var urlParams = new URLSearchParams(window.location.search);
//   var url = "";
//   var domain = "";

//   // Check if the URL parameter exists and is not empty
//   if (urlParams.has("url")) {
//     url = decodeURIComponent(urlParams.get("url"));
//   }

//   // Check if the domain parameter exists and is not empty
//   if (urlParams.has("domain")) {
//     domain = decodeURIComponent(urlParams.get("domain"));
//   }

//   // Display URL and domain information
//   urlElement.textContent = url;
//   domainElement.textContent = domain;
// });


document.addEventListener('DOMContentLoaded', function() {
    var continueButton = document.getElementById('continueBtn');
  
    // Get the URL and domain from the query parameters
    var urlParams = new URLSearchParams(window.location.search);
    var url = urlParams.get('url');
    var domain = urlParams.get('domain');
  
    // Display the URL and domain on the warning page
    var urlElement = document.getElementById('url');
    var domainElement = document.getElementById('domain');
    urlElement.textContent = url;
    domainElement.textContent = domain;


    // Continue button listener
    continueButton.addEventListener('click', function() {
        var isWhitelisted = document.getElementById("whitelistRadio").checked;
      chrome.runtime.sendMessage({ type: 'continue', url: url, whitelist: isWhitelisted });
    });
  
    // Goback button listener
    var gobackButton = document.getElementById('gobackBtn');
    gobackButton.addEventListener('click', function() {
      chrome.runtime.sendMessage({ type: 'goback' });
    });

    
  });
  



