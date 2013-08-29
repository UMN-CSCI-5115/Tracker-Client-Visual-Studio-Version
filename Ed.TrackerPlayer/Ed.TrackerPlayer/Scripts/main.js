/// <reference path="globalProperties.js" />

(function (ns, reader) {

    //Select the appropriate tracker file per the query string
    ns.trackerFileName = 'TrackerFiles/' + getParameterByName('fileName');

    //Creates a reader instance to parse the xml
    var _reader = new ns.xmlReader(ns.trackerFileName);

    //Places and Instantiates the objects created above
    $("document").ready(function () {

        //This function is executed once xmlReader has successfully retrieved and stored the xml data
        _reader.loadSuccess(buildPage);

    });

    //Builds the page elements--window, video, trackview, plot, table, etc.
    var buildPage = function () {

        //Initializes global xml properties in the reader instance
        ns.initializeProperties(_reader);//Need to pass in specific instance

        //Need tracker defined information about the windowview panels
        var _root = _reader.findClassData(ns.dataPaths.rootSelector)[0];
        
        //Need the defining window information in order to figure out what should be displayed on load
        var _viewsData = _root.views;
        var _selectedViewTypeArr = _root.selected_views;

        //Selected note to view on page load
        var selectedTrack = _root.selectedtrack;

        //Pulls relevant video and coordinate system information from XMLreader instance to put into the global tracker instance
        var videoObjectLiteral = _reader.videoProperties;
        var coordinateSystemObjectLiteral = _reader.imageCoordinateSystemProperties;
        var coordAxisData = _reader.coordAxisProperties;

        //This global object contains all needed tracker data information
        ns.trackerDataInstance = new ns.domain.trackerData(_reader.videoProperties, _reader.imageCoordinateSystemProperties, selectedTrack);

        //Make sure a video file is present before attempting to grabs its frames
        if (ns.trackerDataInstance.getVideoObjectLiteral().path != null) {
            //Pass video properties to begin GIFScrubber process
            ns.scrubGif(ns.trackerDataInstance.getVideoObjectLiteral());
        }
        else {
            alert('Invalid tracker file(no video)');
            return;
        }

        //Initializes all of the tracks within this reader instance
        //TODO: This uses a pass by reference, good practice or no?
        ns.initializeTracks(_reader, ns.trackerDataInstance);

        //Populate toolbar menu options
        ns.initializeAxisButton();

        //Creates the legend element HTML and appends it to the legendDialog div        
        ns.createLegend();

        //Initializes the dropdown menu buttons
        $('.trackLegendDropDownButton').button();
        $('.trackLegendDropDownMenu').menu().hide();

        //Show default note as a popup--if any
        ns.handleNotePopup(selectedTrack);

        //Need to initialize the ui layout plugin on all panels before doing any appending
        ns.initializePageLayout()

        //Creates an array containing the four window trackview objects used to populate the windows
        //and creates the four window elements according to their type and parameters specified by Tracker
        var _windowViewArr = ns.contructWindowInstances(_viewsData, _selectedViewTypeArr)

        //Draws windows to the screen based off of the above information
        ns.createWindows(_windowViewArr);

        ns.setTrackInitialVisibility();

        //Initialize dataToolContainer with default views for all tracks
        //TODO: use data from Tracker xml to populate with values instead of using defaults
        ns.initializeDataToolViews();

        //Clears the modal layer that acts as our loading screen
        $('.modal').hide();


        /*------Event Handlers------*/

        //Creates popup menu for table parameters
        $('.windowPanel').on('click', '.tableOptionsButton', function () {

            ns.generateTablePopup(this);

            //Creates popup menu for plot parameters
        }).on('click', '.plotAxisButton', function () {

            ns.generatePlotPopup(this);

            //Changes window contents on dropdown menu select
        }).on('change', ".trackSelector, .viewType", function () {

            var window = $(this).parents('.windowView');
            ns.updateTrackViews(window);

            //Advances video and handles the data highlighting
        }).on('change', '.numberOfPlots', function () {
            
            ns.handleplotNumberChange(this);
            ns.reHighlightDataPoints();

        }).on('jqplotDataClick', '.plotContainerDiv', function (ev, seriesIndex, pointIndex, data) {

            var frameIndex = data[2];

            ns.jumpToFrame(frameIndex);
        })

        $('.toolbarPanel').on('click', '#toolbarAxisDisplay', function () {

            ns.setCoordAxisVisibility();

        }).on('click', '#tracksLegend', function () {

            $('.legendDialog').dialog('open')

        }).on('click', '#trackerHelp', function () {

            ns.launchHelpMenu();

        }).on('click', '#dataToolButton', function () {

            ns.launchDataTool();
            /* Ultimately should launch a legend that allows you to launch a new data tool tab for any track*/

        });

        $('.legendDialog ').on('click', '.trackLegendDropDownButton', function (e) {

            e.stopPropagation();

            var dropDownMenu = $(this).siblings('.trackLegendDropDownMenu');

            if (dropDownMenu.is(':visible')) {
                $('.trackLegendDropDownMenu').slideUp(50);
            }
            else {
                $('.trackLegendDropDownMenu').slideUp(50);
                dropDownMenu.slideDown(50);
            }
        }).on('click', '.legendDropdownVisibility', function () {

            var trackName = $(this).parent().attr('trackname')
            ns.toggleTrackVisibility($(this), trackName);

        }).on('click', '.legendDropdownDisplayLinkedMasses', function () {

            //var trackName = $(this).parent().attr('trackname')
            //ns.linkedMassesPopup(trackName);

            ns.openLinkedMassesDialog(this);

        }).on('click', '.legendDropdownNote', function () {

                var selectedTrackName = $(this).parent().attr('trackname')
                ns.handleNotePopup(selectedTrackName);

        });

        $(document).on('click', function () {

            $('.trackLegendDropDownMenu').slideUp(50);

        });

    }

    //Allows iteration through object literals in handlebar templates
    Handlebars.registerHelper('eachProperty', function (context, options) {
        var ret = "";
        for (var prop in context) {
            ret = ret + options.fn({ property: prop, value: context[prop] });
        }
        return ret;
    });

    //Grabs the value of the specified query variable (e.g. name)
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

}(ed))
