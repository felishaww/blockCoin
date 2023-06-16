var counts = [];
var dates = []; 

window.addEventListener("message", function (event) {
  console.log("eve", event);
  if (event.data.type === "historyCountUpdate") {
    var historyCount = event.data.data;
    console.log("Received historyCount update:", historyCount);

    counts = historyCount.map((obj) => obj.count);
    dates = historyCount.map((obj) => obj.date);
  }
});
