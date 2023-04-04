
/* find all the .block-componentexample-config elements on the page and 
if their dataset blockType is equal to "sheet", initialize the viz, 
if their dataset blockType is equal to "filter", create a data structure that
contains a list of filterName, their associated filterTitle and fitlerVals 
Note: Drupal form configs are converted to all lowercase no matter how they're specified in .yml */
/* Debugging data table stuff 
https://viz-public.cu.edu/t/Boulder/views/AccessibilityExperiments/CUBelongingSB
https://viz-public.cu.edu/t/Boulder/views/AccessibilityExperiments/IncivDots 
*/
let vizList = [];
let vizBlock = null;
initVizs();
console.log("allSheets ", vizList);
addFilterRadios();

/* find all the .block-componentexample-config elements on the page and make a list of vizurls */
function getVizUrls() {
  const vizUrls = [];
  const vizBlocks = document.querySelectorAll(".block-componentexample-config .example_config");
  console.log("vizBlocks ", vizBlocks);
  vizBlocks.forEach(vizBlock => {
    const config = { ...vizBlock.dataset };
    console.log("config ", config);

    if (config.blocktype === 'sheet') {
      vizUrls.push(config.vizurl);
    }
  });
  console.log("vizUrls ", vizUrls);
  return vizUrls;
}


/* for all the .block-componentexample-config elements on the page, if the dataset blockType is equal to "sheet",
create a div to hold the viz and add it to the DOM, initialize the viz and return a list of viz objects
tableau viz's default to opening to the size of the div, in Drupal this default had a pixel height of 1
long term might let the vizauthor set size?  */
function initVizs() {
  const vizBlocks = document.querySelectorAll(".block-componentexample-config .example_config");
  vizBlocks.forEach(vBlock => {
    const config = { ...vBlock.dataset };
    if (config.blocktype === 'sheet') {
      const vizUrl = config.vizurl;
      console.log("vizUrl ", vizUrl);
      const vizContainer = document.createElement('div');
      //set the vizContainer id to config.vizname concatenated with "-viz"
      vizContainer.id = makeId(config.vizname)+'-viz';
      vizContainer.style.width = '100%';
      vizContainer.style.height = '600px';
      //add aria-hidden="true" to the vizContainer so that it is not read by screen readers
      vizContainer.setAttribute('aria-hidden', 'true');  
      const vizOptions = {
        hideTabs: true,
        hideToolbar: true,
        onFirstInteractive: function () {
   //       vizBlock = viz.getParentElement(); 
  //        getTableData(viz);
          console.log("Worksheet initialized. ");
        }
      };
        const viz = new tableau.Viz(vizContainer, vizUrl, vizOptions);
        vBlock.appendChild(vizContainer); 
        //tech debt: we only need a list of viz's can get their container from the viz object
        vizList.push({viz, vizContainer});
      };
  }); 
  } 

/* for each .block-componentexample-config element on the page, if the dataset blockType is equal to "filter",
add the radio buttons to the DOM for that element */
function addFilterRadios() {
  const filterBlocks = document.querySelectorAll(".block-componentexample-config .example_config");
  filterBlocks.forEach(filterBlock => {
    const config = { ...filterBlock.dataset };
    if (config.blocktype === 'filter') {
      const filterName = config.filtername;
      const filterVals = config.filters.split(',').map(element => element.trim());
      const filterContainer = document.createElement('div');
      filterContainer.id = makeId(filterName)+'-filter';
      filterContainer.style.width = '100%';
      const legend = document.createElement('legend');
      const filterTitle = config.filtertitle;
      console.log("filterTitle ", filterTitle, " filterName ", filterName, " filterVals ", filterVals, " filterContainer ", filterContainer);
      legend.innerHTML = filterTitle;
      filterContainer.appendChild(legend);
      filterVals.forEach(filterVal => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = filterName;
        input.value = filterVal;
        input.addEventListener('change', function () {
          //for each sheet in the sheetList, apply the filter, 
          //then pass the sheet and the vizBlock for that sheet to getTableData
          vizList.forEach(viz => {
            const sheet = viz.viz.getWorkbook().getActiveSheet();
            sheet.applyFilterAsync(filterName, filterVal, tableau.FilterUpdateType.REPLACE)
          });
          getTableData();
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(filterVal));
        filterContainer.appendChild(label);
      });
      filterBlock.appendChild(filterContainer);
    }
  });
}



//take a filterName and make it appropriate for use as a DOM id
function makeId(tabName) {
  return tabName.replace(/\s+/g, '-').toLowerCase();
}

/* for each .block-componentexample-config element on the page, if the dataset blockType is equal to "sheet",
then get data from the sheet and create or update a table and add it to the DOM */
//is it because it's confused about the active sheet? 
function getTableData() {
  vizList.forEach(viz => {
    let sheet=viz.viz.getWorkbook().getActiveSheet();
    vizDiv = viz.viz.getParentElement();
  //get the vizBlock for the viz that was passed in
    vizBlock = vizDiv.parentNode;
    console.log("getTableData w/forEach vizBlock ", vizBlock, " sheet ", sheet);
  const options = {
    maxRows: 0, // Max rows to return. Use 0 to return all rows
    ignoreAliases: false,
    ignoreSelection: true,
    includeAllColumns: false
    };

  dataTable = sheet.getSummaryDataAsync(options)
    .then(function (dataTable) {
      generateTable(dataTable);
    })
    .otherwise(function (error) {
      console.log("error ", error);
    })
    });
}

// generate the table using only the formatted data
function generateTable(table) {
  const config = { ...vizBlock.dataset };
  console.log("config ", config);
  const divId = config.vizname;
//if there is no div for the table yet, create one and give it the id config.vizname  
  if (!document.getElementById(divId)) {
    const tableContainer = document.createElement('div');
    tableContainer.id = divId;
    vizBlock.appendChild(tableContainer);
    console.log("new div table ", table, " divId ", divId);
  } else {
    //if there is a div for the table, clear it out
    const tableContainer = document.getElementById(divId);
    tableContainer.innerHTML = '';
    console.log("existing div table ", table, " divId ", divId);
  }

  //create the table element
  const tableElement = document.createElement('table');
  //get the headers
  const headers = table.getColumns();
  //get the data
  const data = table.getData();
  //create the table 
  const tableHead = document.createElement('thead');
  const tableBody = document.createElement('tbody');
  const tableRow = document.createElement('tr');
  //for each header, create a table header and add it to the table row
  headers.forEach(header => {
    const tableHeader = document.createElement('th');
    tableHeader.innerHTML = header.getFieldName();
    tableRow.appendChild(tableHeader);
  });
  tableHead.appendChild(tableRow);
  //add the table head to the table
  tableElement.appendChild(tableHead);
  //clear the table body - do I need this? I think I do.
  tableBody.innerHTML = '';
  //for each row of data, create a table row
  data.forEach(row => {
    const tableRow = document.createElement('tr');
    //for each cell in the row, create a table cell and add it to the table row
    row.forEach(cell => {
      const tableCell = document.createElement('td');
      tableCell.innerHTML = cell.formattedValue;
      tableRow.appendChild(tableCell);
    });
    tableBody.appendChild(tableRow);
  });
  //add the table body to the table
  tableElement.appendChild(tableBody);
  //add the table to the table container
  const tableContainer = document.getElementById(divId);
  tableContainer.appendChild(tableElement);
}

/*   
  const tableContainer = document.getElementById('tableContainer');
  tableContainer.innerHTML = '';
  let tableElement = document.createElement('table');
  let headers = table.getColumns();
  let data = table.getData();
  let tableHead = document.createElement('thead');
  let tableBody = document.createElement('tbody');
  let tableRow = document.createElement('tr');
  headers.forEach(header => {
    let tableHeader = document.createElement('th');
    tableHeader.innerHTML = header.getFieldName();
    tableRow.appendChild(tableHeader);
  });
  tableHead.appendChild(tableRow);
  tableElement.appendChild(tableHead);
  //clear the table body - do I need this? I think I do.
  tableBody.innerHTML = '';
  data.forEach(row => {
    let tableRow = document.createElement('tr');
    row.forEach(cell => {
      let tableCell = document.createElement('td');
      tableCell.innerHTML = cell.formattedValue;
      tableRow.appendChild(tableCell);
    });
    tableBody.appendChild(tableRow);
  });
  tableElement.appendChild(tableBody);
  tableContainer.appendChild(tableElement);
} */

//end of example_config.js
