document.addEventListener('DOMContentLoaded', function() {
    var blockedCount = document.getElementById('blockedCount');
    var settingsBtn = document.getElementById('settings-btn');
    var toggleBtn = document.getElementById('enable-btn');
  
    // Update the blocked count
    function updateBlockedCount() {
      // Fetch the blocked count from storage and update the DOM
      chrome.storage.sync.get('blockedCount', function(data) {
        blockedCount.textContent = data.blockedCount || 0;
      });
    }
  
    // Open the settings page
    settingsBtn.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
  
    // Toggle the extension on/off
    toggleBtn.addEventListener('click', function() {
        chrome.storage.sync.get('disabled', function(data) {
          var isDisabled = data.disabled || false;
      
          // Toggle the extension status
          isDisabled = !isDisabled;
      
          // Update the extension status in storage
          chrome.storage.sync.set({ disabled: isDisabled }, function() {
            // Update the toggle button text and class
            toggleBtn.innerText = isDisabled ? 'Enable' : 'Disable';
            toggleBtn.classList.toggle('disable', isDisabled);
          });
        });
    });
  
    // Update the blocked count initially
    updateBlockedCount();
  
    // Listen for changes to the blocked count
    chrome.storage.onChanged.addListener(function(changes) {
      if (changes.blockedCount) {
        updateBlockedCount();
      }
    });
  });
  