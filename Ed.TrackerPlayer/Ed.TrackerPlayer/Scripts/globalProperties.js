(function (ns) {
    /*
    Contains paths to the object within the tracker file node containing each piece of information,
    and paths to the templates used by Handlebars.
    */
    ns.dataPaths = {
        /* Tracker file nodes */
        coordinateAxis: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.CoordAxes']",
        pointMasses: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.PointMass']",
        centerOfMass: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.CenterOfMass']",
        analyticalParticle: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.AnalyticParticle']",
        dynamicParticles: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.DynamicParticle']",
        tapeMeasure: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.TapeMeasure']",
        trackerPanel: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.TrackerPanel']",
        initialCoordAxis: "object[class='org\\.opensourcephysics\\.media\\.core\\.ImageCoordSystem\\$FrameData']",
        imageCoordinateSystem: "object[class='org\\.opensourcephysics\\.media\\.core\\.ImageCoordSystem']",
        clipControl: "object[class='org\\.opensourcephysics\\.media\\.core\\.StepperClipControl']",
        videoClip: "object[class='org\\.opensourcephysics\\.media\\.core\\.VideoClip']",
        rootSelector: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.TrackerPanel']",
        dataToolSelector: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.PlotTView']",
        viewsSelector: "property[class='[[Lorg.opensourcephysics.cabrillo.tracker.TView;']",
        pageViewText: "object[class='org\\.opensourcephysics\\.cabrillo\\.tracker\\.PageTView$TabView']",
        /* Handlebar templates */
        pointMassTableTemplateSelector: "script#pointMassTableTemplate",
        tabsTemplateSelector: 'script#tabTemplate',
        windowViewTemplateSelector: "script#windowViewTemplate",
        mathPlotsPopupTemplateSelector: "script#plotViewOptionsButtonTemplate",
        mathTablesPopupTemplateSelector: "script#tableViewOptionsButtonTemplate",
        legendGeneratorTemplateSelector: "script#legendGeneratorTemplate",
        linkedTracksTemplateSelector: "script#linkedTracksTemplate",
        dataToolPlotParametersTemplateSelector: "script#dataToolPlotParameters",
        tracksDropdownTemplateSelector: "script#tracksDropdownTemplate",
        trackTableTemplateSelector: "script#trackTableTemplate",
        dataToolXParameterTemplateSelector: "script#dataToolXParameterTemplate",
    };

    /* Used by Handlebars templates to construct the menus for the table popup and the plot popup */
    ns.axisDropdownMenu = {
        'x': 'x: position x-component',
        'y': 'y: position y-component',
        'r': 'r: position magnitude',
        'θr': 'θr: position angle',
        'vx': 'vx: velocity: x-component',
        'vy': 'vy: velocity: y-component',
        'v': 'v: velocity magnitude',
        'θv': 'θv: velocity angle',
        'ax': 'ax: acceleration: x-component',
        'ay': 'ay: acceleration: y-component',
        'a': 'a: acceleration magnitude',
        'θa': 'θa: acceleration angle',
        'θ': 'θ: rotation angle',
        'ω': 'ω: angular velocity',
        'α': 'α: angular acceleration',
        'step': 'step: step number',
        'frame': 'frame: frame number',
        'px': 'px: momentum x-component',
        'py': 'py: momentum y-component',
        'p': 'p: momentum magnitude',
        'θp': 'θp: momentum angle',
        'pixelx': 'pixelx: pixel x-component',
        'pixely': 'pixely: pixel y-component',
        'K': 'K: kinetic energy',
        't': 't: time'
    };

    /* 
    Defines the svg instructions needed to construct footprints for the video overlay and the legend. 
    Each shape is centered around the point 0, 0
    */
    ns.footprints = {
        Triangle: [
            {
                type: 'polygon',
                attributes: {
                    points: '10,10 0,-10 -10,10',
                    'stroke-width': '2.5',
                    'fill-opacity': 0
                }
            },
        ],

        Spot: [
            {
                type: 'circle',
                attributes: {
                    cx: '0',
                    cy: '0',
                    r: '5',
                    'stroke-width': '0',
                    'fill-opacity': 1
                }
            },
        ],

        VerticalLine: [
            {//This is the main vertical line
                type: 'line',
                attributes: {
                    x1: "0",
                    y1: "-50",
                    x2: "0",
                    y2: "50",
                    'stroke-width': "2.5",
                },
            },
            {//This is the crossbar
                type: 'line',
                attributes: {
                    x1: "-10",
                    y1: "0",
                    x2: "10",
                    y2: "0",
                    'stroke-width': "2.5",
                }
            },
        ],

        HorizontalLine: [
              {//This is the main vertical line
                  type: 'line',
                  attributes: {
                      y1: "0",
                      x1: "-50",
                      y2: "0",
                      x2: "50",
                      'stroke-width': "2.5",
                  },
              },
            {//This is the crossbar
                type: 'line',
                attributes: {
                    y1: "-10",
                    x1: "0",
                    y2: "10",
                    x2: "0",
                    'stroke-width': "2.5",
                }
            },
        ],

        Diamond: [
            {
                type: 'polygon',
                attributes: {
                    'points': "-10,0 0,10 10,0 0,-10 -10,0",
                    'stroke-width': 2.5,
                    'fill-opacity': 0,
                }
            },
        ],

        Circle: [
            {
                type: 'circle',
                attributes: {
                    r: '10',
                    'stroke-width': 2.5,
                    'fill-opacity': 0
                }
            },
        ],


        CoordAxis: [
            {//This is the main horizontal line
                type: 'line',
                attributes: {
                    x1: "-1000",
                    y1: "0",
                    x2: "1000",
                    y2: "0",
                    'vector-effect': "non-scaling-stroke",
                    'stroke-width': "2",
                },
            },
            {//This is the main vertical line
                type: 'line',
                attributes: {
                    x1: "0",
                    y1: "-1000",
                    x2: "0",
                    y2: "1000",
                    'vector-effect': "non-scaling-stroke",
                    'stroke-width': "2",
                },
            },
            {//This is the secondary vertical line that denotes the positive x portion
                type: 'line',
                attributes: {
                    x1: "10",
                    y1: "-5",
                    x2: "10",
                    y2: "5",
                    'vector-effect': "non-scaling-stroke",
                    'stroke-width': "2",
                },
            },
        ],
    };

    /*
    Enumerates button options for all track types using the HTML elements in the legendButtonEnumeration
    div as shown below for PointMasses and Centers of Mass. Commented out options have not been implemented.
    TODO: Add menu options for all the tracks that have not yet been implemented.
    */
    ns.legendButtons = {
        pointMass: {
            notes: ".legendDropdownNote",
            visible: ".legendDropdownVisibility",
        },
        centerOfMass: {
            displayLinkedMasses: ".legendDropdownDisplayLinkedMasses",//Replacing select masses to be more reflective of the idea that it's currently view only            
            notes: ".legendDropdownNote",
            visible: ".legendDropdownVisibility",           
        }
        /* ALL POSSIBLE OPTIONS
        ExampleTrack: {
             displayLinkedMasses: ".legendDropdownDisplayLinkedMasses",//Replacing select masses to be more reflective of the idea that it's currently view only
             name: ".legendDropdownName",
             notes: ".legendDropdownNote",
             color: ".legendDropdownColor",
             footprints: ".legendDropdownFootprints",
             visible: ".legendDropdownVisibility",
             setProperties: ".legendDropdownSetProperties",
             selectMasses: ".legendDropdownSelectMasses",
             autotracker: ".legendDropdownAutotracker",
             define: ".legendDropdownDefine",
             velocity: ".legendDropdownVelocity",
             acceleration: ".legendDropdownAcceleration",
             deleteSelectedStep: ".legendDropdownDeleteSelectedStep",
             clearSteps: ".legendDropdownClearSteps",
             "delete": ".legendDropdownDelete",
        }
        */
    };

}(ed));


/* Paths to all currently stored tracker files. Order is only significant for now as it corresponds to the welcome page. */
/*
    This system has been replaced by providing the actual name of the tracker file you are interested in into the url query string
    For now we are keeping it because many comments refer to a file by its index

ns.trackerFiles = [
    'TrackerFiles/ball_oil.trk',//0
    'TrackerFiles/BallToss.trk',//1
    'TrackerFiles/bouncing_cart.trk',//2
    'TrackerFiles/cart_pendulum.trk',//3
    'TrackerFiles/color_filter_128.trk',//4
    'TrackerFiles/color_filter_139.trk',//5
    'TrackerFiles/CupsClips.trk',//6
    'TrackerFiles/CupsClipsDragModel.trk',//7
    'TrackerFiles/CupsClipsModel.trk',//8
    'TrackerFiles/CupsClipsViscousModel.trk',//9
    'TrackerFiles/fluor_lamp_3000K.trk',//10
    'TrackerFiles/fluor_lamp_6300K.trk',//11
    'TrackerFiles/fluoresce_laser.trk',//12
    'TrackerFiles/fluoresce_uv365.trk',//13
    'TrackerFiles/Helium.trk',//14
    'TrackerFiles/Hydrogen.trk',//15
    'TrackerFiles/laser.trk',//16
    'TrackerFiles/Mercury.trk',//17
    'TrackerFiles/MotionDiagram.trk',//18
    'TrackerFiles/parachute_monkey.trk',//19
    'TrackerFiles/Pendulum.trk',//20
    'TrackerFiles/pendulum_drag.trk',//21
    'TrackerFiles/projectile_model.trk',//22
    'TrackerFiles/PucksCollide.trk',//23
    'TrackerFiles/spring_wars.trk',//24
    'TrackerFiles/sunlight.trk',//25
    'TrackerFiles/thermal_color.trk',//26
    'TrackerFiles/thermal_cool.trk',//27
    'TrackerFiles/thermal_gray.trk',//28
    'TrackerFiles/ThreeSlits.trk',//29
    'TrackerFiles/bouncing_cart_modded.trk',//30
    'TrackerFiles/testFile.trk',//31
    'TrackerFiles/demo.trk',//32
    'TrackerFiles/WonkyFrames.trk',//33
    'TrackerFiles/WonkyFrames3.trk',//34
    'TrackerFiles/parachute_monkey3.trk',//35
    'TrackerFiles/Car_Zoom.trk',//36 designated priority
    'TrackerFiles/Snowboard_Jump.trk',//37 designated priority
    'TrackerFiles/swing.trk',//38 designated priority
    'TrackerFiles/Start-up2.trk',//39 designated priority
    'TrackerFiles/wheel.trk',//40 designated priority
    'TrackerFiles/null.trk',//41
    'TrackerFiles/legendary.trk',//42
    'TrackerFiles/CentersOfMass.trk',//43
    'TrackerFiles/brokenPointMasses.trk',//44 designated priority
    'TrackerFiles/FINALDEMOFILE.trk',//45 designated priority
    'TrackerFiles/analyticalModel.trk',//46 designated priority     
];
*/

