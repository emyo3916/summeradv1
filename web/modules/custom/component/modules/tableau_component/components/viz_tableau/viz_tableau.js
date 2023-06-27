/* find all the .block-componentviz-tableau elements on the page and 
Note: Drupal form configs are converted to all lowercase no matter how they're specified in .yml */
/* Debugging data table stuff 
https://viz-public.cu.edu/t/Boulder/views/AccessibilityExperiments/CUBelongingSB
https://viz-public.cu.edu/t/Boulder/views/AccessibilityExperiments/IncivDots 
clean up the code 

  - get rid of the vizList and metricList variable
  - refactor the addFilterRadios function
  - get rid of the ids for the metrics and vizs 
  - figure out a better way to show viz other than 600px height
  - come up with a plan for more than one button
  - make sure that focus is set correctly after an API call (i.e. after the reset button is clicked, focus should be on the reset button)
  Document how to use the viz_tableau component including saving the viz in the filter state you want it to be in
  and how to get the viz url. Also document how to use the metric_tableau component. For filters the first option 
  in your control should be the saved default Document finding out table structure and deciding what to show.
*/
let vizList = [];
let metricList = [];

//start of function makeID
//take a filterName and make it appropriate for use as a DOM id
function makeId(tabName) {
    return tabName.replace(/\s+/g, '-').toLowerCase();
}

//take a value and a vizBlock and format the value according to the vizBlock's data-metrictype attribute
function formatMetricValue(value, vizBlock) {
    console.log("::formatMetricValue::");
    const config = {
        ...vizBlock.dataset
    };
    const metricType = config.metrictype;
    const metricValue = vizBlock.querySelector('.metric-value');
    //if value is null or undefined, set it to 'N/A'
    if (value === null || value === undefined || value === 'null') {
        value = 'No Data';
        metricValue.innerHTML = value;
        return;
    }
    //check to see if metric type is string, integer, decimal, percent, currency, or date
    if (metricType === 'string') {
        metricValue.innerHTML = value;
    } else if (metricType === 'integer') {
        //round to 0 decimal places
        metricValue.innerHTML = Math.round(value);
    } else if (metricType === 'decimal2') {
        //round to 2 decimal places
        metricValue.innerHTML = Math.round(value * 100) / 100;
    } else if (metricType === 'percent') {
        //mulitply by 100, round to zero decimal places and add a percent sign
        metricValue.innerHTML = Math.round(value * 100) + '%';
    } else if (metricType === 'currency') {
        //round to 2 decimal places, add a dollar sign
        metricValue.innerHTML = '$' + Math.round(value * 100) / 100;
    } else if (metricType === 'date') {
        //format the date
        metricValue.innerHTML = value.toLocaleDateString();
    }
}

//start of function getTableData
// for each .viz-tableau block, get the summary data from the sheet and add it to the DOM
function getTableData() {
    vizList.forEach(vizBlock => {
        const vizContainer = vizBlock.vizContainer;
        const viz = vizBlock.viz;
        const vizTableBlock = vizContainer.parentNode;
        const parentBlock = vizContainer.closest('.viz_tableau');
        const config = {
            ...parentBlock.dataset
        };
        const skipcols = config.skipcols;
        const tableheaders = config.tableheaders.split(',').map(element => element.trim());

        const options = {
            maxRows: 0,
            ignoreAliases: false,
            ignoreSelection: true,
        };

        viz.getWorkbook().getActiveSheet().getSummaryDataAsync(options)
            .then(function(dataTable) {
                const table = vizTableBlock.querySelector('.table-data');
                const data = dataTable.getData();

                // Create table header row
                const tr = document.createElement("tr");
                if (tableheaders.length > 0) {
                    tableheaders.forEach(function(header) {
                        const th = document.createElement("th");
                        th.innerHTML = header;
                        tr.appendChild(th);
                    });
                } else {
                    const columns = dataTable.getColumns();
                    const filteredColumns = columns.filter((column, i) => !skipcols.includes(i));
                    filteredColumns.forEach(function(column) {
                        const th = document.createElement("th");
                        th.innerHTML = column.getFieldName();
                        tr.appendChild(th);
                    });
                }
                // Clear the table and append the header row
                table.innerHTML = "";
                table.appendChild(tr);

                // Add data rows
                const filteredData = data.filter(row => !row.some(cell => cell.value === "null"));
                filteredData.forEach(function(row) {
                    const tr = document.createElement("tr");
                    const filteredRow = row.filter((cell, j) => !skipcols.includes(j));
                    filteredRow.forEach(function(cell) {
                        const td = document.createElement("td");
                        td.innerHTML = cell.formattedValue;
                        tr.appendChild(td);
                    });
                    table.appendChild(tr);
                });

                if (data.length === 0) {
                    const tr = document.createElement("tr");
                    const td = document.createElement("td");
                    td.innerHTML = "No data";
                    tr.appendChild(td);
                    table.appendChild(tr);
                }
            })
            .otherwise(function(error) {
                console.log("error getting table data ", error);
            });
    });
}



//create an html button that has the parent div data-buttontext as the text and add the resetButton event listener
//right now this is only working with a single reset button, need to make it work with multiple buttons

function addButtons() {
    const buttonDivs = document.querySelectorAll(".block-componentbuttons-tableau .buttons_tableau");
    const reset = true;
    buttonDivs.forEach(buttonDiv => {
        const button = document.createElement('button');
        if (reset) {
            button.id = 'reset-button';
        }
        button.classList.add('button');
        button.textContent = buttonDiv.dataset.buttontext;
        buttonDiv.appendChild(button);
        //find all the worksheets in the document and clear the filter
        button.addEventListener("click", function() {
            //get all the vizs on the page
            tableau.VizManager.getVizs().forEach(viz => {
                //revert the viz to the last saved state and then get the data, may want to do this differently 
                viz.revertAllAsync().then(function() {
                    //console.log(viz, " reverted to last saved state.");
                });
            });
            //set the radio buttons to the first value
            const radioButtons = document.querySelectorAll("input[type='radio']");
            let firstButton = true;
            radioButtons.forEach(radioButton => {
                radioButton.checked = firstButton;
                firstButton = false;
            });
            //set the dropdowns to the first value
            const dropdowns = document.querySelectorAll("select");
            dropdowns.forEach(dropdown => {
                dropdown.selectedIndex = 0;
            });
            Drupal.announce("all filters reset");
            console.log("all filters reset");
            getMetricData();
            getTableData();
            //make sure focus is on the reset button, look for other places where focus needs to be set
            button.focus();
        });
    });
}

function createVizContainer(vizname) {
    const vizContainer = document.createElement('div');
    vizContainer.id = makeId(vizname) + '-viz';
    vizContainer.style.width = '100%';
    vizContainer.style.height = '600px';
    vizContainer.setAttribute('aria-hidden', 'true');
    return vizContainer;
}

function createVizOptions(resetButton) {
    return {
        hideTabs: true,
        hideToolbar: true,
        onFirstInteractive: function() {
            console.log("Worksheet initialized. ");
            resetButton.click();
        }
    };
}

function createTableauViz(vizContainer, vizUrl, vizOptions) {
    return new tableau.Viz(vizContainer, vizUrl, vizOptions);
}

function createTableData(vizname, vizdescription) {
    const tableData = document.createElement('div');
    tableData.setAttribute('aria-hidden', 'false');
    tableData.id = makeId(vizname) + '-tabledata';

    const table = document.createElement('table');
    table.classList.add('table-data', 'draggable-table');

    const caption = document.createElement('caption');
    caption.textContent = vizdescription;
    table.appendChild(caption);

    tableData.appendChild(table);
    return tableData;
}

function initVizs() {
    const vizBlocks = document.querySelectorAll(".block-componentviz-tableau .viz_tableau");
    console.log("Printing vizBlocks");
    console.log(vizBlocks);
    vizBlocks.forEach(vBlock => {
        const config = {
            ...vBlock.dataset
        };
        const vizUrl = config.vizurl;
        console.log("vizUrl ", vizUrl);

        const vizContainer = createVizContainer(config.vizname);
        const resetButton = document.getElementById('reset-button');
        const vizOptions = createVizOptions(resetButton);

        const viz = createTableauViz(vizContainer, vizUrl, vizOptions);
        vBlock.appendChild(vizContainer);
        vizList.push({
            viz,
            vizContainer
        });

        const tableData = createTableData(config.vizname, config.vizdescription);
        vBlock.appendChild(tableData);
    });
}

/* for each .block-componentmetric element on the the page, create a div to hold the viz and add it to the DOM with .hide() 
  initialize the viz with the config.vizurl and return a list of viz metric objects */
function initMetrics() {
    const metricBlocks = document.querySelectorAll(".block-componentmetric-tableau .metric_tableau");
    metricBlocks.forEach(metricBlock => {
        const config = {
            ...metricBlock.dataset
        };
        const vizUrl = config.vizurl;
        const vizContainer = document.createElement('div');
        vizContainer.id = makeId(config.vizname) + '-metric';
        vizContainer.style.width = '50%';
        vizContainer.setAttribute('aria-hidden', 'true');
        const vizOptions = {
            hideTabs: true,
            hideToolbar: true,
            onFirstInteractive: function() {
                console.log("Metric initialized. ");
            }
        };
        const viz = new tableau.Viz(vizContainer, vizUrl, vizOptions);
        console.log(viz);
        metricBlock.appendChild(vizContainer);
        viz.hide();
        metricList.push({
            viz,
            vizContainer
        }); // not used
        /*create a div that is a child to the metricBlock to hold the metric value that is retrieved in getMetricData
        in plain text and visible to screen readers */
        const metricValue = document.createElement('div');
        metricValue.style.fontSize = '2rem';
        /* add a metricValue class to the div and then
        use that to select the divs in getMetricData */
        metricValue.id = makeId(config.vizname) + '-metric-value';
        metricValue.classList.add('metric-value');
        metricValue.setAttribute('aria-hidden', 'false');
        metricBlock.appendChild(metricValue);
    });
}

function createFilterContainer(filterName) {
  const filterContainer = document.createElement('div');
  filterContainer.id = makeId(filterName) + '-filter';
  return filterContainer;
}

function createFieldset() {
  return document.createElement('fieldset');
}

function createLegend(filterTitle) {
  const legend = document.createElement('legend');
  legend.innerHTML = filterTitle;
  return legend;
}

/* for each .block-componentfilter-tableau 
add the radio buttons to the DOM for that element .block-componentfilter-tableau div.block__content .filter_tableau
right now this is only allowing one value per event listener ... will need to think about multiple */
function addFilterRadios() {
    console.log("::Inside add filter radios::");
    const filterBlocks = document.querySelectorAll(".block-componentfilter-tableau .filter_tableau");
    filterBlocks.forEach(filterBlock => {
        console.log("hello i am in filter block");
        console.log(filterBlock);
        const config = {
            ...filterBlock.dataset
        };
        const paramFilter = config.paramfilter;
        const filterName = config.internalname;
        const controlType = config.controltype;
        const filterVals = config.filtervalues.split(',').map(element => element.trim());
        const filterContainer = createFilterContainer(filterName);
        const fieldset = createFieldset();
        const legend = createLegend(config.displaytitle);
        fieldset.appendChild(legend);
        filterBlock.appendChild(fieldset);
        //if controlType is dropdown, add a select element else add radio buttons
        if (controlType === 'dropdown') {
            const select = document.createElement('select');
            select.name = filterName;
            select.title = filterName;
            fieldset.appendChild(select);
            //add an option element inside the select for each filterVal
            const selectFragment = document.createDocumentFragment();
            filterVals.forEach(filterVal => {
                const option = document.createElement('option');
                option.value = filterVal;
                option.innerHTML = filterVal;
                selectFragment.appendChild(option);
            });
            select.appendChild(selectFragment);
            if (paramFilter === 'filter') {
                //add an eventListener to the select that calls applyFilterAsync
                select.addEventListener('change', function(event) {
                    tableau.VizManager.getVizs().forEach(viz => {
                        const sheet = viz.getWorkbook().getActiveSheet();
                        if (event.target.value === '(All)') {
                            sheet.clearFilterAsync(filterName);
                        } else {
                            sheet.applyFilterAsync(filterName, event.target.value, tableau.FilterUpdateType.REPLACE);
                        }
                        Drupal.announce(Drupal.t('Filter applied: @filterName = @filterVal', {
                            '@filterName': filterName,
                            '@filterVal': event.target.value
                        }), 'assertive');
                        console.log("filter applied: ", filterName, event.target.value);
                    });
                    getTableData();
                });
            } else if (paramFilter === 'parameter') {
                //add an eventListener to the select, event.target.value is the menu selection
                select.addEventListener('change', function(event) {
                    tableau.VizManager.getVizs().forEach(viz => {
                        const workbook = viz.getWorkbook();
                        workbook.changeParameterValueAsync(filterName, event.target.value);
                    });
                    Drupal.announce(Drupal.t('Filter applied: @filterName = @filterVal', {
                        '@filterName': filterName,
                        '@filterVal': event.target.value
                    }), 'assertive');
                    console.log("filter applied: ", filterName, event.target.value);
                    getMetricData();
                    getTableData();
                });
            }
        } else {
            //add a radio button inside a div for each filterVal 
            filterVals.forEach(filterVal => {
                const par = document.createElement('br');
                const label = document.createElement('label');
                const input = document.createElement('input');
                input.type = controlType;
                input.name = filterName;
                input.value = filterVal;
                //add room between the radio buttons and label
                input.style.marginRight = '.3em';
                input.style.marginBottom = '.3em';
                //for the first radio button, set it to checked
                if (filterVal === filterVals[0]) {
                    input.checked = true;
                }
                /*if paramFilter equals 'filter' then addEventListener that applyFilterAsync, 
                if paramFilter equals 'param' then addEventListener that setParameterValueAsync */
                if (paramFilter === 'filter') {
                    input.addEventListener('change', function() {
                        //for each sheet in the sheetList, apply the filter, 
                        //then pass the sheet and the vizBlock for that sheet to getTableData
                        tableau.VizManager.getVizs().forEach(viz => {
                            viz.getWorkbook().getActiveSheet()
                                .applyFilterAsync(filterName, filterVal, tableau.FilterUpdateType.REPLACE)
                        });
                        //announce the filter applied
                        Drupal.announce(Drupal.t('Filter applied: @filterName = @filterVal', {
                            '@filterName': filterName,
                            '@filterVal': event.target.value
                        }), 'assertive');
                        getTableData();
                    });
                } else if (paramFilter === 'parameter') {
                    input.addEventListener('change', function() {
                        tableau.VizManager.getVizs().forEach(viz => {
                            //for parameter filters, use the workbook not the sheet
                            viz.getWorkbook()
                                .changeParameterValueAsync(filterName, filterVal);
                            //tech debt: do I need to move this out of the forEach loop?
                            getMetricData();
                            getTableData();
                        });
                        Drupal.announce(Drupal.t('Filter applied: @filterName = @filterVal', {
                            '@filterName': filterName,
                            '@filterVal': event.target.value
                        }), 'assertive');
                        console.log("filter applied: ", filterName, event.target.value);
                    });
                }
                label.appendChild(input);
                label.appendChild(document.createTextNode(filterVal));
                fieldset.appendChild(label);
                fieldset.appendChild(par);
            });
        }
        filterContainer.appendChild(fieldset);
        filterBlock.appendChild(filterContainer);
    });
}
//end of addFilterRadios

/* for each metric block, extract the value of the first row of the summary data and add it to the DOM
for each metric block, add an event listener that calls getMetricData when the sheet is changed */
function getMetricData() {
    metricList.forEach(metric => {
        const viz = metric.viz;
        const vizContainer = metric.vizContainer;
        const vizBlock = vizContainer.parentNode;
        const config = {
            ...vizBlock.dataset
        };
        const colnum = config.column;
        const options = {
            maxRows: 1, // Max rows to return. Use 0 to return all rows
            ignoreAliases: false,
            ignoreSelection: true,
        };
        dataTable = viz.getWorkbook().getActiveSheet().getSummaryDataAsync(options)
            .then(function(dataTable) {
                const value = dataTable.getData()[0][config.column].value;
                formatMetricValue(value, vizBlock);
            })
            .otherwise(function(error) {
                console.log("error getting metric data ", error);
            });
    });
    return;
}


addButtons();
initVizs();
initMetrics();
addFilterRadios();