(function (ns) {
    /*    
    Everything in this file is specific to the dataTool popup.
    This file was very much done last minute, and needs extensive refactoring if not a redo. Could serve as a general framework layout though.
    One of the plotted values also disappears when changing the x parameter, due to a bad merge.
    TODO: Most of the functions are inefficient, as they create and recreate lots of UIBinding functionality without storing it.
    The performance hit isn't really noticeable, but this could definitely be optimized.
    */

    /*
    Initializes the dataToolContainer in domain with default plots and tables for every track.
    Called by main entry function.
    */
    ns.initializeDataToolViews = function () {

        //Set default track view
        var defaultTrackName = getDefaultTrack().getData().name;

        ns.trackerDataInstance.dataToolContainer.setData('selectedView', defaultTrackName);//trackName could be undefined at this point

        var tracks = ns.trackerDataInstance.tracksContainer.getTracks();

        for (var track in tracks) {//For every currently existing trackin the trackerDataInstance

            var trackName = tracks[track].getData().name;

            //Pass in plot index--TODO: Since we're not parsing the xml for this feature, this must be the first plot
            var defaultXPlotInstance = createDefaultPlot(0);
            var defaultYPlotInstance = createDefaultPlot(0);
            defaultYPlotInstance.setData('yAxisName', 'y');
            var defaultTableInstance = createDefaultTable();

            ns.trackerDataInstance.dataToolContainer.addTrackView(trackName);
            //Give each track the default plot (t, x) and (t, y) and default table (t, x, y)
            ns.trackerDataInstance.dataToolContainer.getTrackView(trackName).addPlot(defaultXPlotInstance);
            ns.trackerDataInstance.dataToolContainer.getTrackView(trackName).addPlot(defaultYPlotInstance);
            ns.trackerDataInstance.dataToolContainer.getTrackView(trackName).setTable(defaultTableInstance);
        }
    }

    //Launches data tool in a new window
    ns.launchDataTool = function () {//TODO: change this so the dialog isn't repopulated every time

        var dataTool = $('#dataToolPopup');
        var window = $('#trackerWindow');

        dataTool.dialog({
            width: window.width() - 20,
            height: window.height() - 20,
            minHeight: '1000',
            minWidth: '700',
            close: function (event, ui) {
                $('#dataToolPopup').html('');
            },
        });
        populateDataTool();
    }

    /* 
    Populates the blank dataTool dialog with all the information it needs initially.
    Also called on track change to repopulate data according to the currently selected track.
    */
    populateDataTool = function () {

        var windowViewDOM = $('#dataToolPopup').html(//TODO: This should be on the html page
        '<div class="titleBar ui-widget-header"></div>' +
        '<div id="dataToolInformationDisplay"></div>' +
        '<div id="xParamDropdown"></div>' +
        '<div id="dataToolPlotContainer"></div>' +
        '<div id="dataToolTableContainer"></div>'
        );//Prepare window for new contents

        var dataToolContainer = ns.trackerDataInstance.dataToolContainer;

        var currentTrackName = dataToolContainer.getData().selectedView;//Get currently selected track

        if (typeof currentTrackName === 'undefined') {//if there are no tracks, error message will launch and overall dialog will remain blank
            ns.launchErrorDialog("No tracks present", "No tracks found.");
            return;
        }

        //Generate tracks dropdown and append it to dataTool
        generateTracksDropdown();

        generateInitialParamsMenu();

        drawPlotsOfSelectedTrack();

        drawTableOfSelectedTrack();

    }

    /*
   Populates the track dropdown, and assigns the value to be the selected dataToolview.
   */
    var generateTracksDropdown = function () {

        var windowToUpdate = $('#dataToolPopup');

        //Handlebars templating
        var tracksTemplate = $(ns.dataPaths.tracksDropdownTemplateSelector).html();
        var templateFunc = Handlebars.compile(tracksTemplate);
        var tracksObj = {};
        tracksObj.parameters = {};
        var tracks = ns.trackerDataInstance.tracksContainer.getTracks();
        for (var track in tracks) {//Add track names to templating object
            var trackName = tracks[track].getData().name;
            tracksObj.parameters[trackName] = trackName;
        }
        var tracksTemplatehtml = templateFunc(tracksObj);
        tracksTemplatehtml = $(tracksTemplatehtml);
        tracksTemplatehtml.attr('id', 'dataToolTracksSelect');

        //Set value in dropdown to match selected view
        tracksTemplatehtml.val(ns.trackerDataInstance.dataToolContainer.getData().selectedView);

        windowToUpdate.find('.titleBar').append(tracksTemplatehtml);//Append template values to html body
    }


    /* Data collection and formatting. */

    var drawPlotsOfSelectedTrack = function () {

        var dataToolContainer = ns.trackerDataInstance.dataToolContainer;

        var windowViewDOM = $('#dataToolPopup');

        var currentTrackName = dataToolContainer.getData().selectedView;

        windowViewDOM.find('#dataToolPlotContainer').html('');

        //Grab all of the plots for the selected view
        var plotsArr = dataToolContainer.getTrackView(currentTrackName).getData().plots;

        //If there are multiple plots, we need to combine them into arrays of arrays of arrays of x, y, index values
        if (plotsArr.length > 1) {
            var plotsData = [];

            for (var index = 0; index < plotsArr.length; index++) {
                var plotData = ns.getFormattedPlotValues(plotsArr[index].getData(), currentTrackName)
                plotsData.push(plotData);

            }
        }
        else {//Otherwise we just convert the plot instance data into the appropriate array of arrays of x, y, index values format
            var plotsData = [ns.getFormattedPlotValues(plotsArr[0].getData(), currentTrackName)];
        }

        drawPlot(plotsData, plotsArr);//Pass in array of plot instances
    }

    /* Template to generate x parameter dropdown menu. */
    var generateInitialParamsMenu = function () {

        var windowViewDOM = $('#dataToolPopup');

        var trackName = ns.trackerDataInstance.dataToolContainer.getData().selectedView;

        var track = ns.trackerDataInstance.dataToolContainer.getTrackView(trackName);

        var plots = ns.trackerDataInstance.dataToolContainer.getTrackView(trackName).getData().plots;

        //Handlebars templating for x axis dropdown
        var xParamTemplate = $(ns.dataPaths.dataToolXParameterTemplateSelector).html();
        var templateFunc = Handlebars.compile(xParamTemplate);
        var xAxisParamsObj = {};
        xAxisParamsObj.parameters = ns.axisDropdownMenu;
        var xParamsTemplatehtml = templateFunc(xAxisParamsObj);
        xParamsTemplatehtml = $(xParamsTemplatehtml);
        windowViewDOM.find('.titleBar').append(xParamsTemplatehtml);

        xParamsTemplatehtml.attr('id', 'dataToolXParam');

        var currentVal = track.getData().xAxisName;

        windowViewDOM.find('#dataToolXParam').find('select').val(currentVal);//TODO: For now, the x axis will be the same across plots
        $('button').button();
    }

    var drawTableOfSelectedTrack = function () {

        var trackName = ns.trackerDataInstance.dataToolContainer.getData().selectedView;

        var tableInstance = ns.trackerDataInstance.dataToolContainer.getTrackView(trackName).getData().table;

        createTable(tableInstance);

    }

    //TODO
    var calculateSlope = function (previousPointX, currentPointX, nextPointX, previousPointY, currentPointY, nextPointY) {

            return "Slope calculation error. "
    }


    /*
    Generates the table popup.
    This is similar to the generateTablePopup function in UIBinder, but it has important differences due to the different context.
    */
    var generateTablePopup = function (thisInstance) {

        //Object specifying the new values that will be contained in the table
        var selectedTableValues = [];

        var windowViewDOM = $('#dataToolTable');
        var windowInstance = windowViewDOM.data()

        var windowName = "Parameter Options";//Window name to be displayed in popup
        var currentTableInstance = windowInstance.tableInstance//Current table domain object

        //Handlebars templating to create the popup
        var template = $(ns.dataPaths.mathTablesPopupTemplateSelector).html();
        var templateFunc = Handlebars.compile(template);
        var mathOptionsObj = {};
        mathOptionsObj.parameters = ns.axisDropdownMenu;
        var html = templateFunc(mathOptionsObj);
        html = $(html);
        $('#dataToolPopup').append(html);//Append template values to html body

        //Grab the values currently displayed in the table and mark them as checked in the popup       
        var currentlyDisplayedArr = windowInstance.tableInstance.getData();
        for (var index = 0; index < currentlyDisplayedArr.length; index++) {
            var currentColumnHeader = currentlyDisplayedArr[index];
            $('#' + currentColumnHeader).prop('checked', true);
        }

        //Style options as jquery toggle buttons
        $(".check").parent().buttonset();

        //Dialogue box options
        var button = html.dialog({
            resizable: true,
            height: '600',
            width: '370',
            minHeight: '600',
            minWidth: '370',
            modal: true,
            closeOnEscape: true,
            title: windowName,
            buttons: {
                Save: function () {
                    $('input:checked').each(function () {
                        selectedTableValues.push(this.id);
                    });
                    $(this).dialog("close");
                    updateTableParameters(selectedTableValues);
                    updatePlotParameters(selectedTableValues);
                },
                Cancel: function () {
                    $(this).dialog("close");
                    return "";
                },
            },
            close: function (event, ui) {
                $('input:checked', this).prop('checked', false);//Uncheck all options to avoid any carry-over
                $(this).remove();//Always remove popup instance, else they will stack up on the page
            }
        });
    };

    //Given a change in table parameters, this destroys the current table and creates a new one with updated params
    var updateTableParameters = function (selectedTableValues) {

        var currentTrackName = ns.trackerDataInstance.dataToolContainer.getData().selectedView;

        var tableInstance = new ns.domain.tableObject(selectedTableValues);

        ns.trackerDataInstance.dataToolContainer.getTrackView(currentTrackName).setTable(tableInstance);//Replaces current table instance

        createTable(tableInstance)
    };

    var updatePlotParameters = function (selectedTableValues) {

        var track = getCurrentTrack();

        var plots = track.getData().plots;

        for (var index = 0; index < selectedTableValues.length; index++) {

            var newPlot = createDefaultPlot(index);

            newPlot.setData('yAxisName', selectedTableValues[index])

            track.replacePlot(newPlot);
        };

        if (selectedTableValues.length < plots.length) {//Remove any additional plots held over in selected object
            var difference = plots.length - selectedTableValues.length;
            for (var index = plots.length; index < difference; index++) {
                track.removePlot(index);
            }
        }

        if (selectedTableValues.length === 0) {
            //TODO:Should handle if no values are selected
        }
        populateDataTool();
    }


    /* UIbinding/drawing functions. */
    //Expects this format: [[[1,2],[1,2]], [[3, 4], [4, 5]]]
    //This form of the function is designed to handle arrays of arrays of arrays of x, y, frame values in the same plot
    //Draws the data in the given dataset into the display area of windowToUpdate
    var drawPlot = function (dataSet, plotInstancesArr) {

        var windowViewDOM = $('#dataToolPopup');//Prepare window for new content

        //Add general identifier for a plot container
        var plotDiv = $('#dataToolPlotContainer');

        var trackName = ns.trackerDataInstance.dataToolContainer.getData().selectedView;

        //Get color so that it matches its track
        var trackFootprint = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName).getData().footprintData;
        var trackColor = ns.formatRGBAColor(trackFootprint.red, trackFootprint.green, trackFootprint.blue, trackFootprint.alpha);

        var axisLabels = {
            xValue: 't',
            yValue: 'x',
        };

        //TODO: Precision could be very easily determined dynamically or from user specifications by replacing the 3,
        //we decided not to because going to more than three digits of precision tends to clutter the page
        var precision = '%#.' + 3 + 'f';

        var plot = $(plotDiv).jqplot(dataSet, {
            //title: trackName,//adds a title immediately prior to plot--seems unneccesary since the track and window name are already right there
            sortData: false,        //wether or not to sort the data so that it changes from the order in which it was passed in           
            seriesColors: $.merge(["#55A9D3", "#D4EDE2", "#EA2E49"], $.jqplot.config.defaultColors),//[trackColor],//Specifies color of charted line, currently linked to the track information
            axesDefaults: {
                show: false,    // whether or not to renderer the axis.  Determined automatically.
                min: null,      // minimum numerical value of the axis.  Determined automatically.
                max: null,      // maximum numverical value of the axis.  Determined automatically.
                pad: 1.2,       // a factor multiplied by the data range so that data points don't fall on the edges of the axis.
                ticks: [],      // array of ticks to use.  Computed automatically.
                numberTicks: undefined,
                renderer: $.jqplot.LinearAxisRenderer,  // renderer to use to draw the axis,
                rendererOptions: {},    // options to pass to the renderer.  LinearAxisRenderer
                showTicks: true,        // whether or not to show the tick labels,
                showTickMarks: true,    // whether or not to show the tick marks
                tickRenderer: $.jqplot.CanvasAxisTickRenderer,
                tickOptions: {
                    mark: 'cross',    // Where to put the tick mark on the axis: 'outside', 'inside' or 'cross',
                    showMark: true,
                    showGridline: true, // whether to draw a gridline (across the whole grid) at this tick,
                    markSize: 4,        // length the tick will extend beyond the grid in pixels.  For 'cross', length will be added above and below the grid boundary,
                    show: true,         // whether to show the tick (mark and label),
                    showLabel: true,    // whether to show the text label at the tick,
                    formatString: precision,   // format string to use with the axis tick formatter
                },

            },
            axes: {
                xaxis: {
                    show: true,
                    label: "<div class='plotAxisCurrentlyDisplayingX dataToolAxisLabel'>" + axisLabels.xValue + "</div>",
                    tickOptions: { formatString: '%.2g', angle: -30, },//Specifies formatting of axis labels
                },
                yaxis: {
                    show: true,
                    label: "<div class='plotAxisCurrentlyDisplayingY dataToolAxisLabel'>" + axisLabels.yValue + "</div>",
                    tickOptions: { formatString: '%.2g' },//Specifies formatting of axis labels
                }
            },
            highlighter: {
                show: true,
                showTooltip: true,
                sizeAdjust: 10,//adjust displayed point highlight size
                useAxesFormatters: false, //Changes formatting of tooltip--currently does not use scientific notation
                //tooltipFormatString: precision, //Configured using determinePrecision to alter the precision dynamically
                formatString: '<table class="jqplot-highlighter">' +
                    '<tr><td>x:</td><td>' + precision + '</td></tr>' +
                    '<tr><td>y:</td><td>' + precision + '</td></tr>' +
                    '</table>'
            },
            //Cursor styling handled in css
            cursor: {
                show: true,
                tooltipLocation: 'nw',//northwest
                useAxesFormatters: false, // use the same format string and formatters as used in the axes to
                formatString: precision,
                zoom: true,
            },
            grid: {
                drawGridLines: true,
                gridLineWidth: 2.0,
                gridLineColor: '#0f1c2c',    // *Color of the grid lines.
                background: '#fbfbfb',      // CSS color spec for background color of grid.
                borderColor: '#ffffff',     // CSS color spec for border around grid.
                borderWidth: 2.0,           // pixel width of border around grid.
                shadow: true,               // draw a shadow for grid.
                shadowAngle: 45,            // angle of the shadow.  Clockwise from x axis.
                shadowOffset: 1.5,          // offset from the line of the shadow.
                shadowWidth: 3,             // width of the stroke for the shadow.
                shadowDepth: 3,             // Number of strokes to make when drawing shadow.
                // Each stroke offset by shadowOffset from the last.
                shadowAlpha: 0.07,         // Opacity of the shadow
                renderer: $.jqplot.CanvasGridRenderer,  // renderer to use to draw the grid.
                rendererOptions: {}         // options to pass to the renderer.  Note, the default
            },
        });

        //Stores plot instance in the window to which the plot is being drawn:
        //$(plotDiv).data("plotInstance", plotInstance);
        $(plotDiv).data("plotInstance", plotInstancesArr);
    };

    /* Creates initial table, and is used when a new table is generated. */
    createTable = function (tableInstance) {

        var windowContainer = $('#dataToolPopup')
        var trackName = ns.trackerDataInstance.dataToolContainer.getData().selectedView;
        $('#dataToolTableContainer').empty();
        windowContainer.find('#tableOptionsButton').remove();//Prepare area for new content

        //Prepare object for handlebars templating
        var tableObject = {};
        //var columnParams = tableInstance.getData();
        tableObject.columnHeaders = tableInstance.getData();

        tableObject.dataSet = ns.getTableDataSet(tableObject.columnHeaders, trackName);

        var id = 'dataToolTable';

        tableObject.id = id;

        //Add the table options popup menu to select data for the table
        var button = $("<button>");

        button.attr('id', 'tableOptionsButton');
        button.attr('class', 'tableOptionsButton');

        button.text("Parameter Options");

        $('.titleBar', windowContainer).append(button);

        //Makes the button pretty
        button.button();

        var tempTemplate = $("#trackTableTemplate").html();

        var templateFunc = Handlebars.compile(tempTemplate);

        var html = templateFunc(tableObject);

        $('#dataToolTableContainer').append(html);

        var tableHTMLElement = $("#" + tableObject.id).addClass('trackViewTable');

        var DataTable = tableHTMLElement.dataTable({
            // 'bJQueryUI': true,
            "bFilter": false,           //Turns off search bar
            "sScrollY": "1px",          //Minimizes scroll height to be reset later
            "bWidthAuto": true,         //Enables width == container width
            "bPaginate": false,         //Turns off pagination
            "sScrollX": "100%",
            //"sScrollXInner": "120%",
            "bScrollCollapse": true,
            "bInfo": false,             //Turns off superfluous information about data set
            "bDestroy": true,
            //This callback is fired every time the table is drawn--sets height to desired level 
            "fnDrawCallback": function () {
                var divHeight = $("div.dataTables_wrapper", windowContainer).height();

                var containerHeight = $(".displayArea", windowContainer).height();

                //var tableHeight = containerHeight - divHeight;
                var tableHeight = $('#dataToolPlotContainer').height()
                $("div.dataTables_scrollBody", windowContainer).height(tableHeight);
            },
        });

        tableHTMLElement.data({
            "tableInstance": tableInstance,
            'dataTableInstance': DataTable
        });
    };

    var drawPointHighlighter = function (pointColor, pointX, pointY, radius, drawingCanvas) {

        var context = drawingCanvas.getContext('2d');
        ////context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); //plot.replot();            
        context.fillStyle = pointColor;
        context.strokeStyle = 'none';
        context.beginPath();
        context.arc(pointX, pointY, radius, 0, Math.PI * 2, true);
        context.closePath();
        context.stroke();
        context.fill();
    }



    /* Utility functions */

    /* Gets the first track in the tracker data instance for the first time the tool loads. */
    var getDefaultTrack = function () {

        var tracks = ns.trackerDataInstance.tracksContainer.getTracks();

        if (Object.size(tracks) === 0) {//make sure the file has tracks
            return undefined;
        }

        for (var track in tracks) {
            var defaultTrack = tracks[track];
            break;
        }
        return defaultTrack;
    }

    /* Create default domain plot object. */
    var createDefaultPlot = function (plotIndex) {

        var xAxisName = 't';
        var yAxisName = 'x';
        var plotOptions = {
            lines: true,
            points: false,
        }
        visibility = 'true';

        var defaultPlotInstance = new ns.domain.plotObject(plotIndex, xAxisName, yAxisName, plotOptions, visibility)

        return defaultPlotInstance;
    }

    /* Create default domain table object. */
    var createDefaultTable = function () {
        var arrayOfColumnNames = ['t', 'x', 'y'];

        return new ns.domain.tableObject(arrayOfColumnNames);
    }

    var getCurrentTrackName = function () {
        return ns.trackerDataInstance.dataToolContainer.getData().selectedView;
    }

    var getCurrentTrack = function () {
        return ns.trackerDataInstance.dataToolContainer.getTrackView(getCurrentTrackName());
    }


    var handleXParamChange = function (newXAxisName) {

        var trackName = getCurrentTrackName();

        var currentTrack = ns.trackerDataInstance.dataToolContainer.getTrackView(trackName);

        currentTrack.setData('xAxisName', newXAxisName);

        var plots = currentTrack.getData().plots;

        for (var plot in plots) {//Replace each plot with a new x parameter

            plots[plot].setData('xAxisName', newXAxisName);

            currentTrack.replacePlot(plots[plot]);
        }

    }


    /* Data tool event handlers*/
    $('#dataToolPopup').on('dialogresizestop', function () {//Resizes plot after drag
        $('.jqplot-target').each(function () {
            $.data(this, "jqplot").replot({ resetAxes: true });
        })
    }).on('jqplotDataClick', '#dataToolPlotContainer', function (ev, seriesIndex, pointIndex, dataPoints) {//TODO refactor into methods

        var plotTarget = $('#dataToolPopup').find(".jqplot-target");

        var drawingCanvas = plotTarget.find(".jqplot-highlight-canvas")[0];
        var context = drawingCanvas.getContext('2d');
        context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); //plot.replot();  
        //jqplotDataClick

        radius = 8;
        var jqPlotInstance = plotTarget.data("jqplot");
        var pointX = jqPlotInstance.axes.xaxis.series_u2p(dataPoints[0]);
        var pointY = jqPlotInstance.axes.yaxis.series_u2p(dataPoints[1]);

        var pointXSlopeInfo = jqPlotInstance.data[seriesIndex][pointIndex][0];
        var pointYSlopeInfo = jqPlotInstance.data[seriesIndex][pointIndex][1];

        var pointCoords = jqPlotInstance.data[seriesIndex][pointIndex];
        var pointColor = jqPlotInstance.seriesColors[seriesIndex];//Color is in hex format

        drawPointHighlighter(pointColor, pointX, pointY, radius, drawingCanvas)
        
        if (typeof jqPlotInstance.data[seriesIndex][pointIndex - 1] !== 'undefined') {
            var previousPoint = jqPlotInstance.data[seriesIndex][pointIndex - 1]

            var previousPointXScaled = jqPlotInstance.axes.xaxis.series_u2p(previousPoint[0])
            var previousPointYScaled = jqPlotInstance.axes.yaxis.series_u2p(previousPoint[1])

            var previousXSlopeInfo = jqPlotInstance.data[seriesIndex][pointIndex - 1][0]
            var previousYSlopeInfo = jqPlotInstance.data[seriesIndex][pointIndex - 1][1]

            drawPointHighlighter(pointColor, previousPointXScaled, previousPointYScaled, radius, drawingCanvas)
        }
        if (typeof jqPlotInstance.data[seriesIndex][pointIndex + 1] !== 'undefined') {
            var nextPoint = jqPlotInstance.data[seriesIndex][pointIndex + 1]

            var nextPointXScaled = jqPlotInstance.axes.xaxis.series_u2p(nextPoint[0])
            var nextPointYScaled = jqPlotInstance.axes.yaxis.series_u2p(nextPoint[1])

            var nextXSlopeInfo = jqPlotInstance.data[seriesIndex][pointIndex + 1][0]
            var nextYSlopeInfo = jqPlotInstance.data[seriesIndex][pointIndex + 1][1]

            drawPointHighlighter(pointColor, nextPointXScaled, nextPointYScaled, radius, drawingCanvas)
        }

        var slope = calculateSlope(previousXSlopeInfo, pointXSlopeInfo, nextXSlopeInfo, previousYSlopeInfo, pointYSlopeInfo, nextYSlopeInfo);

        var currentPlotClickedYParam = plotTarget.data().plotInstance[seriesIndex].getData().yAxisName;


        $('.plotAxisCurrentlyDisplayingY').text(currentPlotClickedYParam);

        $('#dataToolInformationDisplay').text('slope' + slope);


    }).on('click', '#tableOptionsButton', function () {

        generateTablePopup(this);//TODO

    }).on('change', '#dataToolTracksSelect', function (incomingTrack) {//TODO

        ns.trackerDataInstance.dataToolContainer.setData('selectedView', $(this).val());

        populateDataTool();
    }).on('change', '#dataToolXParam', function () {

        var newXAxisName = $(this).find('select').val()

        handleXParamChange(newXAxisName);

        populateDataTool();

        $('#dataToolPopup').find('.plotAxisCurrentlyDisplayingX').text(newXAxisName);//Change plot label to match new axis parameter
    });




})(ed);
