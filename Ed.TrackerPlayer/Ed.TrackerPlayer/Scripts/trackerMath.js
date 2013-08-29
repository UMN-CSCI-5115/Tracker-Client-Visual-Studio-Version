(function (ns) {


    /* Multiplies any arbitrary compatible matrices */
    ns.multiplyMatrices = function (m1, m2) {

        var m1Rows = m1[0].length;
        var m1Columns = m1.length;
        var m2Rows = m2[0].length;
        var m2Columns = m2.length;

        if (m1Columns != m2Rows) {
            console.log("Incompatible matrices");
            return m1;
        }

        var result = [];
        for (var i = 0; i < m1Rows; i++) {//m1 row
            result[i] = [];
            for (var j = 0; j < m2Columns; j++) {//m2Column
                result[i][j] = 0;
                for (var k = 0; k < m1Columns; k++) {//m1 columns

                    var firstValue = m1[i][k];
                    var secondValue = m2[k][j];
                    var answer = firstValue * secondValue;
                    result[i][j] += answer;
                }
            }
        }
        return result;
    };

    /* Takes in an array of arrays where each sub array is of the same length n and merges them into n-tuples */
    ns.mergeNArrays = function (arrOfArrs) {

        var mergedArr = [];

        for (var array in arrOfArrs) {

            for (var key in arrOfArrs[array]) {

                if (typeof mergedArr[key] == 'undefined') {
                    mergedArr[key] = [];
                }
                mergedArr[key].push(arrOfArrs[array][key]);
            }
        }
        return mergedArr;
    };

    /* Returns the table information that is displayed to the page */
    ns.getTableDataSet = function (columnParams, trackName) {

        var formattedData = [];

        var tableColumnValues = {};

        //Get table column values
        for (var i = 0; i < columnParams.length; i++) {

            var parameterName = columnParams[i];

            tableColumnValues[parameterName] = ns.calculateParameterValues(trackName, parameterName);
        }

        //Format table column values into array of arrays storing the information by row [[x_name, y_name, a_name],[x_1, y_1, a_1],[x_2, y_2, a_2]]

        var firstParam = Object.keys(tableColumnValues)[0];
        var tableNumRows = tableColumnValues[firstParam].length;

        for (var rowIndex = 0; rowIndex < tableNumRows; rowIndex++) {

            var valArr = [];

            for (var property in tableColumnValues) {

                var dataEntry = tableColumnValues[property][rowIndex];
                //TODO: Make this into an option, will probably be done in UIBinder
                if (typeof dataEntry == "number") {
                    dataEntry = dataEntry.toFixed(3);
                }

                valArr.push(dataEntry);
            }

            formattedData.push(valArr);
        }
        return formattedData;
    };

    /* Takes in a point mass track name and a parameter name (such as "x" or "py") and returns an array containing
    the calculated values according to the parameter */
    ns.calculateParameterValues = function (trackName, parameterName) {

        //Grabs the specified track from the global data set
        var thisTrack = ns.trackerDataInstance.tracksContainer.getTrackByName(trackName);

        var trackData = thisTrack.getData();

        var frameData = thisTrack.getFrameData();

        var frameArray = frameData.frames;

        var mass = trackData.mass;

        /*Video Related Properties*/
        var videoData = ns.trackerDataInstance.getVideoObjectLiteral();

        var startFrame = videoData.startFrame;

        var frameStepSize = videoData.stepSize;

        var startTime = videoData.startTime;

        var deltaT = videoData.deltaT / 1000;

        var stepCount = videoData.stepCount;

        var xArray = [];

        var yArray = [];

        for (var index in frameArray) {

            var frameIndex = frameArray[index];

            xArray[frameIndex] = frameData.x[index];

            yArray[frameIndex] = frameData.y[index];
        }


        var coreTrackerCalculationData = {
            xArray: xArray,
            yArray: yArray,
            frameArray: frameArray,
            mass: mass,
            deltaT: deltaT,
            frameStepSize: frameStepSize,
            startFrame: startFrame,
            startTime: startTime,
            stepCount: stepCount,
            pixelXArray: frameData.x,
            pixelYArray: frameData.y,
        };

        //Finds which function to use to calculate the correct value
        var valueFunction = parameterValuesCalculationMap[parameterName];

        if (typeof valueFunction == "undefined") {
            console.error(parameterName + " is not a valid parameter");

            return [];
        }
        else {
            return valueFunction(coreTrackerCalculationData);
        }
    };

    //Finds the x values of the given data set
    var getXValues = function (coreTrackerCalculationData) {

        var valArray = [];

        var xArray = coreTrackerCalculationData.xArray;
        var yArray = coreTrackerCalculationData.yArray;
        var frameArray = coreTrackerCalculationData.frameArray;

        var startFrame = frameArray[0];
        var stepSize = coreTrackerCalculationData.frameStepSize;

        var lastFrameIndex = frameArray.length;

        var coordsData = ns.trackerDataInstance.getCoordinateSystemObjectLiteral();

        var xOrigin = coordsData.xOrigin;
        var yOrigin = coordsData.yOrigin;

        var xScale = coordsData.xScale;
        var yScale = coordsData.yScale;


        var angle = 0 - degreesToRadians(coordsData.angle);

        for (var index = startFrame; index <= frameArray[lastFrameIndex - 1]; index += stepSize) {

            if (typeof xArray[index] != "undefined" && typeof yArray[index] != "undefined") {

                /*
                    TODO: Refactor this shifting and rotating into its own function so that we can un-rotated and translate by passing in negative value(primarily for anlatyical model purposes)
                */

                var shiftedFrame = shiftFrame(xArray[index], yArray[index], xScale, yScale, xOrigin, yOrigin);

                var rotatedX = (shiftedFrame.x * Math.cos(angle) - (shiftedFrame.y * Math.sin(angle)));

                valArray.push(rotatedX);
            }

        }
        return valArray;
    };

    //Finds the y values of the given data set
    var getYValues = function (coreTrackerCalculationData) {

        var valArray = [];

        var xArray = coreTrackerCalculationData.xArray;
        var yArray = coreTrackerCalculationData.yArray;
        var frameArray = coreTrackerCalculationData.frameArray;

        var startFrame = frameArray[0];
        var stepSize = coreTrackerCalculationData.frameStepSize;

        var lastFrameIndex = frameArray.length;


        var coordsData = ns.trackerDataInstance.getCoordinateSystemObjectLiteral();

        var xOrigin = coordsData.xOrigin;
        var yOrigin = coordsData.yOrigin;

        var xScale = coordsData.xScale;
        var yScale = coordsData.yScale;


        var angle = 0 - degreesToRadians(coordsData.angle);

        for (var index = startFrame; index <= frameArray[lastFrameIndex - 1]; index += stepSize) {

            if (typeof xArray[index] != "undefined" && typeof yArray[index] != "undefined") {
                var shiftedFrame = shiftFrame(xArray[index], yArray[index], xScale, yScale, xOrigin, yOrigin);

                var rotatedY = (shiftedFrame.x * Math.sin(angle)) + (shiftedFrame.y * Math.cos(angle));

                valArray.push(rotatedY);
            }
        }

        return valArray;
    };

    //Finds the frame values of the given data set
    var getFrameValues = function (coreTrackerCalculationData) {

        var stepSize = coreTrackerCalculationData.frameStepSize;

        var startFrame = coreTrackerCalculationData.startFrame;

        var stepCount = coreTrackerCalculationData.stepCount;

        return ns.calculateFrameIndices(startFrame, stepSize, stepCount);
    };

    //Finds the magnitude of the polar coordinate values(denoted r) of the given data set
    var getPositionMagnitudeValues = function (coreTrackerCalculationData) {

        var xArray = getXValues(coreTrackerCalculationData);
        var yArray = getYValues(coreTrackerCalculationData);

        return getMagnitude(xArray, yArray);
    }

    /*
        Finds the angle between the origin and each point
    */
    var getPositionAngleValues = function (coreTrackerCalculationData) {
        var xArray = getXValues(coreTrackerCalculationData);
        var yArray = getYValues(coreTrackerCalculationData);

        return getAngle(xArray, yArray);

    }

    /*
        Finds the velocity in the x direction
    */
    var getVelocityXValues = function (coreTrackerCalculationData) {

        var xArray = getXValues(coreTrackerCalculationData);
        var deltaT = coreTrackerCalculationData.deltaT
        var frameStepSize = coreTrackerCalculationData.frameStepSize;

        return firstDerivative(xArray, frameStepSize, deltaT);
    }

    /*
        Finds the velocity in the y direction
    */
    var getVelocityYValues = function (coreTrackerCalculationData) {

        var yArray = getYValues(coreTrackerCalculationData);
        var deltaT = coreTrackerCalculationData.deltaT
        var frameStepSize = coreTrackerCalculationData.frameStepSize;

        return firstDerivative(yArray, frameStepSize, deltaT);
    }

    /*
        Finds the resultant velocity
    */
    var getVelocityMagnitudeValues = function (coreTrackerCalculationData) {

        var xVelocityArray = getVelocityXValues(coreTrackerCalculationData);

        var yVelocityArray = getVelocityYValues(coreTrackerCalculationData);

        return getMagnitude(xVelocityArray, yVelocityArray);
    }

    /*
        Finds the angle between the velocity value and (0,0)
    */
    var getVelocityAngleValues = function (coreTrackerCalculationData) {

        var xVelocityArray = getVelocityXValues(coreTrackerCalculationData);

        var yVelocityArray = getVelocityYValues(coreTrackerCalculationData);

        return getAngle(xVelocityArray, yVelocityArray);
    }

    /*
      Finds the acceleration in the x direction
    */
    var getAccelerationXValues = function (coreTrackerCalculationData) {
        var xArray = getXValues(coreTrackerCalculationData);
        var deltaT = coreTrackerCalculationData.deltaT
        var frameStepSize = coreTrackerCalculationData.frameStepSize;

        return secondDerivative(xArray, frameStepSize, deltaT);
    }

    /*
      Finds the acceleration in the y direction
    */
    var getAccelerationYValues = function (coreTrackerCalculationData) {
        var yArray = getYValues(coreTrackerCalculationData);
        var deltaT = coreTrackerCalculationData.deltaT
        var frameStepSize = coreTrackerCalculationData.frameStepSize;

        return secondDerivative(yArray, frameStepSize, deltaT);
    }

    /*
      Finds the resultant acceleration
    */
    var getAccelerationMagnitudeValues = function (coreTrackerCalculationData) {

        var xAccelArray = getAccelerationXValues(coreTrackerCalculationData);

        var yAccelArray = getAccelerationYValues(coreTrackerCalculationData);

        return getMagnitude(xAccelArray, yAccelArray);
    }

    /*
      Finds the angle between the acceleration value and (0,0)
    */
    var getAccelerationAngleValues = function (coreTrackerCalculationData) {

        var xAccelArray = getAccelerationXValues(coreTrackerCalculationData);

        var yAccelArray = getAccelerationYValues(coreTrackerCalculationData);

        return getAngle(xAccelArray, yAccelArray);
    }

    /*
      Finds the angle of rotation
    */
    var getRotationAngleValues = function (coreTrackerCalculationData) {

        var positionAngleArray = getPositionAngleValues(coreTrackerCalculationData);
        var rotationArray = [];

        var rotation = 0;
        var prevAngle = 0;

        for (var index in positionAngleArray) {

            var angle = positionAngleArray[index];

            var delta = angle - prevAngle;


            if (delta < -180) {
                delta += 2 * 180;
            }
            else if (delta > 180) {
                delta -= 2 * 180;
            }

            rotation += delta;
            prevAngle = angle;
            rotationArray.push(rotation);
        }

        return rotationArray;
    }

    /*
      Finds the rate of change in the rotation angle
    */
    var getAngularVelocityValues = function (coreTrackerCalculationData) {

        var frameStepSize = coreTrackerCalculationData.frameStepSize;

        var deltaT = coreTrackerCalculationData.deltaT;

        var rotationArray = getRotationAngleValues(coreTrackerCalculationData);

        return firstDerivative(rotationArray, frameStepSize, deltaT);
    }

    /*
      Finds the acceleration of the rotation angle values
    */
    var getAngularAccelerationValues = function (coreTrackerCalculationData) {

        var frameStepSize = coreTrackerCalculationData.frameStepSize;

        var deltaT = coreTrackerCalculationData.deltaT;

        var rotationArray = getRotationAngleValues(coreTrackerCalculationData);

        return secondDerivative(rotationArray, frameStepSize, deltaT);
    }

    //TODO: Need to account for different step sizes in order to determine the total number of steps
    /*
      Finds the step values (0, 1, ..., n)
    */
    var getStepValues = function (coreTrackerCalculationData) {

        var frames = coreTrackerCalculationData.frameArray;

        var valArray = [];

        for (var i = 0; i < frames.length; i++) {
            valArray.push(i);
        }
        return valArray;
    }

    /*
      Finds the momentum in the x direction
    */
    var getMomentumXValues = function (coreTrackerCalculationData) {

        var momentumValues = [];

        var velocArray = getVelocityXValues(coreTrackerCalculationData);

        var mass = coreTrackerCalculationData.mass;

        for (var index in velocArray) {
            if (typeof velocArray[index] != 'number') {
                momentumValues.push("");
            }
            else {
                momentumValues.push(mass * velocArray[index]);
            }
        }
        return momentumValues;
    }

    /*
      Finds the momentum in the y direction
    */
    var getMomentumYValues = function (coreTrackerCalculationData) {

        var momentumValues = [];

        var velocArray = getVelocityYValues(coreTrackerCalculationData);

        var mass = coreTrackerCalculationData.mass;

        for (var index in velocArray) {

            if (typeof velocArray[index] != 'number') {
                momentumValues.push("");
            }
            else {

                momentumValues.push(mass * velocArray[index]);
            }
        }
        return momentumValues;
    }

    /*
      Finds the resultant momentum values
    */
    var getMomentumMagnitudeValues = function (coreTrackerCalculationData) {

        var xMomentum = getMomentumXValues(coreTrackerCalculationData);
        var yMomentum = getMomentumYValues(coreTrackerCalculationData);

        return getMagnitude(xMomentum, yMomentum);
    }

    /*
      Finds the angle between the momentum value and (0, 0)
    */
    var getMomentumAngleValues = function (coreTrackerCalculationData) {

        var momentumAngleValues = [];

        var baseAngle = getVelocityAngleValues(coreTrackerCalculationData);

        var mass = coreTrackerCalculationData.mass;

        for (var index in baseAngle) {

            if (typeof baseAngle[index] != 'number') {
                momentumAngleValues.push("");
            }
            else {

                momentumAngleValues.push(mass * baseAngle[index]);
            }
        }
        return momentumAngleValues;

    }

    /*
      Finds the unscaled / rotated x values
    */
    var getPixelXValues = function (coreTrackerCalculationData) {

        return coreTrackerCalculationData.pixelXArray;
    }

    /*
      Finds the unscaled / rotated y values
    */
    var getPixelYValues = function (coreTrackerCalculationData) {

        return coreTrackerCalculationData.pixelYArray;

    }

    /*
      Calculates the kinetic energy at the given frame
    */
    var getKineticEnergyValues = function (coreTrackerCalculationData) {

        var velocityArray = getVelocityMagnitudeValues(coreTrackerCalculationData);

        var mass = coreTrackerCalculationData.mass;

        var valArray = [];

        for (var index in velocityArray) {
            var currentVelocity = velocityArray[index];
            if (typeof currentVelocity != "number") {
                valArray.push("");
            }
            else {
                var energy = (.5) * mass * Math.pow(currentVelocity, 2);
                valArray.push(energy);
            }
        }

        return valArray;
    }

    /*
    TODO: 
        Load file analytical model and open any table, add t and frames, and look at the frame numbers: they are number 0, 1, 2 - n where n is the number of frames
        The reason this occurs is because this file has data at uneven intervals:
                a) The point masses and center of mass occur every fourth frame starting at frame 3
                b) The analytical particle has data every frame after the 3rd frame
        Not sure why this is happening, I think it has something to do with this function and the getFrame function
    */

    //TODO Run moar test cases on this funkshun
    var getTimeValues = function (coreTrackerCalculationData) {

        var deltaT = coreTrackerCalculationData.deltaT;
        var frameStepSize = coreTrackerCalculationData.frameStepSize;
        var stepSize = coreTrackerCalculationData.frameStepSize;
        var startFrame = coreTrackerCalculationData.startFrame;

        var frameArray = coreTrackerCalculationData.frameArray;
        var xFrameArray = getXValues(coreTrackerCalculationData);
        var frameArrayLength = xFrameArray.length * stepSize;

        var valArray = [];

        var trackStartFrame = frameArray[0];

        var lastFrameIndex = frameArray.length;

        var startTime = (coreTrackerCalculationData.startTime + deltaT * trackStartFrame) - deltaT;


        for (var index = trackStartFrame; index <= frameArray[lastFrameIndex - 1]; index += stepSize) {
            startTime += deltaT;
            valArray.push(startTime);
        }
        return valArray;
    }

    //Takes in two equally sized arrays, returns the magnitude of each entry
    var getMagnitude = function (array1, array2) {
        var valArray = [];

        for (var index in array1) {

            var array1Value = array1[index];
            var array2Value = array2[index];

            //if the value is not a number, we do not want to find the magnitude but rather push an empty string
            if (typeof array1Value != "number" || typeof array2Value != "number" || array1Value * array2Value == NaN) {
                valArray.push("");
            }
            else {
                //Uses the Pythagorean Theorem to find the magnitude
                var mangnitude = Math.sqrt(Math.pow(array1Value, 2) + Math.pow(array2Value, 2));

                valArray.push(mangnitude);
            }

        }

        return valArray;
    }

    //Takes in two equally sized arrays, returns the angle of each entry
    //The first array corresponds to an x-axis value while the second corresponds to the y axis    
    //Uses SOHCAHTOAH to find the angle: tan(theta) = y/x  =>  theta = arctan(y/x)
    //also returns this value in degrees
    var getAngle = function (array1, array2) {
        var valArray = [];

        for (var index in array1) {

            var array1Value = array1[index];
            var array2Value = array2[index];

            //if the value is not a number, we do not want to find the magnitude but rather push an empty string
            if (typeof array1Value != "number" || typeof array2Value != "number" || array1Value * array2Value == NaN) {
                valArray.push("");
            }
            else {

                //Need result 0 < theta < 2*PI, this function uses the atan2 function to find this value
                var polarAngle = Math.atan2(array2Value, array1Value);

                //Tracker displays degrees
                polarAngle = radiansToDegrees(polarAngle);

                valArray.push(polarAngle);
            }

        }

        return valArray;
    }
    
    /*
        Utilizes a 3 point algorithm to determine the rate of change in a data set, reused for position and angle
    */
    var firstDerivative = function (pointArray, arrayStepSize, deltaT) {

        var timeStep = arrayStepSize * deltaT;        

        var arrayLength = pointArray.length;

        var valArray = new Array(arrayLength);

        //Need the first value to be empty strings because the 5 point method can't find their second derivative
        valArray[0] = "";

        //First derivative algorithm to calculate the derivative values
        for (var i = 1  ; i < pointArray.length - 1; i++) {
            //Uses 3 points to find the second derivative of the current point         
            var derivative = (-pointArray[i - 1] + pointArray[i + 1]) / (2 * timeStep);

            valArray[i] = derivative;
        }

        valArray[arrayLength - 1] = "";

        return valArray;

    }

    /*
        Utilizes a 5 point algorithm to determine the rate of change in a data set, reused for position and angle
    */
    var secondDerivative = function (pointArray, arrayStepSize, deltaT) {

        var timeStep = deltaT * arrayStepSize;

        var arrayLength = pointArray.length;

        var valArray = new Array(arrayLength);

        //Need the first two values to be empty strings because the 5 point method can't find their second derivative
        valArray[0] = valArray[1] = "";

        //First derivative algorithm to calculate the derivative values
        for (var i = 2 ; i < pointArray.length - 2 ; i++) {
            //Uses 5 points to find the second derivative of the current point
            var derivative = (2 * pointArray[i - 2] - pointArray[i - 1] - 2 * pointArray[i] - pointArray[i + 1] + 2 * pointArray[i + 2]) / (7 * Math.pow(timeStep, 2));

            valArray[i] = derivative;

        }

        //Need the last two values to be empty strings as well
        valArray[arrayLength - 2] = "";
        valArray[arrayLength - 1] = "";

        return valArray;

    }

    //Converts the given radian value to degrees
    var radiansToDegrees = function (angle) {
        return angle * (180 / Math.PI);
    }

    //Convert the given degree value into radians
    var degreesToRadians = function (angle) {
        return angle * (Math.PI / 180);
    }

    /*
        Takes in an original tracker x value and y value for a frame and returns an object containing an appropriately shifted and scaled version 
    */
    var shiftFrame = function (xVal, yVal, xScale, yScale, xOrigin, yOrigin) {

        var shiftedFrame = {
            x: null,
            y: null,
        }
        shiftedFrame.x = parseFloat((xVal - xOrigin) / xScale);
        shiftedFrame.y = ((yOrigin - yVal) / yScale);

        return shiftedFrame;
    }

    //A map that associates each parameter name with their calculated values
    var parameterValuesCalculationMap = {
        t: getTimeValues,
        x: getXValues,
        y: getYValues,
        r: getPositionMagnitudeValues,
        θr: getPositionAngleValues,
        vx: getVelocityXValues,
        vy: getVelocityYValues,
        v: getVelocityMagnitudeValues,
        θv: getVelocityAngleValues,
        ax: getAccelerationXValues,
        ay: getAccelerationYValues,
        a: getAccelerationMagnitudeValues,
        θa: getAccelerationAngleValues,
        θ: getRotationAngleValues,
        ω: getAngularVelocityValues,
        α: getAngularAccelerationValues,
        step: getStepValues,
        frame: getFrameValues,
        px: getMomentumXValues,
        py: getMomentumYValues,
        p: getMomentumMagnitudeValues,
        θp: getMomentumAngleValues,
        pixelx: getPixelXValues,
        pixely: getPixelYValues,
        K: getKineticEnergyValues
    }

}(ed))