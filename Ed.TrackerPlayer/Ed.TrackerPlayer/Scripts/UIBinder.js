(function (ns) {
    /* This file is responsible for constructing all visual elements based off domain objects. */

    /*
    This is used every time a plot is drawn or re-drawn. 
    It ensures styling such that the buttons to change the axis values
    are always on the top layer so they can be selected. 
    */
    $.jqplot.postDrawHooks.push(function () {
        var zMaxLayer = 0;
        $(this.target).children().each(function () {
            var index_current = parseInt($(this).css("zIndex"), 10);
            if (index_current > zMaxLayer) {
                zMaxLayer = index_current;
            }
        });
        $('.jqplot-xaxis-label').css({ "z-index": zMaxLayer + 1 });
        $('.jqplot-yaxis-label').css({ "z-index": zMaxLayer + 1 });

        //Re-styles the buttons according to the css specs
        $("button", this.target).button();

        ns.reHighlightDataPoints();
    });

    /* General method to rehighlight plot points. Useful for after switching plots in a window, adding new plots, etc. */
    ns.reHighlightDataPoints = function () {
        var currentFrameNumber = $(".scrub:visible").index();

        if (currentFrameNumber === -1) {
            highlightPlotDataPoint(0);//If it can't figure out the current frame, highlight the first plot point
            return;
        }
        else {
            var videoInstanceData = ns.trackerDataInstance.getVideoObjectLiteral();

            var pointIndex = (currentFrameNumber - videoInstanceData.startFrame) / videoInstanceData.stepSize;

            highlightPlotDataPoint(currentFrameNumber);
        }
    };

    //Expects this format: [[1,2],[1,2]]
    //Draws the data in the given dataset into the display area of windowToUpdate
    var drawPlot = function (plotInstance, trackName, windowToUpdate) {

        var plotData = plotInstance.getData();

        //Get color so that it matches its track
        var trackFootprint = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName).getData().footprintData;
        var trackColor = ns.formatRGBAColor(trackFootprint.red, trackFootprint.green, trackFootprint.blue, trackFootprint.alpha);

        var axisLabels = {
            xValue: plotData.xAxisName,
            yValue: plotData.yAxisName,
        };

        var dataSet = ns.getFormattedPlotValues(plotData, trackName);

        if (dataSet.length == 0) {

            var errorMessage = 'Plot Error: No data available for ' + trackName + ' with the given plot information';

            ns.launchErrorDialog('Plotting Error For Track: ' + trackName, errorMessage);

            console.error(errorMessage);
            return;
        }


        //TODO: Precision could be very easily determined dynamically or from user specifications by replacing the 3,
        //we decided not to because going to more than three digits of precision tends to clutter the page
        var precision = '%#.' + 3 + 'f';

        //Add general identifier for a plot container
        var plotDiv = $("<div>").addClass("plotContainerDiv");

        //Adds new plot to windowToUpdate
        $(".displayArea .scrollingPlotsContainer", windowToUpdate).append(plotDiv);

        var plot = $(plotDiv).jqplot([dataSet], {
            //title: trackName,//adds a title immediately prior to plot--seems unneccesary since the track and window name are already right there
            sortData: false,        //wether or not to sort the data so that it changes from the order in which it was passed in           
            seriesColors: [trackColor],//Specifies color of charted line, currently linked to the track information
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
                    label: "<button class='plotAxisButton'>" + axisLabels.xValue + "</button>",
                    tickOptions: { formatString: '%.2g', angle: -30, },//Specifies formatting of axis labels
                },
                yaxis: {
                    show: true,
                    label: "<button class='plotAxisButton'>" + axisLabels.yValue + "</button>",
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
        $(plotDiv).data("plotInstance", plotInstance);
    };

    /* Given a plot instance and a track name, returns an array of all corresponding information in the format expected by jqplot */
    ns.getFormattedPlotValues = function (plotData, trackName) {

        //Grab the values for the given parameters 
        var xArr = ns.calculateParameterValues(trackName, plotData.xAxisName);
        var yArr = ns.calculateParameterValues(trackName, plotData.yAxisName);
        var frameArr = ns.calculateParameterValues(trackName, 'frame');

        var formattedArrays = ns.mergeNArrays([xArr, yArr, frameArr]);
        var dataSet = ns.cleanFormattedArrays(formattedArrays);

        return dataSet;
    }

    /*
    Generates a plot popup based on the current instance of the plot
    from which a user can choose to save a new value to plot. 
    If user chooses to save, returns an object containing an 'x' and a 'y' key 
    */
    ns.generatePlotPopup = function (clickedAxisButton) {

        var newAxisParam;//Variable that will be returned if the user makes a selection
        var windowViewDOM = $(clickedAxisButton).parents('.windowView');//Overall window
        var windowInstance = windowViewDOM.data('windowData');//Specific window instance
        var selectedTrackView = windowInstance.getSelectedTrack();//The object instance of the trackView being displayed
        var specificPlotClickedOn = $(clickedAxisButton).parents('.plotContainerDiv');
        var plotInstance = specificPlotClickedOn.data("plotInstance");//The object instance of the plot being modified
        var buttonInstance = clickedAxisButton.parentElement;
        var axisName = $(buttonInstance).attr('class').replace('jqplot-', '').replace('axis-label', '');//Axis name to be displayed in popup ('x' or 'y')

        //Handlebars templating to create the popup
        var template = $(ns.dataPaths.mathPlotsPopupTemplateSelector).html();
        var templateFunc = Handlebars.compile(template);
        var mathOptionsObj = {};
        mathOptionsObj.parameters = ns.axisDropdownMenu;
        var html = templateFunc(mathOptionsObj);
        html = $(html);
        var buttonText = $('span', clickedAxisButton).text();//Grabs the original value being plotted on the axis so it can be highlighted in the popup
        $('body').append(html);//Append template values to html body

        //Set the check next to the currently plotted value so that it's highlighted when the popup is generated
        $('#' + buttonText).prop('checked', true);

        var windowInstanceName = "Window " + windowInstance.viewIndex + ": " + axisName + " axis options";//Grabs the window instance number for the popup title bar               

        //Give any value the user selects the property 'checked,' so that the appropriate value will be returned
        $('.plotButtons').change(function (event) {
            newAxisParam = $(event.currentTarget).attr('id');
            $('#' + newAxisParam).prop('checked', true);//No need to uncheck previous option since its radio style
        });

        //Style popup options as jquery toggle buttons
        $(".check").parent().buttonset();

        //Dialogue box options
        html.dialog({
            resizable: true,
            height: '600',
            width: '370',
            minHeight: '600',
            minWidth: '370',
            modal: true,
            closeOnEscape: true,
            title: windowInstanceName,
            buttons: {
                Save: function () {

                    newAxisParam = $('input:checked', this).attr('id');//Grab the value the user selected                    

                    $(this).dialog("close");
                    $(this).remove();//remove the element from the page--otherwise hidden dialogue boxes will stack on the page

                    var plotData = plotInstance.getData();

                    var xAxisParam = plotData.xAxisName;
                    var yAxisParam = plotData.yAxisName;

                    if (axisName === 'x') {
                        updatePlotParameters(newAxisParam, yAxisParam, selectedTrackView, plotInstance, windowViewDOM);
                    }
                    else if (axisName === 'y') {
                        updatePlotParameters(xAxisParam, newAxisParam, selectedTrackView, plotInstance, windowViewDOM);
                    }
                },
                Cancel: function () {
                    $(this).dialog("close");
                },
            },
            close: function (event, ui) {
                $('input:checked', this).prop('checked', false);
                $(this).remove();
                return newAxisParam;
            }
        });
    };

    /* Generates the table popup based on the instance of the table options that was pushed. */
    ns.generateTablePopup = function (thisInstance) {

        //Object specifying the values that will be contained in the table
        var selectedTableValues = [];

        var windowViewDOM = $(thisInstance).parents('.windowView');//Overall window
        var windowInstance = windowViewDOM.data('windowData');//Specific window instance
        var windowName = "Window " + windowInstance.viewIndex + " Table Options";//Window name to be displayed in popup
        var currentTrackName = windowInstance.selectedTrack;
        var currentTableInstance = windowInstance.getTrackViewbyName(currentTrackName).getData().tableInstance;

        var selectedTrackViewObject = windowInstance.getSelectedTrack();

        //Handlebars templating to create the popup
        var template = $(ns.dataPaths.mathTablesPopupTemplateSelector).html();
        var templateFunc = Handlebars.compile(template);
        var mathOptionsObj = {};
        mathOptionsObj.parameters = ns.axisDropdownMenu;
        var html = templateFunc(mathOptionsObj);
        html = $(html);
        $('body').append(html);//Append template values to html body

        //Grab the values currently displayed in the table and mark them as checked in the popup       
        var currentlyDisplayedArr = windowInstance.getTrackViewbyName(currentTrackName).getData().tableInstance.getData();
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
                    updateTableParameters(selectedTableValues, selectedTrackViewObject, currentTableInstance, windowViewDOM);
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

    /*
    TODO: The above two dialog opening mechansisms should be refactored to the form below:
        1. One function is used for the opening of the dialog and calls the generate function if the dialog hasnt been initialized
        2. The other function should do the actual dialog initialization and population if neccesary
    */

    //Opens the center of mass linked masses dialog box and sets the linked masses according to the the trackname
    ns.openLinkedMassesDialog = function (thisInstance) {

        var linkedMassesDialog = $('#linkedTracksDialog');

        if (linkedMassesDialog.length == 0) {
            ns.generateLinkedMassesPopup();

            linkedMassesDialog = $('#linkedTracksDialog');
        }

        //TODO: Need to handle the case where a new track is added

        var trackName = $(thisInstance).parent().attr('trackname');

        //Need to store the current center of mass in order to allow saving
        linkedMassesDialog.data('currentCenter', trackName);

        var windowName = "Tracks linked to " + trackName + " .";//Title displayed in popup

        var selectedCenterOfMassTrack = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName);

        var linkedMasses = selectedCenterOfMassTrack.getData().linkedMasses;

        var linkedMassesForm = $('#linkedTracksForm');

        //Need to set the checkboxes accordinign to the value defined in the linked masses array
        linkedMassesForm.find('input[type="checkbox"]').each(function () {

            var checkbox = $(this);

            var checkboxValue = checkbox.attr('trackname');

            if (linkedMasses.indexOf(checkboxValue) > -1) {
                checkbox.prop('checked', true).button('refresh');
            }
            else {
                checkbox.prop('checked', false).button('refresh');
            }

        })

        //Opens the dialog with the new track
        linkedMassesDialog.dialog('option', 'title', windowName).dialog('open');
    }

    //Creates the linked masses dialog to be used by all centers of mass to vbiew/change their linked masses
    ns.generateLinkedMassesPopup = function () {


        //Handlebars templating to create the popup
        var template = $(ns.dataPaths.linkedTracksTemplateSelector).html();
        var templateFunc = Handlebars.compile(template);

        //Need to create an object which contains the information to make the popup structure
        var templateData = {};
        templateData.parameters = [];

        var trackObjectLiteral = ns.trackerDataInstance.tracksContainer.getTracks();

        for (var track in trackObjectLiteral) {

            //Don't want to be able to link other centers of mass
            if (trackObjectLiteral[track].getData().type !== 'centerOfMass') {
                templateData.parameters.push(track);
            }
        }

        var html = $(templateFunc(templateData)).appendTo('body');

        //Style options as jquery toggle buttons
        $("#linkedTracksForm").buttonset();

        //Dialogue box options
        html.dialog({
            resizable: true,
            height: '600',
            width: '370',
            minHeight: '600',
            minWidth: '370',
            modal: true,
            closeOnEscape: true,
            autoOpen: false,
            buttons: {
                Save: function () {

                    var selectedLinkedTracks = [];

                    $(this).find('input:checked').each(function () {

                        selectedLinkedTracks.push($(this).attr('trackname'));
                    });
                    $(this).dialog("close");
                    ns.updateCenterOfMass($(this).data('currentCenter'), selectedLinkedTracks);
                },
                Cancel: function () {
                    $(this).dialog("close");
                    return "";
                },

            },
            close: function (event, ui) {

            }
        });

    }

    /*
    Given a center of mass track name, and an array of string track names
    to which the mass should be linked, removes all video footprints,
    removes the old center of mass instance, creates a new one,
    and redraws track elements.
    */
    ns.updateCenterOfMass = function (trackName, selectedLinkedTracks) {
        //TODO:Broken: Does not handle video elements correctly, but calculations are correct
        //Method needs to be cleaned up
        //$('.videoFootprint').remove();//Remove all track visuals from video

        var _coreCenterOfMassData = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName).getData();//Get the old core data so it can be put in the new object
        _coreCenterOfMassData.linkedMasses = selectedLinkedTracks;//Update the core data with the tracks to which it is now linked
        _coreCenterOfMassData.totalMass = 0;//Need to reset mass property so that it can be calculated


        ns.trackerDataInstance.tracksContainer.deleteTrack('centerOfMass', trackName);

        var _tracks = ns.trackerDataInstance.tracksContainer.getTracks();//Need to build array of all tracks to pass to createCenterOfMass
        var _tracksArr = [];
        for (var track in _tracks) {
            _tracksArr.push(_tracks[track]);
        }

        for (var i = 0; i < selectedLinkedTracks.length; i++) {//Recalculate mass

            _coreCenterOfMassData.totalMass += ns.trackerDataInstance.tracksContainer.getTrackByName(selectedLinkedTracks[i]).getData().mass;

        }

        var _newCenterOfMassInstance = ns.createCenterOfMass(_coreCenterOfMassData, _tracksArr);

        ns.trackerDataInstance.tracksContainer.addTrack('centerOfMass', trackName, _newCenterOfMassInstance);

        //Need to remove all of the existing footprints displaying the old center of mass info
        $('.frameContainer g *[trackname="' + trackName + '"]').remove();

        //We will now construct an object containing the new center of mass whose footrpints will be drawn onto the video
        var trackObjectLiteral = {};

        trackObjectLiteral[trackName] = _newCenterOfMassInstance;

        ns.drawTracksFrameLayers(trackObjectLiteral);

        ns.refreshSpecificWindowElementBySelectedTrack(trackName);
    }

    ns.refreshSpecificWindowElementBySelectedTrack = function (trackName) {
        $('.windowView').each(function () {
            var thisSelectedTrack = $(this).data('windowData').selectedTrack

            if (thisSelectedTrack == trackName) {
                ns.updateTrackViews(this);
            }

        });
    }

    /* Used by video file to update table and plot highlighting as the video progresses. */
    ns.updateDataHighlighting = function (frameNumber) {
        //console.time('highlighting')

        //console.time('rows');
        var videoIndicesArr = ns.trackerDataInstance.getVideoObjectLiteral().validFrameIndices;

        var rowIndex = videoIndicesArr.indexOf(frameNumber);

        var dataTables = $("table.trackViewTable");

        dataTables.find("tr.highlighted").removeClass("highlighted");

        dataTables.find("tr.row" + rowIndex).addClass("highlighted");
        //console.timeEnd('rows');

        //console.time('plots');
        highlightPlotDataPoint(frameNumber);
    };

    /* Given a frame number, highlights the corresponding data point for every plot on the page. */
    var highlightPlotDataPoint = function (frameNumber) {

        var stepSize = ns.trackerDataInstance.getVideoObjectLiteral().stepSize;

        $('.windowView').find(".jqplot-target").each(function () {//For every plot on the page (excluding the data tool)

            var plotTarget = $(this);

            var jqPlotInstance = plotTarget.data("jqplot");

            if (typeof jqPlotInstance === "undefined") {//This plot has not been drawn yet:
                return;
            }
            else {//The plot is defined

                /*
                The following is a solution to the problem where the indices of the plot are always 0 -> n-1 regardless of the frame index passed in.
                We rely on an equation that allows us to figure out which plotIndices (0, 1, 2, ... , n-1 ) correspond to which videoFrame 
                indices(startFrame, startFrame + stepSize, startFrame + 2*stepSize, ... , startFrame + (m-1)*stepSize) where n represents the number of 
                plot points and m represents the number of data points(which can be different because of derivative calculations which leave out fringe values).
                The equation: startFrame + stepSize *plotIndexValue = desiredFrameNumber where startFrame is corresponds to the 0th plotIndex, stepSize is the
                video stepSize, plotIndex value is the plotindex corresponding to the desired frame number, and the desired frame number is the frame whose data
                point we are trying to highlight which is passed in. Since we can find or are given the desiredFrameNumber, the startFrame, and the stepSize we 
                simply solve for plotIndex value and are left with the following equation: plotIndexValue = (desiredFrameNumber - startFrame)/stepSize which
                gives us our desired value.
                */

                //First we get the dataset for this plot
                var dataSet = jqPlotInstance.series[0].data;

                //Grabs the frame value(with index of 2) of the first entry in the dataSet
                //(this is guaranteed to be the first frame index based on how the data is formatted in trackerMath)
                var startFrame = dataSet[0][2];

                var plotIndexValue = (frameNumber - startFrame) / stepSize;

                //The data points corresponding to the frame whose index was passed in
                var dataPoints = dataSet[plotIndexValue];

                //Grabs the canvas on which we will draw the data points
                var drawingCanvas = plotTarget.find(".jqplot-highlight-canvas")[0];

                if (typeof dataPoints === 'undefined') {//We have no points to highlight so all highlighing should be cleared

                    if (typeof drawingCanvas !== 'undefined') {
                        var context = drawingCanvas.getContext('2d');
                        context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                    }

                }
                else {//We have data points so we should continue

                    //Need the x and y coordinate to know where the highlight circle should be drawn
                    var x = jqPlotInstance.axes.xaxis.series_u2p(dataPoints[0]);
                    var y = jqPlotInstance.axes.yaxis.series_u2p(dataPoints[1]);
                    var r = 10;

                    if (typeof drawingCanvas !== 'undefined') {
                        //Need to have the color of this plot so that the highlighter matches the plot points
                        //We can just use the first color in here for now because we there is only one series per plot
                        var plotColorArray = jqPlotInstance.seriesColors[0].replace(/[^\d,]/g, '').split(','); //Uses a regular expression to return an array of the values making up the rgba string

                        //Sets the alpha so we can see through the highlight point
                        plotColorArray[3] = 0.75;

                        for (var i = 0; i < plotColorArray.length ; i++) {
                            plotColorArray[i] = parseFloat(plotColorArray[i]);
                        }

                        var adjustedColor = ns.formatRGBAColor(plotColorArray[0], plotColorArray[1], plotColorArray[2], plotColorArray[3]);

                        drawPointHighlighter(adjustedColor, x, y, r, drawingCanvas)

                    }
                }
            }
        });
    };

    var drawPointHighlighter = function (pointColor, pointX, pointY, radius, drawingCanvas) {

        var context = drawingCanvas.getContext('2d');
        context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); //plot.replot();            
        context.fillStyle = pointColor;
        context.strokeStyle = 'none';
        context.beginPath();
        context.arc(pointX, pointY, radius, 0, Math.PI * 2, true);
        context.closePath();
        context.stroke();
        context.fill();
    }

    //Determines the precision used by drawPlot for labeling the various axis and potentially the mouseover hovers
    var determinePrecision = function (dataSet) {

        //There's no need to iterate through all of what could be a somewhat large dataset
        var length = dataSet.length;
        if (length > 15) {
            length = 15;
        }

        //Max precision value found
        var precision = 0;
        //For each subarray in the dataset
        for (var i = 0; i < length; i++) {
            //if the x axis is more precise, that's the new max precision
            if (dataSet[i][0].toString().indexOf(".") !== -1) {
                if (dataSet[i][0].toString().split(".")[1].length > precision) {
                    precision = dataSet[i][0].toString().split(".")[1].length;
                }
            }
            //if the y axis is more precise, that's the new max precision
            if (dataSet[i][1].toString().indexOf(".") !== -1) {
                if (dataSet[i][1].toString().split(".")[1].length > precision) {
                    precision = dataSet[i][1].toString().split(".")[1].length;
                }
            }
        }
        //Configure the maximum amount of precision--too much leads to odd page formatting
        if (precision > 3) {
            precision = 3;
        }
        return precision;
    };

    //Constructs window html and adds it to page along with all contained values
    ns.createWindows = function (windowViewArr) {

        for (var windowView in windowViewArr) {

            ns.buildWindowHTML(windowViewArr[windowView]);
        }
    };

    //Makes sure that the dataset to be passed into JQplot does not have any missing entries
    ns.cleanFormattedArrays = function (mergedArrays) {

        var cleanedArr = [];

        for (var index in mergedArrays) {

            //Removes anything that is not a number
            if (!isNaN(parseFloat(mergedArrays[index][0])) && !isNaN(parseFloat(mergedArrays[index][1]))) {
                cleanedArr.push(mergedArrays[index]);
            }
        }
        return cleanedArr;
    };

    //Takes in table instance and creates and appends the html to the main page and initializes the data table plugin 
    ns.createTable = function (tableInstance, windowContainer, trackName) {

        var tableObject = {};

        var columnParams = tableInstance.getData();

        tableObject.dataSet = ns.getTableDataSet(columnParams, trackName);

        tableObject.columnHeaders = columnParams;

        var windowIndex = $(windowContainer).data("windowData").viewIndex;

        var id = "trackDataTable" + windowIndex;

        tableObject.id = id;

        //Add the table options popup menu to select data for the table
        var button = $("<button>");

        button.addClass('tableOptionsButton');

        button.text("Table Options");

        $('.titleBar div:last', windowContainer).append(button);

        //Makes the button pretty
        button.button();

        var tempTemplate = $("#trackTableTemplate").html();

        var templateFunc = Handlebars.compile(tempTemplate);

        var html = templateFunc(tableObject);

        $(".displayArea", windowContainer).append(html);

        var tableHTMLElement = $("#" + id).addClass('trackViewTable');

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

                var tableHeight = containerHeight - divHeight;

                $("div.dataTables_scrollBody", windowContainer).height(tableHeight);
            },
        });

        tableHTMLElement.data({
            "tableInstance": tableInstance,
            'dataTableInstance': DataTable
        });
    };

    //Constructs the actual HTML of the window as per the template defined in the index
    ns.buildWindowHTML = function (windowInstance) {

        //Pulls in the template from index.html
        var template = $(ns.dataPaths.windowViewTemplateSelector).html();

        var templateFunc = Handlebars.compile(template);

        var tracksObject = windowInstance.getTrackViews();

        windowInstance.tracks = tracksObject;

        var html = templateFunc(windowInstance);

        //Appends the new div to the first empty windowPanel in the UILayout
        var thisWindow = $('<div>').addClass("windowView").appendTo(".windowPanel:empty:first");

        thisWindow.append(html);

        //Stores the windowInstance in the data of the windowInstance div:
        thisWindow.data("windowData", windowInstance);

        thisWindow.find(".viewType").val(windowInstance.viewType);

        thisWindow.find(".trackSelector").val(windowInstance.selectedTrack);

        ns.updateTrackViews(thisWindow);
    };

    /* This function is called every time one of the dropdowns is changed in the window. */
    ns.updateTrackViews = function (windowToUpdate) {

        //Prepares window for new content by removing any current elements
        $('.tableOptionsButton', windowToUpdate).remove();
        $('.numberOfPlots', windowToUpdate).remove();
        $('.displayArea', windowToUpdate).empty();
        windowToUpdate.find('.pageViewTextDiv').remove();//TODO: implement page view better


        //First we need to grab the window instance data which has been stored in the window html div element
        var windowInstance = $(windowToUpdate).data("windowData");

        var viewIndex = windowInstance.viewIndex;

        //Find all of the specified values:
        var viewType = $(windowToUpdate).find(".viewType").val();

        var trackName = $(windowToUpdate).find(".trackSelector").val();

        var trackViewsArr = windowInstance.tracks;

        if (trackName === null || typeof trackName === "undefined") {
            //TODO: this should only really occur until World View and Page View are implemented
            console.error("The selected track for Window " + viewIndex + " could not be found.");
            return;
        }

        var selectedTrack = windowInstance.getTrackViewbyName(trackName);

        if (selectedTrack === null) {
            console.error("Track " + trackName + " is invalid");
        }
        else {

            //Call the appropriate function depending on the selected value:
            switch (viewType) {
                case "Plot View":

                    var scrollingPlotsContainer = $('<div>').addClass('scrollingPlotsContainer');

                    $('.displayArea', windowToUpdate).append(scrollingPlotsContainer);

                    //Build a plot
                    var plotsArr = selectedTrack.getData().plotInstances;

                    //We want to draw any plots marked as visible by the xml
                    var visibleCounter = 0;
                    for (var i = 0; i < plotsArr.length; i++) {
                        if (plotsArr[i].getData().visible == true) {
                            drawPlot(plotsArr[i], trackName, windowToUpdate);
                            visibleCounter++;
                        }
                    }
                    //Add the options to see up to three plots in a window
                    var numberOfPlotsButton = $("<select>");
                    for (var i = 1; i < 4; i++) { numberOfPlotsButton.append($('<option>' + i + '</option>')); }
                    numberOfPlotsButton.addClass('numberOfPlots ui-widget-content ui-corner-all');

                    //And once we know how many were marked as visible, we can update the number accordingly
                    numberOfPlotsButton.val(visibleCounter);
                    $('.titleBar div:last', windowToUpdate).append(numberOfPlotsButton);

                    break;

                case "Table View":

                    var table = selectedTrack.getData().tableInstance;
                    if (table !== null) {
                        ns.createTable(table, windowToUpdate, trackName);
                    }
                    break;

                case "Page View"://TODO: implement page view better
                    windowToUpdate.append('<div class="pageViewTextDiv">')
                    var pageViewText = selectedTrack.getData().pageViewText;
                    windowToUpdate.find('.pageViewTextDiv').text(pageViewText);
                    break;

                case "World View":
                    //TODO: Build a world view
                    break;

                default:
                    console.error("Not a valid view type");
                    return;
            }

            //Update windowInstance data:
            windowInstance.viewType = viewType;

            windowInstance.selectedTrack = trackName;

            $(windowToUpdate).data("windowData", windowInstance);
        }
    };

    /* Used when plot parameters are changed to update the window. */
    var updatePlotParameters = function (xParam, yParam, selectedTrackViewObject, currentPlotInstance, currentWindowDOM) {

        var plotData = currentPlotInstance.getData();

        var plotOptions = plotData.plotOptions;
        var plotIndex = plotData.plotIndex;
        var plotVisibility = plotData.visible;

        var plotInstance = new ns.domain.plotObject(plotIndex, xParam, yParam, plotOptions, plotVisibility);

        selectedTrackViewObject.replacePlot(plotIndex, plotInstance);

        ns.updateTrackViews(currentWindowDOM);
    };

    /* Used when table parameters are changed to update the window. */
    var updateTableParameters = function (arrayOfParams, selectedTrackViewObject, currentTableInstance, currentWindowDOM) {

        var tableInstance = new ns.domain.tableObject(arrayOfParams);

        selectedTrackViewObject.addTable(tableInstance);//Replaces current table instance

        ns.updateTrackViews(currentWindowDOM);
    };

    //Makes calls to other functions to create and populate the legend element on the page
    ns.createLegend = function () {        

        //Grab all the tracks so a key in the legend can be created for each
        var tracks = ns.trackerDataInstance.tracksContainer.getTracks();

        //Create Handlebars friendly object
        var legendObject = {};
        legendObject.parameters = {};

        for (var track in tracks) {
            var trackData = tracks[track].getData();
            legendObject.parameters[trackData.name] = trackData.footprintData;
        }

        createLegendKeyHTML(legendObject);
        createLegendButtonHTML(legendObject);

        $('.legendDialog').dialog({
            title: 'Legend',
            height: '300',
            width: '768',
            maxWidth: '768',
            autoOpen: false
        });
    };

    //Attaches legend track information to the page
    var createLegendKeyHTML = function (legendObject) {

        //Handlebars templating to create the legend
        var template = $(ns.dataPaths.legendGeneratorTemplateSelector).html();
        var templateFunc = Handlebars.compile(template);
        var html = templateFunc(legendObject);
        html = $(html);
        var popup = $('.legendDialog').append(html);//Append template values to  div

        //Beautify button
        $('button').button();

        //Draw visuals onto SVG element
        for (var track in legendObject.parameters) {
            drawLegendFootprint(legendObject.parameters[track], track, Object.size(legendObject.parameters));
        }
    };

    //For each track, check the track type, and append the appropriate button objects to the track legend
    var createLegendButtonHTML = function () {

        var tracks = ns.trackerDataInstance.tracksContainer.getTracks();

        for (var track in tracks) {

            var trackData = tracks[track].getData();
            var trackName = trackData.name;

            if (trackData.type === 'pointMass') {
                appendButtons(trackName, ns.legendButtons.pointMass);
            }
            else if (trackData.type === 'centerOfMass') {
                appendButtons(trackName, ns.legendButtons.centerOfMass);
            }
            //TODO:add other track types
        }
    };

    /* Appends the appropriate button options enumerated in globalProperties to each track type (visibility, notes, etc.) */
    var appendButtons = function (trackName, menuItems) {

        var menuContainer = $('ul.trackLegendDropDownMenu[trackname="' + trackName + '"]');

        for (var menuItem in menuItems) {

            var menuItemInstance = $(menuItems[menuItem], '#legendButtonEnumeration').clone();

            menuContainer.append(menuItemInstance);
        }
    };

    //Draws the legend footprint within the given table element
    var drawLegendFootprint = function (trackData, trackName, numberOfTracks) {

        var shapeType = trackData.footprint;
        var color = ns.rgbToHex(trackData.red, trackData.green, trackData.blue);

        var boldModifier = 1;
        if (shapeType.bold === true) {
            boldModifier = 2;
        }

        var instructions = ns.footprints[shapeType];
        var SVGContainer = $('svg[tracksvg="' + trackName + '"]');
        SVGContainer.attr('class', "legendKey");

        var translateY = ($('.legendKey:first').height()) / 2;
        var translateX = ($('.legendKey:first').width()) / 2;
        var transform = "translate(" + translateX + "," + translateY + ")";

        ns.drawFootprint(instructions, boldModifier, color, transform, SVGContainer);
    };

    /*
    Initializes the UI layout plugin which performs all of the panel resizing
    Also defines the resize/close/open callbacks which will acheives the plot/table resizing
    */
    ns.initializePageLayout = function () {     

        //Defines the default UI panel options
        var defaultPanelOptions = {
            padding: "0",
            fxName: "scale",
            fxSpeed: "fast",
            minSize: "30%",
            maxSize: "70%",
            togglerLength_open: "100%",
            togglerLength_closed: "100%",
            north__togglerLength_open: "100%",
            south__togglerLength_open: "100%",
            resizerTip: "Resize",
            resizerClass: "ui-layout-resizer",
            spacing_closed: 10,
            spacing_open: 10,
            south__size: "50%",
            north__size: "50%",
            center__size: "50%",
            east__size: "50%",
            west__size: "50%",
            initClosed: false,
            onresize_end: function (paneName, paneElement, paneState, paneOptions, layoutName) {

                if ($(paneElement).hasClass('windowPanel')) {
                    var thisWindow = $(paneElement);

                    refreshWindowElements(thisWindow);
                }
                else if ($(paneElement).attr("id") == "videoPanel") {

                    ns.redrawVideo();
                }
            },
            onclose: function (paneName, paneElement, paneState, paneOptions, layoutName) {

                $(paneElement).find('.displayArea').empty();

            },
            onopen: function (paneName, paneElement, paneState, paneOptions, layoutName) {

                /*
                    TODO: Sometime on open the windowPanel does not resize like it should, need to add this functionality

                    ESPECIALLY on demo.trk opening and closing windows 2 and 3
                */

                var openedPanel = $(paneElement);

                var windowPanels = openedPanel.find('.windowView');

                if (openedPanel.hasClass('windowView')) {

                    ns.updateTrackViews(openedPanel);
                }
                else if (windowPanels.length > 0) {

                    windowPanels.each(function () {
                        ns.updateTrackViews($(this));
                    })
                }
            },
        };

        //Creates a copy of the default options so they can be modified
        var trackerPanelOptions = $.extend(true, {}, defaultPanelOptions);

        //Defines special properties for the top level panel--the main left/right split
        trackerPanelOptions.center__minSize = "625px";
        trackerPanelOptions.center__size = "65%";
        trackerPanelOptions.east__size = "35%";
        trackerPanelOptions.north__minSize = "30px";
        trackerPanelOptions.north__maxSize = "30px";
        trackerPanelOptions.north__size = "30px";

        //Defines special properties for the layout conaining everything except the menu
        var contentpanelOptions = $.extend(true, {}, defaultPanelOptions);
        contentpanelOptions.center__minSize = '75%';

        $('#trackerWindow').layout(trackerPanelOptions);
        $('#windowPanelBarWest').layout(contentpanelOptions);
        $('#windowPanelBarEast').layout(defaultPanelOptions);
        $('#windowPanelBarSouthWest').layout(defaultPanelOptions);
    };


    ns.launchHelpMenu = function () {
        var win = window.open('help.html', '_blank');
        win.focus();
    }

    /*
    Resizes all of the video elements in order to fill the video pane as much as possible while maintaining video aspect ratio
    Called on a resize of the video window pane 
    */
    ns.redrawVideo = function () {

        //Resets the scrub margin so it doesnt affect the calculations below
        var frameContainer = $(".frameContainer").css('margin', 0);

        //Grabs container height and width and claculates the aspect ratio
        var videoPlayerContainer = $('#videoPlayerContainer');
        var containerHeight = videoPlayerContainer.height() - $('#videoPlaybackControls').height();
        var containerWidth = $('#frameDisplayArea').width();
        var containerRatio = containerWidth / containerHeight;
        var coordinateAxisContainer = $('#coordinateAxisContainer');

        //Grabs the video's aspect ratio(the ratio between width and height)
        var videoObjectLiteral = ns.trackerDataInstance.getVideoObjectLiteral()

        var imageRatio = videoObjectLiteral.aspectRatio;

        var actualVideoWidth = videoObjectLiteral.videoWidth;

        var actualVideoHeight = videoObjectLiteral.videoHeight;

        //If the image's apect ratio is greater than the container's aspect ratio we know that the width is the limiting dimension within the video container pane       
        if (imageRatio >= containerRatio) {
            //Defer to width
            //We now calculate the height according to the aspect ratio of the image
            var newHeight = containerWidth / imageRatio;

            frameContainer.width(containerWidth).height(newHeight);

            var topMargin = (videoPlayerContainer.height() - newHeight) / 2;
        }
        else {//Else we know that the height is the limiting dimension 
            //Defer to height
            //We now calculate the width according to the aspect ratio of the image
            var newWidth = containerHeight * imageRatio;

            frameContainer.height(containerHeight).width(newWidth);

            var topMargin = 0;
        }

        //Grabs the actual height and width set above
        var drawnVideoDimensions = ns.getVideoPlayerDimensions();

        var xScale = drawnVideoDimensions.width / actualVideoWidth;
        var yScale = drawnVideoDimensions.height / actualVideoHeight;

        //Resize coordinate Axis container
        coordinateAxisContainer.css('width', drawnVideoDimensions.width);
        coordinateAxisContainer.css('height', drawnVideoDimensions.height);


        //Modifies the scale of the group tag containing each frame's point overlay. Changing this scale updates the point positions and the size according to the size of the new container
        $('.frameOverlayLayer g, #coordinateAxisContainer g').attr({
            transform: "scale(" + xScale + "," + yScale + ")"
        });

        //Calculates the left margin so that the video container and coordinate axis is centered within the video panel
        var leftMargin = (containerWidth - drawnVideoDimensions.width) / 2;
        topMargin = (containerHeight - drawnVideoDimensions.height) / 2;


        frameContainer.css({
            "margin-left": leftMargin,
            "margin-top": topMargin
        });
        coordinateAxisContainer.css({
            'margin-left': leftMargin,
            "margin-top": topMargin
        });

    };

    //Refreshes the plots and tables of the given window in order for those elements to be properly sized
    var refreshWindowElements = function (thisWindow) {

        //Handles resizing for all plots within a div
        $('.jqplot-target', thisWindow).each(function () {
            $.data(this, "jqplot").replot({ resetAxes: true });
        })

        //Finds this windows actual data table. The first table in the windowView is the header whcih dataTables formats as its own table
        var table = $(thisWindow).find(".dataTable:last");

        if (table.length !== 0) {
            //Again we want the second .dataTable in this window div
            var tableInstance = table.dataTable();

            tableInstance.fnDraw();
            tableInstance.fnAdjustColumnSizing();
        }
    };

    //Draws the coordinate axis to a div that overlays the video. Scales axis according to video size.
    ns.drawCoordinateAxis = function () {

        //Format objects to pass into drawFootprint
        var coordSystemProperties = ns.trackerDataInstance.getCoordinateSystemObjectLiteral();
        var videoProperties = ns.trackerDataInstance.getVideoObjectLiteral();


        //Set axis to hidden on creation if that's what the tracker file specifies
        if (coordSystemProperties.visible === 'false') {
            $('#coordinateAxisContainer').css('display', 'none');
        }

        var footprintBlueprint = ns.footprints.CoordAxis;
        var boldModifier = 1;
        var footprint = coordSystemProperties.footprintData;
        var colorString = ns.formatRGBAColor(footprint.red, footprint.green, footprint.blue, footprint.alpha);

        var originalWidth = videoProperties.videoWidth;
        var originalHeight = videoProperties.videoHeight;

        var currentWidth = $('#coordinateAxisContainer').width();
        var currentHeight = $('#coordinateAxisContainer').height();

        var actualWidth = coordSystemProperties.xOrigin;
        var actualHeight = coordSystemProperties.yOrigin;
        var angle = 0 - coordSystemProperties.angle;
        var xScale = (currentWidth / originalWidth);
        var yScale = (currentHeight / originalHeight);

        var transform = "translate(" + actualWidth + "," + actualHeight + ")" +
                        "rotate(" + angle + ", " + 0 + ", " + 0 + ")" +
        "scale(" + 1 / xScale + "," + 1 / yScale + ")";

        var SVGElementsContainer = $('#coordinateAxisSVG g');
        SVGElementsContainer.attr('transform', 'scale(' + xScale + ", " + yScale + ')');
        ns.drawFootprint(footprintBlueprint, boldModifier, colorString, transform, SVGElementsContainer);
    };

    //Sets coordinate axis visibility properties according to the Show Coordinate Axis button
    ns.setCoordAxisVisibility = function () {

        var coordAxisOptions = ns.trackerDataInstance.getCoordinateSystemObjectLiteral();

        if (coordAxisOptions.visible === 'true') {
            $('#coordinateAxisContainer').css('display', 'none');
            ns.trackerDataInstance.setCoordinateSystemObjectLiteral('visible', 'false');
            $('#toolbarAxisDisplay span').text('Show Coordinate Axis');
        }
        else if (coordAxisOptions.visible === 'false') {
            $('#coordinateAxisContainer').css('display', 'block');
            ns.trackerDataInstance.setCoordinateSystemObjectLiteral('visible', 'true');
            $('#toolbarAxisDisplay span').text('Hide Coordinate Axis');
        }
        else {
            console.error('Coordinate Axis error');
        }
    };

    //Retrieves the note data for a given track and puts it into a jquery ui dialog popup
    ns.handleNotePopup = function (trackName) {

        var noteTrack = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName);

        if (typeof noteTrack === 'undefined' || typeof trackName == 'undefined') {
            return;
        }

        var text = noteTrack.getData().note;

        if (text == '') {//If there is no note text, don't display note
            return;
        }

        //Make use of the generic blank dialog on the page
        var dialog = $('.blankDialog');

        dialog.text(text);

        dialog.dialog({ title: 'Note for ' + trackName });
    };

    //Displays a popup showing other tracks linked to the named center of mass passed in
    //TODO: Change into interactive menu allowing the center of mass to be linked to different tracks
    ns.linkedMassesPopup = function (trackName) {

        var track = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName);

        if (typeof track === 'undefined') {
            return;
        }

        var linkedMassesText = track.getData().linkedMasses;


        if (linkedMassesText.length < 1) {
            var baseText = "No tracks are linked to " + trackName + ".";
        }
        else if (linkedMassesText.length === 1) {
            var baseText = "The track linked to " + trackName + " is ";
        }
        else if (linkedMassesText.length === 2) {
            var baseText = "The tracks linked to " + trackName + " are ";
            var conjunction = " and "
        }
        else if (linkedMassesText.length > 2) {
            var baseText = "The tracks linked to " + trackName + " are ";
            var conjunction = ", and "
        }
        for (var i = 0; i < linkedMassesText.length; i++) {
            if (i === linkedMassesText.length - 1) {
                baseText += linkedMassesText[i] + "."
            }
            else if (i === linkedMassesText.length - 2) {
                baseText += linkedMassesText[i] + conjunction;
            }
            else {//Otherwise, add as comma separated list
                baseText += linkedMassesText[i] + ", "
            }
        }

        var dialog = $('.blankDialog');

        dialog.text(baseText);

        dialog.dialog({ title: 'Linked masses for ' + trackName });
    };

    //Set initial track visibility according to values initially stored in global trackerDataInstance
    ns.setTrackInitialVisibility = function () {

        var tracks = ns.trackerDataInstance.tracksContainer.getTracks();

        for (var track in tracks) {

            var visible = tracks[track].getData().visible;
            var trackName = tracks[track].getData().name;

            var visibilityMenuItem = $('.trackLegendDropDownMenu[trackName="' + trackName + '"] .legendDropdownVisibility a');

            if (visible === 'false') {
                $('.videoFootprint').find('[trackName="' + trackName + '"]').hide();

                $(visibilityMenuItem).find('p').text('Show');
            }
            else {
                $(visibilityMenuItem).find('p').text('Hide');

                $(visibilityMenuItem).find('span').removeClass().addClass('ui-icon  ui-icon-circle-minus');
            }
        }
    };

    //Toggle track visibility according to current visibility of track
    ns.toggleTrackVisibility = function (thisMenuItem, trackName) {

        var track = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName);

        var visible = track.getData().visible;

        if (visible === 'true') {

            track.setData('visible', 'false');
            $('.videoFootprint').find('[trackName="' + trackName + '"]').hide();

            $('a span', thisMenuItem).removeClass().addClass('ui-icon  ui-icon-circle-plus');

            $('a p', thisMenuItem).text('Show')
        }
        else if (visible === 'false') {

            track.setData('visible', 'true');
            $('.videoFootprint').find('[trackName="' + trackName + '"]').show();

            $('a span', thisMenuItem).removeClass().addClass('ui-icon  ui-icon-circle-minus');

            $('a p', thisMenuItem).text('Hide')
        }
    };

    //Takes in event information when the number of plots being displayed changes
    ns.handleplotNumberChange = function (plotsInformation) {

        var numberToDisplay = parseInt(plotsInformation.value, 10);//Grab new number of plots that will be displayed
        var windowViewDOM = $(plotsInformation).parents('.windowView');//Overall window
        var windowInstance = windowViewDOM.data('windowData');//Specific window instance
        var plotsArr = windowInstance.getTrackViewbyName(windowInstance.selectedTrack).getData().plotInstances;

        //Remove plots currently there:
        $(windowViewDOM).find('.plotContainerDiv').remove();

        for (var i = 0; i < 3; i++) {
            if (i < numberToDisplay) {//If there are more plots that need to be displayed
                plotsArr[i].setData('visible', true);//Set their visibility to true

                drawPlot(plotsArr[i], windowInstance.selectedTrack, windowViewDOM)//And draw them
            }
            else {
                plotsArr[i].setData('visible', false)
            }
        }
    }

    ns.rgbToHex = function (r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    };

    var componentToHex = function (component) {
        var hex = parseInt(component, 10).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    ns.formatRGBAColor = function (red, green, blue, alpha) {
        return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
    };

    //Generic error dialog
    ns.launchErrorDialog = function (errorTitle, errorMessage) {

        var dialog = $('#errorDialog').clone().appendTo('body');

        dialog.find('p').text(errorMessage);

        var popup = dialog.dialog({
            title: 'Error: ' + errorTitle,
            width: 'auto',
            modal: 'true',
        });
    }


    //Defines the text to be displayed within the button based on whether the axis is currently visible or not
    ns.initializeAxisButton = function () {

        var coordinateSystemObjectLiteral = ns.trackerDataInstance.getCoordinateSystemObjectLiteral();

        if (coordinateSystemObjectLiteral.visible == 'true') {
            $('#toolbarAxisDisplay').text('Hide Coordinate Axis');
        }
        else if (coordinateSystemObjectLiteral.visible == 'false') {
            $('#toolbarAxisDisplay').text('Show Coordinate Axis');
        }
        else {
            console.error('Coordinate Axis toolbar error.');
        }

        //Make the button look nice
        $("#toolBarAxisDisplay button").button();
    }

}(ed));
