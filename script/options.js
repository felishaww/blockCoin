document.addEventListener('DOMContentLoaded', function() {
    // Initialize the active menu
  var activeMenu = 'summary-menu';

  // Get the elements for each section
  var summarySection = document.getElementById('summary-section');
  var whitelistSection = document.getElementById('whitelist-section');
  var historySection = document.getElementById('history-section');
  var aboutSection = document.getElementById('about-section');

  // Get the elements for each menu button
  var summaryMenuBtn = document.getElementById('summary-menu');
  var whitelistMenuBtn = document.getElementById('whitelist-menu');
  var historyMenuBtn = document.getElementById('history-menu');
  var aboutMenuBtn = document.getElementById('about-menu');

  // Set the initial active section and menu
  summarySection.style.display = 'block';
  summaryMenuBtn.classList.add('active');

  // Function to switch active section and menu
  function switchSection(menuId, section) {
    document.getElementById(activeMenu).classList.remove('active');
    document.getElementById(menuId).classList.add('active');
    document.getElementById(activeMenu.replace('-menu', '-section')).style.display = 'none';
    section.style.display = 'block';
    activeMenu = menuId;
  }

  // Event listeners for menu buttons
  summaryMenuBtn.addEventListener('click', function() {
    switchSection('summary-menu', summarySection);
  });

  whitelistMenuBtn.addEventListener('click', function() {
    switchSection('whitelist-menu', whitelistSection);
  });

  historyMenuBtn.addEventListener('click', function() {
    switchSection('history-menu', historySection);
  });

  aboutMenuBtn.addEventListener('click', function() {
    switchSection('about-menu', aboutSection);
  });

    var whitelist = document.getElementById('whitelist');
    var whitelistInput = document.getElementById('whitelist-input');
    var addButton = document.getElementById('add-button');
    var deleteAllButton = document.getElementById('delete-all-button');
    var errorMessage = document.getElementById('error-message');
  
    // Load the whitelist items from storage
    chrome.storage.sync.get('whitelist', function(data) {
      var whitelistUrls = data.whitelist || [];
      whitelistUrls.forEach(function(url) {
        addWhitelistItem(url);
      });
    });
  
    // Load the blocked history items from storage
    chrome.storage.sync.get('blockedHistory', function(data) {
      var blockedUrls = data.blockedHistory || [];
      blockedUrls.forEach(function(url) {
        addBlockedHistoryItem(url);
      });
    });
  
    // Add whitelist item
    addButton.addEventListener('click', function() {
      var url = whitelistInput.value.trim();
      if (isValidUrl(url)) {
        // Save the new whitelist item to storage
        chrome.storage.sync.get('whitelist', function(data) {
          var whitelistUrls = data.whitelist || [];
          whitelistUrls.push(url);
          chrome.storage.sync.set({ whitelist: whitelistUrls });
  
          // Add the new whitelist item to the options page
          addWhitelistItem(url);
  
          // Clear the input field and error message
          whitelistInput.value = '';
          errorMessage.style.display = 'none';
        });
      } else {
        // Display error message for invalid URL
        errorMessage.textContent = 'Invalid URL. Please enter a valid URL.';
        errorMessage.style.display = 'block';
      }
    });
  
    // Delete all blocked history items
    deleteAllButton.addEventListener('click', function() {
      var confirmed = confirm('Are you sure you want to delete all blocked history?');
      if (confirmed) {
        // Clear the blocked history in storage
        chrome.storage.sync.set({ blockedHistory: [] });
  
        // Clear the blocked history items on the options page
        blockedHistory.innerHTML = '';
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
      var listItem = document.createElement('li');
      listItem.textContent = url;
  
      var deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', function() {
        // Remove the whitelist item from storage
        chrome.storage.sync.get('whitelist', function(data) {
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
  var blockedHistoryList = document.getElementById('blocked-history-list');

  // Check if the URL already exists in the blocked history list
  var existingItem = Array.from(blockedHistoryList.children).find(function(item) {
    return item.textContent === url;
  });

  // If the URL is not already in the blocked history list, add it
  if (!existingItem) {
    var listItem = document.createElement('li');
    listItem.textContent = url;
    blockedHistoryList.appendChild(listItem);
  }
}

  });
  