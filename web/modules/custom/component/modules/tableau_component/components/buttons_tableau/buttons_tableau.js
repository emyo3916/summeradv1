
/* find all the .block-componentexample-config elements on the page and 
if their dataset blockType is equal to "sheet", initialize the viz, 
if their dataset blockType is equal to "filter", create a data structure that
contains a list of filterName, their associated filterTitle and fitlerVals 
Note: Drupal form configs are converted to all lowercase no matter how they're specified in .yml */
/* Debugging data table stuff 
https://viz-public.cu.edu/t/Boulder/views/AccessibilityExperiments/CUBelongingSB
https://viz-public.cu.edu/t/Boulder/views/AccessibilityExperiments/IncivDots 

const resetButton = document.querySelector("#reset_button");
//when users click the reset button, reset the viz
//find all the worksheets in the document and clear the filter
resetButton.addEventListener("click", function() {
  //find all the worksheets in the document and reset them
  getVizUrls();
    //get all the vizs on the page
    tableau.VizManager.getVizs().forEach(viz => {
    viz.revertAllAsync();
  });
});

*/