(function () {

    'use strict';

    function init() {

        document.getElementById('settings-btn').addEventListener('click', function (e) {
            chrome.runtime.openOptionsPage();
            window.close();
        });

    }

    document.addEventListener('DOMContentLoaded', function () {
        init();
    });

}());