(function (ns) {
    /*This file defines the structure of all primary objects.*/

    /*
    This represents the container for all primary tracker data.
    It can be accessed through through the instance: ns.trackerDataInstance which is created in main.js
    */
    ns.trackerData = function (videoObjectLiteral, coordinateSystemObjectLiteral, selectedTrack) {

        var _coordinateSystemObjectLiteral = {};

        //**NOTE** The right hand side of these expressions are not camel-cased because they came from Tracker
        _coordinateSystemObjectLiteral.fixedOrigin = coordinateSystemObjectLiteral.fixedorigin || true;
        _coordinateSystemObjectLiteral.fixedAngle = coordinateSystemObjectLiteral.fixedangle || true;
        _coordinateSystemObjectLiteral.fixedScale = coordinateSystemObjectLiteral.fixedscale || true;
        _coordinateSystemObjectLiteral.locked = coordinateSystemObjectLiteral.locked || true;
        _coordinateSystemObjectLiteral.xOrigin = coordinateSystemObjectLiteral.xorigin;//A point in pixel units
        _coordinateSystemObjectLiteral.yOrigin = coordinateSystemObjectLiteral.yorigin;//A point in pixel units
        _coordinateSystemObjectLiteral.angle = coordinateSystemObjectLiteral.angle;//Angle is in degrees
        _coordinateSystemObjectLiteral.xScale = coordinateSystemObjectLiteral.xscale;
        _coordinateSystemObjectLiteral.yScale = coordinateSystemObjectLiteral.yscale;
        _coordinateSystemObjectLiteral.visible = coordinateSystemObjectLiteral.visible;//"true" or "false"
        _coordinateSystemObjectLiteral.trail = coordinateSystemObjectLiteral.trail;///"true" or "false"
        _coordinateSystemObjectLiteral.footprintData = {
            red: coordinateSystemObjectLiteral.red || 255,
            green: coordinateSystemObjectLiteral.green || 0,
            blue: coordinateSystemObjectLiteral.blue || 0,
            alpha: coordinateSystemObjectLiteral.alpha || 0.75,
            footprint: coordinateSystemObjectLiteral.footprint,
        };


        var _videoObjectLiteral = {};

        //**NOTE** The right hand side of these expressions are not camel-cased because they came from Tracker
        _videoObjectLiteral.path = videoObjectLiteral.path;//String path to the video of the form Player/Ed.TrackerPlayer/Ed.TrackerPlayer/Videos/Pendulum.gif
        _videoObjectLiteral.startFrame = videoObjectLiteral.startframe || 0;//This is the first frame in the video
        _videoObjectLiteral.stepSize = videoObjectLiteral.stepsize || 1;//The step size between frames--value should never be zero 
        _videoObjectLiteral.stepCount = videoObjectLiteral.stepcount || 0;
        _videoObjectLiteral.startTime = videoObjectLiteral.starttime / 1000 || 0;//Divided by 1000 to convert to ms
        _videoObjectLiteral.frameCount = videoObjectLiteral.framecount || _videoObjectLiteral.startFrame + _videoObjectLiteral.stepCount * _videoObjectLiteral.stepSize;//Overall number of frames
        _videoObjectLiteral.rate = videoObjectLiteral.rate || 1;//Represents video play rate as whole number--1 means video should play at 100% speed
        _videoObjectLiteral.deltaT = videoObjectLiteral.delta_t || 33.366700033366704;
        _videoObjectLiteral.frame = videoObjectLiteral.frame || 0;//This is the frame the video starts on
        _videoObjectLiteral.magnification = videoObjectLiteral.magnification || 1;
        _videoObjectLiteral.validFrameIndices = videoObjectLiteral.validFrameIndices;

        //Will be set when calculated by the scrubber processing
        _videoObjectLiteral.videoHeight = null;
        _videoObjectLiteral.videoWidth = null;
        _videoObjectLiteral.aspectRatio = null;


        //Selected track note to display on page start
        this.selectedTrack = selectedTrack;

        this.tracksContainer = new ns.tracksContainer();

        this.dataToolContainer = new ns.dataToolContainer();

        this.getCoordinateSystemObjectLiteral = function () {
            return $.extend(true, {}, _coordinateSystemObjectLiteral);
        }

        this.setCoordinateSystemObjectLiteral = function (parameterKey, newValue) {
            _coordinateSystemObjectLiteral[parameterKey] = newValue;
        }

        this.getVideoObjectLiteral = function () {
            return $.extend(true, {}, _videoObjectLiteral);
        }

        this.setVideoObjectLiteral = function (parameterKey, newValue) {
            _videoObjectLiteral[parameterKey] = newValue;
        }

    };

    /*This object contains tracks of every type.
       Modeling tracks could be easily implemented by following the structure used by point masses and centers of mass.
       Instantiating tracks of these types will cause them to be represented throughout the program automatically: 
       points will be drawn to screen, they'll appear in all the menus etc..
       Measuring and calibration tools would require a different structure.
    */
    ns.tracksContainer = function () {

        var _pointMassObjectLiteral = {};//Implemented

        var _centerOfMassObjectLiteral = {};//Implemented

        var _vectorSumObjectLiteral = {};//TODO: implement

        var _vectorObjectLiteral = {};//TODO: implement

        var _lineProfileObjectLiteral = {};//TODO: implement

        var _rgbRegionObjectLiteral = {};//TODO: implement

        var _analyticalParticleObjectLiteral = {};//TODO: implement

        var _dynamicParticleModelObjectLiteral = {};//TODO: implement

        var _measuringToolsObjectLiteral = {};//TODO: implement

        var _calibrationToolsObjectLiteral = {};//TODO: implement

        this.addTrack = function (trackType, trackName, trackInstance) {

            var trackObjectLiteral = _trackTypeMap[trackType];

            trackObjectLiteral[trackName] = trackInstance;
        };

        /*
        Checks if there is a track of the given name of each type--if so, it returns the track object (pointMass, centerOfMass, etc.),
        if not, it returns an undefined object;
        */
        this.getTrackByName = function (trackName) {

            var trackObjectLiteral;

            for (var trackTypeIndex in _trackTypeMap) {

                var possibleTrack = this.getTrack(trackTypeIndex, trackName);

                if (typeof possibleTrack !== 'undefined') {
                    trackObjectLiteral = possibleTrack;
                }
            }
            return trackObjectLiteral;
        };

        /*A faster get track function if you know the type as well as the name.*/
        this.getTrack = function (trackType, trackName) {

            var trackObjectLiteral = _trackTypeMap[trackType];

            if (typeof trackName === "undefined") {//Safety in case track name is missing
                return trackObjectLiteral;
            }
            else if (typeof trackObjectLiteral === "undefined") {//Safety in case there is no track by the track name of that track type
                return undefined;
            }
            else {
                return trackObjectLiteral[trackName];
            }

        };

        /* Returns all tracks of given type as specified by _trackTypeMap */
        this.getTracksByType = function (trackType) {

            var trackObjectLiteral = _trackTypeMap[trackType];

            return trackObjectLiteral;


        };
        /* Retrieves all tracks. */
        this.getTracks = function () {
            return $.extend(true, {}, _pointMassObjectLiteral, _centerOfMassObjectLiteral, _vectorSumObjectLiteral, _lineProfileObjectLiteral, _rgbRegionObjectLiteral,
                _analyticalParticleObjectLiteral, _dynamicParticleModelObjectLiteral, _measuringToolsObjectLiteral, _calibrationToolsObjectLiteral);
        };


        this.deleteTrack = function (trackType, trackName) {

            delete _trackTypeMap[trackType][trackName];

        };


        /* Maps the type of each track to that track's objectLiteral.
           Protects accessor from needing to know full track type object name, and allows easy renaming. 
        */
        var _trackTypeMap = {
            pointMass: _pointMassObjectLiteral,
            centerOfMass: _centerOfMassObjectLiteral,
            vectorSum: _vectorSumObjectLiteral,
            vector: _vectorObjectLiteral,
            lineProfile: _lineProfileObjectLiteral,
            rgbRegion: _rgbRegionObjectLiteral,
            analyticalParticle: _analyticalParticleObjectLiteral,
            dynamicParticleModel: _dynamicParticleModelObjectLiteral,
            measuringTools: _measuringToolsObjectLiteral,
            calibrationTools: _calibrationToolsObjectLiteral,
        };
    };


    /*------Tracks----------*/

    /* 
    All pointMasses that exist in the tracker file are created in xmlReader by instantiatePointMasses.
    New pointMasses could be easily specified by passing in the core data and adding the pointMass instance to the tracksContainer:
    ns.trackerDataInstance.tracksContainer.addTrack(pointMassInstance), then add frame information frame-by-frame.
    */
    ns.pointMass = function (corePointMassData) {

        /* Represents all core data that we use from Tracker file for a given pointMass track except for frame information. */
        var _pointMassData = {
            type: 'pointMass',
            name: 'Default Point Mass',
            mass: 1,
            note: '',
            visible: 'true',
            footprintData: {
                red: '255',
                green: '0',
                blue: '0',
                alpha: '255',
                footprint: 'diamond',
                bold: false,
                radius: 0,//Only specified and used if the footprint is a circle
            }
        };

        _pointMassData = $.extend(true, {}, _pointMassData, corePointMassData)

        this.getData = function () {
            return _pointMassData;
        };

        this.setData = function (parameterKey, newValue) {

            _pointMassData[parameterKey] = newValue;
        };

        /* All frames are added individually, rather than at pointMass creation for many reasons,
        such as allowing new pointMasses to be created frame by frame in the future. This represents an array of frame objects.*/
        var _frames = [];

        /* Separated out from the general getData() function for efficiency. */
        this.getFrameData = function () {

            var _frameData = {
                x: [],
                y: [],
                frames: [],
            };
            for (var frame = 0; frame < _frames.length; frame++) {
                _frameData.x.push(_frames[frame].x);

                _frameData.y.push(_frames[frame].y);

                _frameData.frames.push(_frames[frame].frameIndex);
            }
            return _frameData;
        };

        /* xValue and yValue are assumed to be the raw pixel positions (not calculated x y values), such as those found in the tracker xml. */
        this.addFrame = function (frameIndex, xValue, yValue) {

            var frameInstance = new ns.frame(frameIndex, xValue, yValue);

            _frames.push(frameInstance);
        };
    };

    /* 
    All centersOfMass that exist in the tracker file are created in xmlReader by instantiateCentersOfMass.
    New centersOfMass could be specified by making use of ns.createCenterOfMass in xmlReader and adding the centerOfMass instance to the tracksContainer:
    ns.trackerDataInstance.tracksContainer.addTrack(centerOfMass), frame values will be calculated automatically by the createCenterOfMass function.
    */
    ns.centerOfMass = function (coreCenterOfMassData) {

        /* Represents all core data that we use from Tracker file for a given centerOfMass track except for frame information. */
        var _centerOfMassData = {
            type: 'centerOfMass',
            name: 'Default Center Of Mass',
            totalMass: 1,
            note: '',
            visible: 'true',//String 'true' or 'false'
            linkedMasses: [], //['mass A', 'mass B', 'Jabba the Hutt', 'Pizza the Hutt']
            footprintData: {
                red: '255',
                green: '0',
                blue: '0',
                alpha: '255',
                footprint: 'diamond',
                bold: false,
                radius: 0,//Only specified and used if the footprint is a circle
            }
        };

        _centerOfMassData = $.extend(true, {}, _centerOfMassData, coreCenterOfMassData);

        this.getData = function () {
            return _centerOfMassData;
        };

        this.setData = function (parameterKey, newValue) {

            _centerOfMassData[parameterKey] = newValue;
        };

        /*  This represents an array of frame objects. */
        var _frames = [];

        /* Separated out from the general getData() function for efficiency. */
        this.getFrameData = function () {

            var _frameData = {
                x: [],
                y: [],
                frames: [],
            };
            for (var frame = 0; frame < _frames.length; frame++) {
                _frameData.x.push(_frames[frame].x);

                _frameData.y.push(_frames[frame].y);

                _frameData.frames.push(_frames[frame].frameIndex);
            }
            return _frameData;
        };

        /* Frames are added automatically when created by ns.createCenterOfMass */
        this.addFrame = function (frame) {
            _frames.push(frame);
        };


    };

    /*------Tracks to be implemented in the future----------*/
    /* Modeling tracks should probably be created so that they mimic the structure of pointMasses/centersOfMass.
    i.e. Calculate frames upon creation of the object and use the same style core data/getters/setters as pointMasses.
    This will allow the tracks to be drawn immediately, be shown in all menus, and have all other expected functionality.
    */
    ns.vectorSum = function () { };

    ns.vector = function () { };

    ns.lineProfile = function () { };

    ns.rgbRegion = function () { };

    ns.analyticalParticle = function (coreAnalyticalParticleData) {
        /* Represents all core data that we use from Tracker file for a given pointMass track except for frame information. */
        var _analyticalParticleData = {
            name: 'Default Analytical Model',
            type: 'analyticalParticle',
            visible: 'true',
            xExpression: 't',
            yExpression: 't',
            mass: 1,
            note: '',
            footprintData: {
                red: '255',
                green: '0',
                blue: '0',
                alpha: '255',
                footprint: 'diamond',
                bold: false,
                radius: 0,//Only specified and used if the footprint is a circle
            },
            //userParams: {
            //    /*                
            //    will contain elements of the form:
            //    m : {
	        //        name: m,
            //        function: 10.0,
            //        editable: true,
            //        name_editable: false,
            //        description: 'Mass of this particle'
            //    }
            //    */

            //},
            //initialValues: {
            //    /*
            //    will contain elements of the form:
            //    t: {
            //        'description': "Initial time",
            //        'editable': "true",
            //        'function': "9.000",
            //        'length': 0,
            //        'name': "t",
            //        'name_editable': "false"
            //    }
            //    */
            //}
        };

        _analyticalParticleData = $.extend(true, {}, _analyticalParticleData, coreAnalyticalParticleData)

        this.getData = function () {
            return _analyticalParticleData;
        };

        this.setData = function (parameterKey, newValue) {

            _analyticalParticleData[parameterKey] = newValue;
        };

        /* All frames are added individually, rather than at pointMass creation for many reasons,
        such as allowing new pointMasses to be created frame by frame in the future. This represents an array of frame objects.*/
        var _frames = [];

        /* Separated out from the general getData() function for efficiency. */
        this.getFrameData = function () {

            var _frameData = {
                x: [],
                y: [],
                frames: [],
            };
            for (var frame = 0; frame < _frames.length; frame++) {
                _frameData.x.push(_frames[frame].x);

                _frameData.y.push(_frames[frame].y);

                _frameData.frames.push(_frames[frame].frameIndex);
            }
            return _frameData;
        };

        /* xValue and yValue are assumed to be the raw pixel positions (not calculated x y values), such as those found in the tracker xml. */
        this.addFrame = function (frameIndex, xValue, yValue) {

            var frameInstance = new ns.frame(frameIndex, xValue, yValue);

            _frames.push(frameInstance);
        };


    };

    ns.dynamicParticleModel = function () { };

    ns.measuringTools = function () { };

    ns.calibrationTools = function () { };

    /* Individual frame object.
    xValue and yValue are assumed to be the raw pixel positions (not calculated x y values), such as those found in the tracker xml.
    */
    ns.frame = function (frameIndex, xValue, yValue) {
        this.frameIndex = frameIndex;

        this.x = xValue;

        this.y = yValue;
    };

    /*-----------GUI ELEMENTS---------------*/

    /* Represents an overall window. There are four on the page.
       viewIndex represents the number of the window on the page (0, 1, 2, 3)
       selectedTrack represents the track currently being displayed in the window ('mass A' etc.)
       viewType represents the overal viewtype of the window (plot view, table view, world view, page view)
       World View and Page View are currently disabled in the dropdown since they haven't been implemented--
       However, they are read in from the file, and everything is in place for them to be implemented.
       They can be adding to the dropdown by un-commenting the options in the windowViewTemplate in tracker.html.
    */
    ns.trackViewWindow = function (viewIndex, selectedTrack, viewType) {

        //var _trackViews = [];//Collection of all track view instances
        var _trackViews = {};

        this.viewType = viewType;//World view vs plot, table, or page

        this.viewIndex = viewIndex;//Index of view in array of all views

        this.selectedTrack = selectedTrack;//Track actually being displayed in window

        this.getTrackViews = function () {
            return _trackViews;
        };

        this.getTrackViewbyName = function (trackName) {
            var trackViewInstance = _trackViews[trackName];

            if (typeof trackViewInstance === "undefined") {
                console.error("TrackView with name " + trackName + " does not exist in Window " + this.viewIndex);
                return null;
            }
            else {
                return trackViewInstance;
            }

        };

        this.getSelectedTrack = function () {
            return this.getTrackViewbyName(this.selectedTrack);
        };

        this.getTracksByType = function (trackType) {
            return _trackViews[trackType];
        }

        this.addTrackView = function (trackViewObject) {
            var trackName = trackViewObject.getData().trackName;
            _trackViews[trackName] = trackViewObject;
        };

        this.resetTrackViews = function () {
            _trackViews = null;
        };
    };

    /* Each trackViewWindow contains a collection of trackViewObjects which represent the plotInstances and tableInstance
    that correspond to a particular track in that trackViewWindow.
    */
    ns.trackViewObject = function (trackName) {

        var _trackInformation = {
            trackName: trackName,
            plotInstances: [],//Array of plot objects
            tableInstance: null, //tableObject
            pageViewText: 'There is no page view text for this window.',
        };


        this.getData = function () {
            return _trackInformation;
        };

        this.addPlot = function (plotObject) {
            _trackInformation.plotInstances.push(plotObject);
        };
        this.addTable = function (tableObject) {
            _trackInformation.tableInstance = tableObject;
        };

        this.replacePlot = function (plotIndex, plotObject) {
            _trackInformation.plotInstances[plotIndex] = plotObject;
        };

        this.addArrayOfPlots = function (arrayOfPlots) {

            for (var plotObjectIndex in arrayOfPlots) {

                _trackInformation.plotInstances.push(arrayOfPlots[plotObjectIndex]);
            }
        };


        this.setData = function (parameterKey, newValue) {

            _trackInformation[parameterKey] = newValue;
    };

    };

    /*
    Plot object used to draw plots to screen. Plot instances are stored on the page itself within a trackViewObject.
    TODO: Could store track color in the plot in rgba string format, which would make it more strongly linked and easier to access.
    Could also store related track name.
    */
    ns.plotObject = function (plotIndex, xAxisName, yAxisName, plotOptions, visibility) {

        //Constructs plot information from parameters
        var _plotInformation = {
            plotIndex: plotIndex,//Plot index within window (0, 1, or 2) for the main page, may be higher for dataTool plots
            xAxisName: xAxisName,//String name, such as 'x', or 't'
            yAxisName: yAxisName,//String name, such as 'x', or 't'
            plotOptions: plotOptions,//Object {lines:'true', points:'false'}. Currently not used
            visible: visibility,//String 'true' or 'false'
        };

        this.getData = function () {
            return _plotInformation;
        };

        this.setData = function (parameterKey, newValue) {

            _plotInformation[parameterKey] = newValue;
        };
    };

    /* Table object used to draw table to screen. Table instances are stored on the page itself within a trackViewObject.*/
    ns.tableObject = function (arrayOfColumnNames) {

        var _arrayOfColumnNames = arrayOfColumnNames;//['x', 'y', 't', 'v']

        this.getData = function () {
            return _arrayOfColumnNames;
        };
    };


    ns.dataToolContainer = function () {

        var _dataToolData = {
            selectedView: undefined,//track name: 'mass A'
        }


        this.getData = function () {
            return _dataToolData;
        }

        this.setData = function (parameterKey, newValue) {
            _dataToolData[parameterKey] = newValue;
        };

        //Contains track view objects for each track stored by track name
        var _trackViews = {};

        this.getTrackViews = function () {
            return _trackViews;
        }

        this.getTrackView = function (trackName) {
            return _trackViews[trackName];
        }

        this.addTrackView = function (trackName) {
            _trackViews[trackName] = new ns.dataToolTrackViewObject;
        }


    }

    ns.dataToolTrackViewObject = function () {

        var _dataToolTrackViewObject = {
            xAxisName: 't',
            numberOfPlots: 0,
            plots: [],
            table: null,
        }

        this.getData = function () {
            return _dataToolTrackViewObject;
        };

        this.setData = function (parameterKey, newValue) {

            _dataToolTrackViewObject[parameterKey] = newValue;
        };
        
        this.addPlot = function (plotInstance) {
            _dataToolTrackViewObject.plots.push(plotInstance);
            _dataToolTrackViewObject.numberOfPlots++;
        }

        this.replacePlot = function (plotInstance) {

            var index = plotInstance.getData().plotIndex;
            if (typeof _dataToolTrackViewObject.plots[index] !== 'undefined') {
                _dataToolTrackViewObject.plots[index] = plotInstance;
            }
            else {
                this.addPlot(plotInstance);
            }
        };

        this.removePlot = function (plotIndex) {

            delete _dataToolTrackViewObject.plots[plotIndex];
            var newPlotArr = [];
            for (var i in _dataToolTrackViewObject.plots) {
                newPlotArr.push(_dataToolTrackViewObject.plots[i]);
            }
            _dataToolTrackViewObject.plots = newPlotArr;
            _dataToolTrackViewObject.numberOfPlots--;
        }

        this.setTable = function (tableInstance) {
            _dataToolTrackViewObject.table = tableInstance;
        }

        this.removeTable = function () {
            _dataToolTrackViewObject.table = null;
        }
    }


})(ed.domain = ed.domain || {});

