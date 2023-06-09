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
  



