(function (ns, $) {

    //Creates a reader object that contains functions that return information about the given tracker file
    ns.xmlReader = function (urlPath) {

        //The following are properties of a specific xml reader instance
        //Any additional video properties can be easily specified
        //by initializeProperties in buildPage
        this.videoProperties = {
            path: null,
            startframe: null,//this is the first frame in the video
            stepsize: null,
            stepcount: null,
            starttime: null,
            video_framecount: null,
            rate: null,
            delta_t: null,
            frame: null,//This is the frame the video starts on
            magnification: null,
        };

        this.imageCoordinateSystemProperties = {
            fixedorigin: null,
            fixedangle: null,
            fixedscale: null,
            locked: null,
            xorigin: null,
            yorigin: null,
            angle: null,
            xscale: null,
            yscale: null,
            name: null,
            footprint: null,
            visible: null,
            trail: null,
            red: null,
            green: null,
            blue: null,
            alpha: null,
        };

        this.windowProperties = {
            version: null,
            width: null,
            height: null,
            magnification: null,
            center_x: null,
            center_y: null,
            author: null,
            contact: null,
            track_control_x: null,
            track_control_y: null
        };



        //Grabs the specified xml file from the server
        var xhr = $.get(urlPath);

        var _data;

        //Runs a function defined by buildPage upon successful retrieval of the xhr data
        this.loadSuccess = function (callback) {

            xhr.success(function (xml) {
                _data = xml;
                callback();
            });
        }

        xhr.error(function (jqXHR, textStatus, errorThrown) {
            if (textStatus == 'timeout')
                console.log('The server is not responding');

            if (textStatus == 'error')
                console.log(errorThrown);

            alert('Invalid tracker file path specified in url')

        });

        //Returns the track data of the track at the specified path
        this.findClassData = function (classPath) {

            //Instantiates a object to hold all of the idividual track data matching the specified path
            var allClassData = [];

            //Loops through the tracks matching the path 
            $(_data).find(classPath).each(function () {

                //"this" represents the object class of point mass
                //we need to access the parent of this because
                //it is the actual root of this data structure
                var singleClassData = getAllDataOfTypeObject($(this).parent());


                //Stores the individual track data under the the key of its name
                allClassData.push(singleClassData);

            });

            return allClassData;

        };



        //Recursively stores components broken down into properties(including sub properties)
        var getAllDataOfTypeObject = function (propTypeObj) {

            var propertyDataObj = [];

            //Want to get down to property level according to the XML DOM
            $(">object>property", propTypeObj).each(function () {

                var type = $(this).attr('type');
                var name = $(this).attr('name');

                //Different property types need to be handled separately
                switch (type) {

                    //Arrays have sub object which need to be looped through
                    case 'array':

                        propertyDataObj[name] = [];

                        //Looping accomplished by this handler call
                        propertyDataObj[name] = handlePropTypeArray(this, name);
                        break;

                        //Collections have sub objects which need to be looped through
                    case 'collection':

                        propertyDataObj[name] = [];

                        //Looping accomplished by this handler call
                        propertyDataObj[name] = handlePropTypeCollection(this, name);
                        break;

                        //Objects have same sub properties so we recurse
                    case 'object':
                        if (typeof name == "undefined") {
                            name = $(this).attr("class");
                        }
                        propertyDataObj[name] = getAllDataOfTypeObject(this);
                        break;

                        //Other property types just hold information we need to store
                    default:

                        //This will be all of the generic data: mass, etc.
                        propertyDataObj[name] = $(this).text();
                        break;
                }

            });
            return propertyDataObj;
        };


        //Handles property arrays including arrays of arrays of arrays...
        var handlePropTypeArray = function (propTypeArray, name) {

            var propertyDataObj = [];

            //Loops to collect each property of type object
            $(">property[type='object']", propTypeArray).each(function () {

                var arrName = $(this).attr("name");

                var propValue = getAllDataOfTypeObject(this);

                propertyDataObj[arrName] = propValue;

            });

            //Loops to collect each property of type other
            $(">property:not(property[type='object'], property[type='array'])", propTypeArray).each(function () {

                var propName = $(this).attr("name");

                var propValue = $(this).text();
                propertyDataObj[propName] = propValue;

            });

            //Handles nest array case
            $(">property[type='array']", propTypeArray).each(function () {
                var arrName = $(this).attr("name");

                if (propertyDataObj[name] === undefined) {

                    propertyDataObj[name] = [];
                }

                if (propertyDataObj[name][arrName] === undefined) {

                    propertyDataObj[name][arrName] = [];
                }


                //Stores recursive return
                propertyDataObj[name][arrName] = handlePropTypeArray(this, arrName);

            });

            return propertyDataObj;

        };

        //Handles collections of objects including collections of collections etc.
        var handlePropTypeCollection = function (propTypeCollection, name) {

            var propertyDataObj = [];

            //Loops to collect each property of type object
            $(">property[type='object']", propTypeCollection).each(function () {

                //var arrName = $(this).attr("name");

                var propValue = getAllDataOfTypeObject(this);

                propertyDataObj.push(propValue);

            });

            $('>property[type="string"]', propTypeCollection).each(function () {

                //This will be all of the generic data: mass, etc.
                propertyDataObj.push($(this).text());

            });

            return propertyDataObj;
        };

    }

    //General method for initializing the properties of an object
    ns.initializePropertiesObject = function (data, propertiesObject) {
        for (var property in data) {
            var value = data[property];

            //If the value is an object we need to loop through that object's children
            if (value instanceof Object) {

                ns.initializePropertiesObject(data[property], propertiesObject);

            }
            else {
                //       if (propertiesObject[property] === null) {

                var parsedVal = parseFloat(value);

                if (!isNaN(value)) {
                    value = parsedVal;
                }

                propertiesObject[property] = value;
            }
            //     }


        }
    };

    //Formats the viewsData so that the window Instances can be more easily created, returns object literal of the form:
    /**
     *var formattedObject = {
     *    window0: {                 
     *        trackViews: {
     *            trackA: {
     *                table: tableColumns,
     *                plots: arrayOfPlotData
     *                
     *            
     *            },
     *            .
     *            .
     *            .
     *            plotSelectedTrack: "track"
     *            tableSelectedTrack: "track"
     *
     *        }
     *    },
     *   .
     *   .
     *   .
     *}
     */
    ns.viewDataFormatter = function (viewData, selectedViewTypeArr) {
        var viewDataCopy = $.extend(true, {}, viewData);
        //Creates the formatted object literal to contain the formatted windowView Data
        var formattedObject = {}

        //Loops through each view's data in the viewData object
        for (var windowIndex in viewDataCopy.views) {

            var thisViewdata = viewDataCopy.views[windowIndex];

            //Grabs the actual numeric index from viewData, converted from bracketed index, ie "[n]" where n is an integer 
            var index = ns.bracketIndexToInt(windowIndex);

            //Creates a key for the above formatted object, used to associate thisViewData with a window
            var actualWindowIndex = "window" + index;

            //Formats the trackView data contained within thisViewData
            var trackViewData = ns.formatTrackViewData(thisViewdata);

            ////Need to get this window's view type(plot || table || page || worldView)
            //var viewType = selectedViewTypeArr[windowIndex];

            formattedObject[actualWindowIndex] = {};

            formattedObject[actualWindowIndex].trackViews = trackViewData;

            var pageViewText = findPageViewText(thisViewdata['[3]'])
            if (typeof pageViewText === 'undefined') {
                pageViewText = 'There is no page view text for this window.';
            }
            formattedObject.pageViewText = pageViewText;

            // formattedObject[actualWindowIndex].selectedTrack = selectedTrack;

            //formattedObject[actualWindowIndex].viewType = viewType;

            //TODO: Make window Instance here?????
            //var thisWindowInstance = new ns.domain.trackViewWindow(index, selectedTrack, viewType);            

        }

        return formattedObject;
    }

    //Helper function for viewDataFormatter, creates the trackViewPortion of the object literal
    ns.formatTrackViewData = function (trackViewDataElement) {

        var formattedObject = {};

        //formattedObject.watch("", function () { alert("its chris's fault"); });

        //Need to loop through the trackViewData in order to find this Trackview's plot and table format data
        for (var trackInfoIndex in trackViewDataElement) {

            var thisTrackInfo = trackViewDataElement[trackInfoIndex];

            var selectedTrack = thisTrackInfo.selected_track;
            var tableData = thisTrackInfo.track_columns;

            var plotData = thisTrackInfo.track_views;

            //For each iteration of this loop, only a single table or an array of plot(s) should be defined 
            if (typeof tableData != "undefined") {//If tableData is not undefined, we know that this iteration defines a table's properties

                //all of the tables for this trackView are defined here so we will loop through each table 
                for (var trackTableDataIndex in tableData.track_columns) {

                    //corresponds to a specific track's table properties
                    var thisTrackColumnData = tableData.track_columns[trackTableDataIndex];

                    //The track name is always defined in the first entry  of the table properties array
                    var trackName = thisTrackColumnData["[0]"];

                    //Now that we have the name we remove it beacause it is not a table parameter
                    delete thisTrackColumnData["[0]"];

                    var columnNamesArr = [];

                    //Need to collect all column parameters in a standard array(not one with '[0]' index keys)
                    for (var columnIndex in thisTrackColumnData) {

                        var paramName = thisTrackColumnData[columnIndex];

                        //TODO: Need to add expression parsing capabilities in order to handle this param, for now we will skip it
                        if (paramName != 'func') {
                            columnNamesArr.push(paramName);
                        }

                    }

                    //Need to check if the track being displayed with this table has an entry in the formatted yet
                    if (typeof formattedObject[trackName] == "undefined") {//If true, we need to add it
                        formattedObject[trackName] = {};
                    }

                    //Pushes everything together in order to acheive desired format                    
                    formattedObject[trackName].tableData = columnNamesArr;
                    formattedObject.selectedTableTrack = selectedTrack;
                }
            }
            else if (typeof plotData != "undefined") {//If plotData is not undefined, we know that this iteration defines a plot's properties

                //all of the plot for this trackView are defined here so we will loop through each plot
                for (var plotDataIndex in plotData) {
                    var thisTrackPlotData = plotData[plotDataIndex];

                    var trackName = thisTrackPlotData["track"];

                    var plotsArr = [];

                    for (var key in thisTrackPlotData) {

                        //The plots are stored under the keys plot0 or plot1 or plot2 so we do a substring search for these keys
                        var indexOfPlotSubstring = key.indexOf("plot");

                        //If the index equals 0 then we know that this key starts with plot and therefore contains the info of a plot we should create then push
                        if (indexOfPlotSubstring == 0) {

                            //Need the numerical index of this plot for instantiation purposes
                            var plotIndex = key.split("plot")[1];

                            var plot = thisTrackPlotData[key];

                            //TODO: This is a safety check to prevent the creation of a plot with a func parameter
                            var xAxisName = plot.x_var == 'func' ? 'x' : plot.x_var;
                            var yAxisName = plot.y_var == 'func' ? 'y' : plot.y_var;

                            var plotOptions = {
                                lines: plot.lines,
                                points: plot.points,
                            }

                            var formattedPlotData = {
                                plotIndex: plotIndex,
                                xAxisName: xAxisName,
                                yAxisName: yAxisName,
                                plotOptions: plotOptions
                            };

                            plotsArr.push(formattedPlotData);
                        }
                    }

                    //Need to check if the track being displayed with this table has an entry in the formatted yet
                    if (typeof formattedObject[trackName] == "undefined") {
                        formattedObject[trackName] = {};
                    }

                    //Pushes everything together in order to achieve desired format                    
                    formattedObject[trackName].plotData = plotsArr;
                    formattedObject.selectedPlotTrack = selectedTrack;
                }

            }
            else {
                console.log("No track view data found");
            }
        }

        return formattedObject;
    }

    //Returns an array of window instance objects
    //viewsData represents the unformatted tracker information about the window contents
    //selectedViewTypeArr represents an array of the view type of each window, e.g. selectedViewTypeArr[0] = "Plot View"
    ns.contructWindowInstances = function (viewsData, selectedViewTypeArr) {

        //Format the tracker data into a more useable object
        var formattedWindowViewData = ns.viewDataFormatter(viewsData, selectedViewTypeArr);

        var windowViewInstanceArr = [];
        var numericIndex = null;
        var formattedKey = null;
        var viewType = null;
        var thisWindowView = null;
        var windowInstance = null;
        var selectedTrack = null;;

        //Gets an object literal containing ALL the tracks in this tracker file
        var trackObjectLiteral = ns.trackerDataInstance.tracksContainer.getTracks();

        //If there is no selected track, set the selected track as the first track option
        var defaultSelectedTrack = Object.keys(trackObjectLiteral)[0];



        //Go through each window and determine what to display initially based on the selected view type
        //(Each window contains a viewtype and a default track to display for each view case (such as plot or table))
        for (var windowViewIndex in selectedViewTypeArr) {

            numericIndex = ns.bracketIndexToInt(windowViewIndex);

            formattedKey = "window" + numericIndex;

            thisWindowView = formattedWindowViewData[formattedKey];
            viewType = selectedViewTypeArr[windowViewIndex];


            if (typeof thisWindowView == 'undefined') {
                //Default window in case no window data is specified (happens especially with page or world views)
                selectedTrack = defaultSelectedTrack;
            }
            else {

                //Sets the selectedTrack
                if (viewType == "Plot View") {

                    selectedTrack = formattedWindowViewData[formattedKey].trackViews.selectedPlotTrack;;
                }
                else {
                    selectedTrack = formattedWindowViewData[formattedKey].trackViews.selectedTableTrack;
                }


            }

            //TODO: This final check is need in case the selected track in the above if else case fails. Leave it in?
            if (typeof selectedTrack == 'undefined' || selectedTrack == '' || selectedTrack == null) {
                selectedTrack = defaultSelectedTrack;
            }

            //Create new instance to add to the overall windowViewInstance array
            windowInstance = new ns.domain.trackViewWindow(numericIndex, selectedTrack, viewType);

            //For each track present in this tracker file       
            for (var trackName in trackObjectLiteral) {

                var trackViewData;
                var trackViewObject;

                if (typeof formattedWindowViewData[formattedKey] != 'undefined') {
                    trackViewData = formattedWindowViewData[formattedKey].trackViews[trackName];
                }
                else {
                    trackViewData = undefined;
                }

                if (typeof trackViewData != "undefined") {
                    //This creates a new trackViewObject so we can fill it with the general information we just fetched
                    trackViewObject = new ns.domain.trackViewObject(trackName);
                    var plotInstanceArr = [];

                    //If there's no data given for plots, we need to at least create an array
                    if (typeof trackViewData.plotData == 'undefined') {
                        trackViewData.plotData = [];
                    }

                    for (var plotNumber = 0; plotNumber < 3; plotNumber++) {

                        if (typeof trackViewData.plotData[plotNumber] == 'undefined') {//If there's not data for any of the three plots, create the default
                            //Pass in the plot number within the window instance and its visibility
                            var visibility = ((plotNumber == 0) ? true : false);
                            plotInstance = createDefaultPlot(plotNumber, visibility)
                        }
                        else {//Otherwise, create plot according to the specified data
                            var plotData = trackViewData.plotData[plotNumber];
                            //Specified plots are always visible
                            var plotInstance = new ns.domain.plotObject(plotData.plotIndex, plotData.xAxisName, plotData.yAxisName, plotData.plotOptions, true);
                        }

                        plotInstanceArr.push(plotInstance);
                    }
                    trackViewObject.addArrayOfPlots(plotInstanceArr);


                    var tableInstance;

                    //Need to perform the same check for tableData
                    if (typeof trackViewData.tableData != "undefined") {//We have table data

                        tableInstance = new ns.domain.tableObject(trackViewData.tableData);

                        trackViewObject.addTable(tableInstance);
                    }
                    else {//We don't have plot data and need to make a default table
                        tableInstance = createDefaultTable();
                    }

                    trackViewObject.addTable(tableInstance);

                }
                else {//If there is no data given a all we will just make a default trackView with default plots and tables

                    var trackViewObject = createDefaultTrackView(trackName);

                }

                trackViewObject.setData('pageViewText', formattedWindowViewData.pageViewText);
                windowInstance.addTrackView(trackViewObject);
            }
            windowViewInstanceArr.push(windowInstance);
        }
        return windowViewInstanceArr;
    }

    //Sometime when no trackview data is specified we need a trackView populated entirely with defaults, this accomplishes that
    var createDefaultTrackView = function (trackName) {
        var trackInstance = new ns.domain.trackViewObject(trackName);

        //Create three plots, make the first one visible
        for (var plotNumber = 0; plotNumber < 3; plotNumber++) {
            var visibility = ((plotNumber == 0) ? true : false);
            var defaultPlot = createDefaultPlot(plotNumber, visibility);

            trackInstance.addPlot(defaultPlot);
        }

        var defaultTable = createDefaultTable();

        trackInstance.addTable(defaultTable);

        return trackInstance;
    }

    //Takes in the number of the plot within the window (0, 1, or 2)
    var createDefaultPlot = function (plotNumber, visibility) {

        if (plotNumber > 2 || plotNumber < 0) {
            plotNumber = 0;
        }

        var plotDefaultArr = [];
        plotDefaultArr[0] = {
            xAxisName: 't',
            yAxisName: 'x'
        }
        plotDefaultArr[1] = {
            xAxisName: 't',
            yAxisName: 'y'
        }
        plotDefaultArr[2] = {
            xAxisName: 't',
            yAxisName: 'x'
        }

        var plotIndex = 0;
        var plotOptions = {
            lines: true,
            points: true
        };

        return new ns.domain.plotObject(plotNumber, plotDefaultArr[plotNumber].xAxisName, plotDefaultArr[plotNumber].yAxisName, plotOptions, visibility);
    }

    //Creates a table with default column x, y, and t
    var createDefaultTable = function () {
        var arrayOfColumnNames = ['t', 'x', 'y'];

        return new ns.domain.tableObject(arrayOfColumnNames);
    }

    //Initializes global properties in xmlReader for a specific tracker file instance
    ns.initializeProperties = function (instance) {

        var imageCoordSystemData = instance.findClassData(ns.dataPaths.imageCoordinateSystem);
        var windowData = instance.findClassData(ns.dataPaths.rootSelector);
        var videoClipData = instance.findClassData(ns.dataPaths.videoClip);
        var clipControl = instance.findClassData(ns.dataPaths.clipControl);
        var trackerPanel = instance.findClassData(ns.dataPaths.trackerPanel);
        var coordAxis = instance.findClassData(ns.dataPaths.coordinateAxis);

        ns.initializePropertiesObject(videoClipData, instance.videoProperties);
        ns.initializePropertiesObject(clipControl, instance.videoProperties);
        ns.initializePropertiesObject(trackerPanel, instance.videoProperties);

        ns.initializePropertiesObject(imageCoordSystemData, instance.imageCoordinateSystemProperties);
        ns.initializePropertiesObject(windowData, instance.windowProperties);
        ns.initializePropertiesObject(coordAxis, instance.imageCoordinateSystemProperties);

        //Need an array of valid frame indices based on video properties
        instance.videoProperties.validFrameIndices = ns.calculateFrameIndices(instance.videoProperties.startframe, instance.videoProperties.stepsize, instance.videoProperties.stepcount);

        if (windowData.length != 0) {
            var views = windowData[0].views;
        }
    };

    //This function loads the xml and gathers the track instances dfor every track type
    ns.initializeTracks = function (readerInstance, trackerDataInstance) {
        /*Temporarily stores all tracks of all types so that they can be pushed into the global trackerDataInstance
       The general structure would look something like:
       tracks = {
       pointMasses: [pointmass1, pointmass2, etc.]
       centerOfMass: [centerofMass1, centerOfMass2, etc.]
       }
       */
        var tracks = {};

        //Creates array of pointMasses 
        var pointMassesData = readerInstance.findClassData(ns.dataPaths.pointMasses);
        tracks.pointMass = ns.instantiatePointMasses(pointMassesData, readerInstance.imageCoordinateSystemProperties);//Array of point masses

        //Creates array of centerOfMasses 
        var centersOfMassData = readerInstance.findClassData(ns.dataPaths.centerOfMass);
        //TODO: change from using pointMasses specifically to using any tracks of this general structure
        tracks.centerOfMass = ns.instantiateCentersOfMass(centersOfMassData, tracks.pointMass);//Array of centers of mass 

        //Creates array of analyticalParticles 
        var analyticalParticleData = readerInstance.findClassData(ns.dataPaths.analyticalParticle);
        //TODO: change from using pointMasses specifically to using any tracks of this general structure


        tracks.analyticalParticle = ns.instantiateAnalyticalParticles(analyticalParticleData, tracks.pointMass);//Array of analyticalParticles

        //TODO: handle other track types

        //Adds all of the tracks generated above to the trackContainer
        for (var trackType in tracks) {

            for (var trackIndex in tracks[trackType]) {

                var trackInstance = tracks[trackType][trackIndex];
                var trackName = trackInstance.getData().name;

                trackerDataInstance.tracksContainer.addTrack(trackType, trackName, trackInstance);
            }
        }
    }

    //Creates an array of all the point masses via the xml
    ns.instantiatePointMasses = function (pointMassesData, readerInstanceImageCoordinateProperties) {

        var pointMasses = [];

        for (var pointMass in pointMassesData) {

            var _corePointMassData = {};

            _corePointMassData.name = pointMassesData[pointMass].name;
            _corePointMassData.mass = parseFloat(pointMassesData[pointMass].mass);
            _corePointMassData.note = pointMassesData[pointMass].description
            _corePointMassData.visible = pointMassesData[pointMass].visible;
            _corePointMassData.footprintData = {};
            _corePointMassData.footprintData.red = pointMassesData[pointMass].color.red;
            _corePointMassData.footprintData.green = pointMassesData[pointMass].color.green;
            _corePointMassData.footprintData.blue = pointMassesData[pointMass].color.blue;
            _corePointMassData.footprintData.alpha = pointMassesData[pointMass].color.alpha;

            //Footprint options are a string which we can parse to determine various options
            var footprintString = parseFootprintOptions(pointMassesData[pointMass]['footprint']);
            _corePointMassData.footprintData.footprint = footprintString.type;
            _corePointMassData.footprintData.bold = footprintString.bold;
            _corePointMassData.footprintData.radius = footprintString.radius;

            //TODO: Currently if a point mass track does not have any frame information, we don't add it to the global track data instance
            //This could change if track modification is implemented
            if (Object.size(pointMassesData[pointMass].framedata) !== 0) {
                var pointMassInstance = new ns.domain.pointMass(_corePointMassData);

                for (var frame in pointMassesData[pointMass].framedata) {

                    var xVal = parseFloat(pointMassesData[pointMass].framedata[frame].x);

                    var yVal = parseFloat(pointMassesData[pointMass].framedata[frame].y);

                    frame = ns.bracketIndexToInt(frame);

                    pointMassInstance.addFrame(frame, xVal, yVal);
                }

                //A check to make sure this pointmass meets the requirements to be added to the page
                var isValid = pointMassValidCheck(pointMassInstance);

                if (isValid) {
                    pointMasses.push(pointMassInstance);
                }

            }
        }
        return pointMasses;
    }

    //There are several issues that can cause a pointmass to be invalid, this function performs those checks and returns a bool based off of the validity of the pointmass instance
    var pointMassValidCheck = function (pointMassInstance) {

        var pointMassData = pointMassInstance.getData();
        var frameData = pointMassInstance.getFrameData();

        var isValidFrames = validFramesCheck(frameData);

        if (frameData.frames.length === 0) {//Let user know that a track was skipped due to no frame data being present
            var errorTitle = 'No frame data present.';

            var errorMessage = 'Track ' + pointMassData.name + ' has not been initialized because no frame data was found.';

            ns.launchErrorDialog(errorTitle, errorMessage);

            return false;
        }
        else if (!isValidFrames) {//Check for valid data at every frame step

            var errorTitle = 'Invalid Track Frame Data';

            var errorMessage = 'The data in Track ' + pointMassData.name + ' has irregular stepsizes and therefore has not been initialized';

            ns.launchErrorDialog(errorTitle, errorMessage);

            return false;

        }
        else {
            return true;
        }
    }

    //Sometime tracks have datapoints that arent evenly spaced so this function checks for that
    var validFramesCheck = function (frameData) {

        //Basically all we care about right now is that the frame values are evenly spaced apart
        var stepSize = frameData.frames[1] - frameData.frames[0]

        for (var i = 0; i < frameData.frames.length - 1; i++) {

            if (frameData.frames[i] + stepSize != frameData.frames[i + 1]) {
                return false;
            }
        }

        return true;
    }

    //Creates an array of all the center of masses via the xml. TODO: change from pointMassInstancesArr to Arr of all tracks of this type.
    ns.instantiateCentersOfMass = function (centersOfMassData, tracksArr) {

        var centersOfMass = [];

        //We need to create a center of mass instance for each one present in the xml
        for (centerOfMassIndex in centersOfMassData) {

            var centerOfMassData = centersOfMassData[centerOfMassIndex];

            //Grab the necessary data to create the base information of mass instance
            var centerOfMassName = centerOfMassData.name;
            var linkedPointMassesArr = centerOfMassData.masses;
            var centerOfMassMass = parseFloat(centerOfMassData.mass);
            var legendDataArr = centerOfMassData.color;
            legendDataArr['footprint'] = centerOfMassData.footprint;
            var note = centerOfMassData.description;
            var visibility = centerOfMassData.visible;

            var _coreCenterOfMassData = {};
            _coreCenterOfMassData.name = centerOfMassName;
            _coreCenterOfMassData.totalMass = centerOfMassMass;
            _coreCenterOfMassData.note = note;
            _coreCenterOfMassData.visible = visibility;
            _coreCenterOfMassData.linkedMasses = linkedPointMassesArr;
            _coreCenterOfMassData.footprintData = {};
            _coreCenterOfMassData.footprintData.red = legendDataArr.red;
            _coreCenterOfMassData.footprintData.green = legendDataArr.green;
            _coreCenterOfMassData.footprintData.blue = legendDataArr.blue;
            _coreCenterOfMassData.footprintData.alpha = legendDataArr.alpha;
            _coreCenterOfMassData.footprintData.footprint = legendDataArr.footprint;

            //Footprint options are a string which we can parse to determine various options
            var footprintString = parseFootprintOptions(legendDataArr.footprint);
            _coreCenterOfMassData.footprintData.footprint = footprintString.type;
            _coreCenterOfMassData.footprintData.bold = footprintString.bold;
            _coreCenterOfMassData.footprintData.radius = footprintString.radius;

            //Pass in array of linked track instances and individual center of mass data from xml
            var centerOfMassInstance = ns.createCenterOfMass(_coreCenterOfMassData, tracksArr);

            centersOfMass.push(centerOfMassInstance);
        }
        return centersOfMass;
    }

    /* Note: the contents of a proper _coreCenterOfMassData object literal are enumerated above
    TODO: change tracksArr Arr of all tracks of this type
    Takes in array of all pointMass instances, a string name, an array of string names corresponding to linked tracks, a numeric mass, legend info,
    a note string (if any), and a string "true" or "false" for visibility.
    */
    ns.createCenterOfMass = function (_coreCenterOfMassData, tracksArr) {

        //Actual instance
        var centerOfMassInstance = new ns.domain.centerOfMass(_coreCenterOfMassData);

        //Need to make sure that any frames that don't have values for every connected point mass track are removed
        var numberOfMasses = _coreCenterOfMassData.linkedMasses.length;

        //Array used to combine all values into averages so they can be added to the center of mass instance
        var averagesArr = [];

        //Calculate data for every point mass the center of mass is linked to
        for (track in _coreCenterOfMassData.linkedMasses) {

            //Get the appropriate point mass and its data
            var trackToAdd = getTrackDataByName(_coreCenterOfMassData.linkedMasses[track], tracksArr);
            var trackToAddFrameData = trackToAdd.getFrameData();
            var trackToAddMass = trackToAdd.getData().mass;

            //Need to add data from each frame
            for (var index in trackToAddFrameData.frames) {
                //Keep track to make sure that any frames that don't have values for every connected point mass track are removed
                var trackFrameCounter = 1;

                var frameNumber = trackToAddFrameData.frames[index];

                var xValue = (trackToAddFrameData.x[index] * trackToAddMass) / _coreCenterOfMassData.totalMass;

                var yValue = (trackToAddFrameData.y[index] * trackToAddMass) / _coreCenterOfMassData.totalMass;

                //Create frame object instance and tally how many times this frame index has been added to the center of mass
                var frameObject = new ns.domain.frame(frameNumber, xValue, yValue);
                frameObject['count'] = trackFrameCounter;

                //If true, this is the first frame to be added to this index
                if (typeof averagesArr[frameNumber] == 'undefined') {
                    averagesArr[frameNumber] = frameObject;
                }
                    //Otherwise one or more frames have been added to the index, so increment the count and average the values
                else {
                    var incrementedCount = averagesArr[frameNumber]['count'] + 1;
                    var frameAverage = averageFrameElements(frameObject, averagesArr[frameNumber], incrementedCount);
                    averagesArr[frameNumber] = frameAverage;
                }
            }
        }
        for (var index in averagesArr) {
            //We only want to add the frame if every point mass connected to the center of mass had information for this frame
            if (averagesArr[index].count == numberOfMasses) {
                centerOfMassInstance.addFrame(averagesArr[index]);
            }
        }
        return centerOfMassInstance;

    }

    //Creates an array of all the point masses via the xml
    ns.instantiateAnalyticalParticles = function (analyticalParticleData, readerInstanceImageCoordinateProperties) {

        var models = [];

        for (var model in analyticalParticleData) {

            var _coreAnalyticalParticleData = {};

            //Need the above object to contain of the core data defined in the analytical model instance
            _coreAnalyticalParticleData.name = analyticalParticleData[model].name;
            _coreAnalyticalParticleData.mass = parseFloat(analyticalParticleData[model].mass);
            _coreAnalyticalParticleData.note = analyticalParticleData[model].description
            _coreAnalyticalParticleData.visible = analyticalParticleData[model].visible;
            _coreAnalyticalParticleData.startFrame = analyticalParticleData[model].start_frame;

            //Footprint data 
            _coreAnalyticalParticleData.footprintData = {};
            _coreAnalyticalParticleData.footprintData.red = analyticalParticleData[model].color.red;
            _coreAnalyticalParticleData.footprintData.green = analyticalParticleData[model].color.green;
            _coreAnalyticalParticleData.footprintData.blue = analyticalParticleData[model].color.blue;
            _coreAnalyticalParticleData.footprintData.alpha = analyticalParticleData[model].color.alpha;

            //Footprint options are a string which we can parse to determine various options
            var footprintString = parseFootprintOptions(analyticalParticleData[model]['footprint']);

            _coreAnalyticalParticleData.footprintData.footprint = footprintString.type;
            _coreAnalyticalParticleData.footprintData.bold = footprintString.bold;
            _coreAnalyticalParticleData.footprintData.radius = footprintString.radius;

            //Need the string which defines what this model should be based off of, we grab these strings below
            var xFunctionString = analyticalParticleData[model].main_functions['[0]'].expression;
            var yFunctionString = analyticalParticleData[model].main_functions['[1]'].expression;

            _coreAnalyticalParticleData.xExpression = xFunctionString;
            _coreAnalyticalParticleData.yExpression = yFunctionString;

            //Instantiates the analytical particle
            var analyticalParticleInstance = new ns.domain.analyticalParticle(_coreAnalyticalParticleData);

            //Creates a new math parsing object which keeps track of the scope of our values defined below
            var parser = math.parser();

            //Here we have a loop which adds all of the initial values of the variables to the scope of our parser
            for (var bracketIndex in analyticalParticleData[model].initial_values) {
                var initialValueData = analyticalParticleData[model].initial_values[bracketIndex];

                //TODO: We only hadle numbers right now, we need to add functions as well
                parser.set(initialValueData.name, parseInt(initialValueData.function));
            }

            //Here we have a loop which adds all of the user parameters to the scope of our parser
            for (var bracketIndex in analyticalParticleData[model].user_parameters) {
                var paramData = analyticalParticleData[model].user_parameters[bracketIndex];

                //TODO: We only hadle numbers right now, we need to add functions as well
                parser.set(paramData.name, parseFloat(paramData.function));
            }

            /*
            TODO: for now we assume that the only variables within these models will be time, may not be true
            Should really be adding all variables as paraqmeters in the xFunc and yFunc dynamically
            */

            //These two lines create functions in the scope of the parser for the x and y values
            parser.eval('function xFunc(t) = ' + xFunctionString);
            parser.eval('function yFunc(t) = ' + yFunctionString);

            //Need to get the functions defined above into a useful form that can be evaluated for each frame value
            var xFunc = parser.get('xFunc');
            var yFunc = parser.get('yFunc');

            //Now that we have our x and y Functions we can loop through the frames and add the frames accordingly

            //Need video data in order to determine when to stop calculating values
            var videoObjectLiteral = ns.trackerDataInstance.getVideoObjectLiteral();
            var coordinateSystemObjectLiteral = ns.trackerDataInstance.getCoordinateSystemObjectLiteral();

            var finalFrameIndex = videoObjectLiteral.frameCount;
            var deltaT = videoObjectLiteral.deltaT / 1000;

            var xTranslate = coordinateSystemObjectLiteral.xOrigin;
            var yTranslate = coordinateSystemObjectLiteral.yOrigin;

            for (var currentFrame = parseInt(_coreAnalyticalParticleData.startFrame) ; currentFrame <= finalFrameIndex; currentFrame++) {

                //Gives us the current time
                var currentTime = deltaT * currentFrame;

                /*
                TODO: Need to implement inverse of shift / rotate functions found in tracker math, right now we are just translating
                */
                //Evaluatyes the x and y functions at the given t value, need to be adjusted because they are relative to the axis and we want to store pixelX and pixelY values
                var xValue = xFunc(currentTime) + xTranslate;
                var yValue = yFunc(currentTime) + yTranslate;

                analyticalParticleInstance.addFrame(currentFrame, xValue, yValue);
            }

            //TODO: The maths are right but they shouldnt be adjusted according to the coordinate axis like they are 

            models.push(analyticalParticleInstance);
        }

        return models;
    }

    //Footprint options in the xml are a string which we can parse to determine various options
    var parseFootprintOptions = function (footprintString) {

        var _footprintOptions = {
            bold: false,
            radius: 0,
            type: 'Diamond',
        }

        footprintString = footprintString.replace(/\s+/g, '');//remove whitespace

        if (footprintString.indexOf('.' != -1)) {
            footprintString = footprintString.split('.')[1];
        }
        if (footprintString.indexOf('Bold') != -1) {
            footprintString = footprintString.replace('Bold', '');
            _footprintOptions.bold = true;
        }
        if (footprintString.indexOf('#') != -1) {//The circle radius is identified like #4
            _footprintOptions.radius = parseInt(footprintString.match(/\d/)[0]);
            /* 
            TODO:Some other parameters are specified in the xml specifically for circles
            that we don't support yet so we're just removing them for now.
            */
            footprintString = footprintString.split('#')[0];
        }

        //If we don't have instructions enumerated for a shape, default to diamond
        if (typeof ns.footprints[footprintString] !== 'undefined') {
            _footprintOptions.type = footprintString;
        }

        return _footprintOptions;
    }

    //Want to return appropriate point mass that a given center of mass is linked to from the overall point mass array
    var getTrackDataByName = function (centerOfMassName, tracksArr) {

        for (track in tracksArr) {

            var trackName = tracksArr[track].getData().name;

            if (trackName == centerOfMassName) {
                return tracksArr[track];
            }
        }
        console.error('Center of mass contains invalid point mass track name.');
        return null;
    }

    //Averages the values of two frames allowing centers of mass to keep a running total of their frame values
    var averageFrameElements = function (firstFrameObj, secondFrameObj, incrementedCount) {

        var avgX = (firstFrameObj.x + secondFrameObj.x);
        var avgY = (firstFrameObj.y + secondFrameObj.y);

        var averageFrame = new ns.domain.frame(firstFrameObj.frameIndex, avgX, avgY);
        averageFrame.count = incrementedCount;
        return averageFrame;
    }

    //Find text in unformattedObject
    var findPageViewText = function (unformattedObj) {

        if (typeof unformattedObj == 'undefined') {
            return undefined;
        }

        if (typeof unformattedObj['text'] !== 'undefined') {
            return unformattedObj['text'];
        }
        else {
            for (var item in unformattedObj) {
                console.log(unformattedObj)
                console.log(unformattedObj[item])
                if (typeof unformattedObj[item] == 'object') {
                    return findPageViewText(unformattedObj[item])
                }
            }
        }
    }

    //Converts a frame from its original format as a string "[3]" to an int 3
    ns.bracketIndexToInt = function (bracketIndex) {
        bracketIndex = bracketIndex.replace("[", "");
        bracketIndex = parseInt(bracketIndex.replace("]", ""));
        return bracketIndex;
    }

}(ed, $));
