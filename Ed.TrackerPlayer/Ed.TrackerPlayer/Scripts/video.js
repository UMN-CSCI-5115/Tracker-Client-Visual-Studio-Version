(function (ns) {

    ns.scrubGif = function (video) {

        var videoName = video.path;

        //Video name is in the format ../videos/nameofthevideo.mov
        if (typeof videoName.split('/') == 'undefined') {
            var nameWithFileTypeExtension = videoName;
        }
        else {
            var nameSplitLength = videoName.split('/').length;
            var nameWithFileTypeExtension = videoName.split('/')[nameSplitLength - 1];
        }

        //This sets the video name to the format Videos/nameofthevideo.gif
        var safeName = 'Videos/' + nameWithFileTypeExtension.split('.')[0] + '.gif';//Make sure name specifies gif format 

        window.addEventListener('load', ns.onLoadScrubber(safeName, video), false);
    }

    var BinaryFile = function (strData, iDataOffset, iDataLength) {
        var data = strData;
        var dataOffset = iDataOffset || 0;
        var dataLength = 0;

        this.getRawData = function () {
            return data;
        }

        this.setRawData = function (raw) {
            data = raw;
        }

        if (typeof strData == "string") {
            dataLength = iDataLength || data.length;

            this.getByteAt = function (iOffset) {
                return data.charCodeAt(iOffset + dataOffset) & 0xFF;
            }

            this.getBytesAt = function (iOffset, iLength) {
                var aBytes = [];

                for (var i = 0; i < iLength; i++) {
                    aBytes[i] = data.charCodeAt((iOffset + i) + dataOffset) & 0xFF
                };

                return aBytes;
            }
        } else if (typeof strData == "unknown") {
            dataLength = iDataLength || IEBinary_getLength(data);

            this.getByteAt = function (iOffset) {
                return IEBinary_getByteAt(data, iOffset + dataOffset);
            }

            this.getBytesAt = function (iOffset, iLength) {
                return new VBArray(IEBinary_getBytesAt(data, iOffset + dataOffset, iLength)).toArray();
            }
        }

        this.getLength = function () {
            return dataLength;
        }

        this.getSByteAt = function (iOffset) {
            var iByte = this.getByteAt(iOffset);
            if (iByte > 127)
                return iByte - 256;
            else
                return iByte;
        }

        this.getShortAt = function (iOffset, bBigEndian) {
            var iShort = bBigEndian ?
                (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
                : (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
            if (iShort < 0) iShort += 65536;
            return iShort;
        }
        this.getSShortAt = function (iOffset, bBigEndian) {
            var iUShort = this.getShortAt(iOffset, bBigEndian);
            if (iUShort > 32767)
                return iUShort - 65536;
            else
                return iUShort;
        }
        this.getLongAt = function (iOffset, bBigEndian) {
            var iByte1 = this.getByteAt(iOffset),
                iByte2 = this.getByteAt(iOffset + 1),
                iByte3 = this.getByteAt(iOffset + 2),
                iByte4 = this.getByteAt(iOffset + 3);

            var iLong = bBigEndian ?
                (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
                : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
            if (iLong < 0) iLong += 4294967296;
            return iLong;
        }
        this.getSLongAt = function (iOffset, bBigEndian) {
            var iULong = this.getLongAt(iOffset, bBigEndian);
            if (iULong > 2147483647)
                return iULong - 4294967296;
            else
                return iULong;
        }

        this.getStringAt = function (iOffset, iLength) {
            var aStr = [];

            var aBytes = this.getBytesAt(iOffset, iLength);
            for (var j = 0; j < iLength; j++) {
                aStr[j] = String.fromCharCode(aBytes[j]);
            }
            return aStr.join("");
        }

        this.getCharAt = function (iOffset) {
            return String.fromCharCode(this.getByteAt(iOffset));
        }
        this.toBase64 = function () {
            return window.btoa(data);
        }
        this.fromBase64 = function (strBase64) {
            data = window.atob(strBase64);
        }
    }

    function printHex(binaryString) {
        var i;
        var output = '';
        for (i = 0, len = binaryString.length; i < len; i++)
            output += binaryString.charCodeAt(i).toString(16) + '-';

    }

    function bitStringFromByte(byte) {
        return pad(byte.toString(2), 8);
    }

    function bitsFromBinaryString(string, startBit, length) {
        return string.substring(startBit, startBit + (length || 1));
    }

    function bitsFromByte(byte, startBit, length) {
        return bitsFromBinaryString(bitStringFromByte(byte), startBit, length);
    }

    function stringFromByteArray(bytes) {
        var string = '';
        for (var k = 0, len = bytes.length; k < len; k++)
            string += String.fromCharCode(bytes[k]);
        return string;
    }

    function pad(number, length) {
        var str = '' + number;
        while (str.length < length)
            str = '0' + str;
        return str;
    }

    //Function which begins all video processing. Scope contains all the video playing properties and functionality
    ns.onLoadScrubber = function (videoName, video) {

        //Stores the video object into the html of the video player div:
        $('#videoPlayerContainer').data('videoInstance', video);

        // DOM Elements
        //var progressHolder = document.getElementById("download-progress");
        var progressBar = document.getElementById("download-progress-bar");
        var extractPlaceholder = document.getElementById("extract-placeholder");
        var loadingGIF = document.getElementById('loading-gif');
        var loadingMessage = document.getElementById('loading-message');
        var spacer = document.getElementById("videoPlayerContainer");
        var imageHolder = document.getElementById("frameDisplayArea");
        var canvas = document.getElementById("mycanvas");
        var context = canvas.getContext("2d");
        var canvasBackup = document.getElementById("mycanvasBackup");
        var contextBackup = canvasBackup.getContext("2d");
        var pausePlay = document.getElementById("pause-play");

        var scrubImages = [];


        //Global playback/ video processing variables
        var playbackSpeed = video.rate;
        var deltaT = video.deltaT;
        var loopingBool = true;

        //Determines the max speed percentage for this video
        //Based off of the fact that we use setTimeout to delay the frame advance. SetTimeout has a mininum delay time of 4 ms in HTML5
        //So any speed that requires a delay of less than 4ms will simly not register so we will calculate this value and capped the percentage there
        var maxPlaybackSpeed = 10;


        //Will determine how much to delay the the video between frame(thus determining the speed)
        var frameDelay;

        //Represents the mininum time delay allowed by the setTimeout function
        var minTimeoutDelay = 4;

        var playing = false;
        var scrubbing = false;
        var generating = false;
        var rendered = false;
        var renderTimeoutId;
        var tryRenderCount = 0;
        var playTimeoutId;
        var barWidth;
        var frameSize;
        var zipGen;
        var queueNum = 0;
        var drawNum = 0;
        var extractLoop;
        var locationString = new String(location);
        var imgUrl = videoName;//decodeURIComponent("%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2F6%2F6a%2FSorting_quicksort_anim.gif");
        var query = locationString.substring(locationString.indexOf('?') + 1);
        var startFrame = video.startFrame;
        var stepCount = video.stepCount;
        var currentFrame = startFrame;//Starts off as the first frame
        var stepSize = video.stepSize;
        ns.videoRenderSuccess = false;


        //TODO: Move Somewhere appropriate
        $("#stepSizeDisplay").text(stepSize);
        $("#speedSelector").val(playbackSpeed * 100 + '%');




        var finalFrameIndex = 0;//Note that this is the index, so it is one more than the last frame number displayed to the page
        var timeModifier = 10 * stepSize;//Matches tracker play speed

        //Will eventually hold an array of all of the frame indices which should be played
        var validFrameIndices = [];

        var handleGIF = function (response) {

            extractPlaceholder.style.display = 'inline';
            canvas.style.display.display = 'none';





            // Performance
            var d = new Date();
            startTime = d.getTime();

            // Our GIF!
            var bin = new BinaryFile(response, 0, 0);
            var rawData = bin.getRawData();

            progressBar.style.width = 1;
            loadingMessage.innerHTML = 'Extracting frames...';

            // Check header
            var header = 'GIF89a' + rawData.substring(6, 13); // Rendering 87a GIFs didn't work right. Forcing the 89a version made them work. Go figure.
            var headerString = stringFromByteArray(bin.getBytesAt(0, 6));
            if (headerString != 'GIF89a' && headerString != 'GIF87a') {
                loadingMessage.innerHTML = '<span class="error">Error loading image.</span>';
                return false;
            }

            var width = bin.getShortAt(6, false);
            var height = bin.getShortAt(8, false);

            //Calculate aspect ratio
            var videoAspectRatio = width / height;

            if (typeof ns.trackerDataInstance != 'undefined') {
                //Stores the video aspect ratio  and dimensions for future use
                ns.trackerDataInstance.setVideoObjectLiteral('aspectRatio', videoAspectRatio);

                ns.trackerDataInstance.setVideoObjectLiteral('videoHeight', height);

                ns.trackerDataInstance.setVideoObjectLiteral('videoWidth', width);
            }



            var playerWidth = width < 400 ? 400 : width;
            canvas.width = width;
            canvas.height = height;
            canvasBackup.width = width;
            canvasBackup.height = height;
            spacer.style.width = playerWidth;
            spacer.style.height = height;
            barWidth = playerWidth;
            //progressHolder.style.width = width;
            document.getElementById("download-progress-percentage-2").style.width = width;
            extractPlaceholder.style.width = width;
            extractPlaceholder.style.height = height - 4;



            // Skip global color table
            var globalColorTable = '';
            var pos = 13;
            var packedHeader = bin.getByteAt(10);
            var globalColorTableFlag = bitsFromByte(packedHeader, 0, 1);
            if (globalColorTableFlag == '1') {
                var globalColorTableSize = bitsFromByte(packedHeader, 5, 3);
                var globalColorTableBytes = 3 * Math.pow(2, parseInt(globalColorTableSize, 2) + 1); // Get first 3 bits (0 is the LSB) from packed byte. Number of bytes to skip is 3*2^(n+1)
                globalColorTable = rawData.substring(13, 13 + globalColorTableBytes);
                pos += globalColorTableBytes;
            }

            // Loop variables
            var i = 0;
            var j = 0;


            var img = false;
            var blockSize = 0;
            var packedGCE;
            var currentGCE = {};
            var newFrameContainer;
            var newImage;

            //Creates the template html elements to be cloned that are needed to draw each frame to the page
            var frameContainerTemplate = $("<div>").css({
                height: "auto",
                width: "auto",
                display: "none"
            }).addClass('frameContainer');

            var frameOverlayLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var gTag = document.createElementNS("http://www.w3.org/2000/svg", "g");

            var xScale = ns.trackerDataInstance.getVideoObjectLiteral().videoWidth / width;

            var yScale = ns.trackerDataInstance.getVideoObjectLiteral().videoHeight / height;

            $(frameOverlayLayer).append(gTag);

            frameOverlayLayer.setAttributeNS(null, 'class', 'frameOverlayLayer');

            var imageTemplate = $("<img>").addClass('scrub');

            //Pushes these elements together in order to have a single element to clone
            frameContainerTemplate.append(frameOverlayLayer, imageTemplate);

            var imageData = '';
            var trailer = String.fromCharCode(0x3B);
            var renderQueue = [];
            var finishedLoop = false;

            // Image done loading data
            var finishedLoadingImage = function () {
                this.finishedLoading = true;
                setTimeout(tryRender, 1);
            }

            // Draw image to canvas then to DOM
            var tryRender = function () {
                tryRenderCount++;

                // All finished rendering
                if (!renderQueue.length && finishedLoop) {
                    if (rendered) return false;
                    rendered = true;

                    videoRenderSuccess();

                    //displays the video controls 
                    // displayControls();

                    return true;
                }

                if (!renderQueue.length) {
                    return false;
                }

                // Try rendering
                for (l = 0, len = renderQueue.length; l < len; l++) {

                    // Grab first image in the queue
                    var img = renderQueue.splice(l, 1)[0];

                    var frameContainer = $(img).parent();

                    //Check to make sure this image is defined
                    // Only threw an error in Firefox, make sure there are no other side effects
                    if (typeof img != 'undefined') {
                        // Not finished loading, put it back
                        if (!img.finishedLoading) {
                            var d = new Date();
                            var timeElapsed = d.getTime() - img.startTime;

                            if (timeElapsed < 500) {

                                renderQueue.splice(l, 0, img);
                                setTimeout(tryRender, 10);
                            }
                            else {

                                numFrames--;
                            }
                            return false;
                        }


                        drawNum++;

                        // Ready to draw:
                        img.removeEventListener('load', finishedLoadingImage, false);

                        // Disposal method 0 or 1: draw over last image
                        if (img.img.disposalMethod != 2 && img.img.disposalMethod != 3) {
                            context.drawImage(img, 0, 0, canvas.width, canvas.height);
                            img.src = canvas.toDataURL('image/png');
                        }

                        // Disposal method 2: draw over last image, then erase portion just drawn after rendering
                        if (img.img.disposalMethod == 2) {
                            context.drawImage(img, 0, 0, canvas.width, canvas.height);
                            img.src = canvas.toDataURL('image/png');
                            context.clearRect(img.img.pos.x, img.img.pos.y, img.img.size.w, img.img.size.h);
                        }

                        // Disposal method 3: Revert to previous frame after rendering	
                        if (img.img.disposalMethod == 3) {
                            contextBackup.putImageData(context.getImageData(0, 0, canvas.width, canvas.height), 0, 0);				// Make backup of current image
                            context.drawImage(img, 0, 0, canvas.width, canvas.height);												// Draw new image
                            img.src = canvas.toDataURL('image/png');																// Output/save
                            context.putImageData(contextBackup.getImageData(0, 0, canvasBackup.width, canvasBackup.height), 0, 0);	// Revert to previous image
                        }

                        // Add final image to page and remove garbage we added
                        img.img = null;
                        img.finishedLoading = null;
                        scrubImages[scrubImages.length] = img;
                        imageHolder.appendChild(frameContainer[0]);
                        finalFrameIndex++;
                    }
                }



                // Try next frame
                //if (finishedLoop)
                //	renderTimeoutId = setTimeout(tryRender, 10);
            }

            // Loop over bytes
            var loopBytes = function () {

                // Update the extraction progress bar
                // TODO: Performance, updating every loop costs like 10% of total extraction time
                if (i % 10 == 0) {

                    var windowWidth = $(progressBar).parent().width();
                    var loaded = pos / rawData.length;
                    $(progressBar).width(windowWidth * loaded);
                    $("#download-progress-percentage-2").text('Extracting ' + parseInt(loaded * 100) + '%');
                }

                // Get next byte
                i++;
                if (i > 1000) {
                    return false;
                }
                byte = bin.getByteAt(pos);

                // Extension introducer
                if (byte == 0x21) {
                    byte = bin.getByteAt(pos + 1);

                    if (byte == 0x01) {
                        // Never encountered this. Couldn't really test.
                        pos++;
                    }

                    else if (byte == 0xF9) {
                        packedGCE = bin.getByteAt(pos + 3);
                        currentGCE = {
                            "pos": pos,
                            "disposalMethod": parseInt(bitsFromByte(packedGCE, 3, 3), 2),
                            "delayTime": bin.getByteAt(pos + 4),
                        };
                        pos += 8;
                    }

                    else if (byte == 0xFE) {

                        pos += 2;
                        blockSize = byte = bin.getByteAt(pos);
                        j = 0;
                        while (byte != 0x00 && j < 1000) {

                            pos += (blockSize + 1);
                            blockSize = byte = bin.getByteAt(pos);
                        }
                        pos++;
                    }

                    else if (byte == 0xFF) {
                        pos += 14;
                        blockSize = appbyte = bin.getByteAt(pos);
                        j = 0;
                        while (appbyte != 0x00 && j < 10000) {
                            j++;
                            pos += 1 + blockSize; // Increment current "length" byte + data bytes
                            blockSize = appbyte = bin.getByteAt(pos); // New length byte or (0x00)
                        }
                        pos++;
                    }
                }

                    // New image frame
                else if (byte == 0x2C) {
                    //loadingMessage.innerHTML += '.';
                    // Record data byte locations, GCE information, and image frame dimensions
                    img = {
                        "start": pos,
                        "length": null,
                        "GCE": currentGCE.pos,
                        "disposalMethod": currentGCE.disposalMethod,
                        "delayTime": currentGCE.delayTime,
                        "pos": {
                            "x": bin.getShortAt(pos + 1),
                            "y": bin.getShortAt(pos + 3),
                        },
                        "size": {
                            "w": bin.getShortAt(pos + 5),
                            "h": bin.getShortAt(pos + 7),
                        },
                    };

                    // Skip local color table
                    var packedColorTableData = bin.getByteAt(pos + 9);
                    pos += 11;
                    var localColorTableFlag = bitsFromByte(packedColorTableData, 0, 1);
                    if (localColorTableFlag == '1') {
                        var localColorTableSize = bitsFromByte(packedColorTableData, 5, 3);
                        var localColorTableBytes = 3 * Math.pow(2, parseInt(localColorTableSize, 2) + 1); // Get first 3 bits (0 is the LSB) from packed byte as n. Number of bytes is 3*2^(n+1)                        
                        pos += localColorTableBytes;
                    }

                    // Skip data blocks
                    blockSize = databyte = bin.getByteAt(pos);
                    j = 0;
                    startPos = pos;
                    while (databyte != 0x00 && j < 10000000) {
                        j++;
                        pos = pos + blockSize + 1;
                        blockSize = databyte = bin.getByteAt(pos);
                    }

                    // Queue frame for rendering
                    pos++;
                    img.length = pos - img.start;

                    // Using a Graphics Control Extension
                    if (typeof currentGCE.pos != 'undefined') {
                        imageData = rawData.substring(img.GCE, img.GCE + 4); 				// Beginning of graphic control extension
                        imageData += stringFromByteArray([0x00, 0x00]); 						// Zero out the delay time
                        imageData += rawData.substring(img.GCE + 6, img.GCE + 8); 			// End of extension
                        imageData += rawData.substring(img.start, img.start + img.length);	// Image blocks
                    }

                        // No GCE provided
                    else {
                        imageData = rawData.substring(img.start, img.start + img.length);	// Image blocks
                    }

                    //Clones the frame container template so that we have all of the correct elements
                    newFrameContainer = frameContainerTemplate.clone(true);

                    newImage = newFrameContainer.find(".scrub");

                    newImage.on("load", finishedLoadingImage)
                            .attr({
                                id: 'scrubber-image-' + numFrames,
                                src: 'data:image/gif;base64,' + ns.encodeBase64(header + globalColorTable + imageData + trailer)
                            });

                    newImage[0].img = img;
                    var d = new Date();
                    newImage[0].startTime = d.getTime();
                    newImage[0].name = img.delayTime > 1 ? img.delayTime : 10; // No delay time? Let's do 100ms. Some browsers don't allow < 100ms, but we're cool so we'll play anything > 10ms.   
                    queueNum++;
                    renderQueue[renderQueue.length] = newImage[0];

                    //newImage.src = 'data:image/gif;base64,' + ns.encodeBase64(header + globalColorTable + imageData + trailer);
                    imageData = null;
                    numFrames++;
                }

                    // End of file
                else if (byte == 0x3B) {
                    finishedLoop = true;
                    setTimeout(tryRender, 1);

                    // Performance
                    var d = new Date();
                    endTime = d.getTime();

                    return true;
                }

                    // Weird. Move along?
                else {
                    pos++;
                }

                extractLoop = setTimeout(loopBytes, 1); // Keep going
            };

            extractLoop = setTimeout(loopBytes, 1); // Start the loop
        };

        //var handleProgress = function (data) {
        //    // Not enough data yet
        //    if (!data.lengthComputable)
        //        return false;

        //    // Update download progress 
        //    var loaded = data.loaded / data.total;
        //    //  $("#download-progress-bar").width(300 * loaded);
        //    //document.getElementById("download-progress-percentage").innerHTML = 'Downloading image ' + parseInt(loaded * 100) + '%';
        //    document.getElementById("download-progress-percentage-2").innerHTML = 'Downloading image ' + parseInt(loaded * 100) + '%';
        //};


        var videoRenderSuccess = function () {

            ns.videoRenderSuccess = true;

            //Sets the global array of valid video frame indices to be shown
            validFrameIndices = ns.calculateFrameIndices(startFrame, stepSize, stepCount, finalFrameIndex);

            //Finishes up the GIF scrubbing 
            clearTimeout(renderTimeoutId);
            bin = null;
            rawData = null;
            canvas.style.display = 'none';
            canvasBackup = null;
            contextBackup = null;
            loadingGIF.style.display = 'none';
            frameSize = 1 / numFrames;

            extractPlaceholder.style.display = 'none';
            spacer.style.marginTop = '0px';

            //Set this here because we need the frame duration value
            frameDelay = (scrubImages[0].name * timeModifier) / playbackSpeed;

            //Sets the maximum speed allowed for this video(see variable declaration for full explanation)
            maxPlaybackSpeed = (scrubImages[0].name * timeModifier) / minTimeoutDelay;

            var playbackSpeedCeiling = 200;


            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                playbackSpeedCeiling = 100;
            }

            maxPlaybackSpeed = maxPlaybackSpeed * 100 < playbackSpeedCeiling ? maxPlaybackSpeed : 2;


            drawVideoPlayerElements();

            showFrame(currentFrame);

            //Makes sure that the video is the correct size
            ns.redrawVideo();

            //Need to now draw all of the points on each video frame
            ns.drawFootprintLayers(scrubImages);

            ns.drawCoordinateAxis();
        }

        var drawVideoPlayerElements = function () {

            $('#videoPlaybackControls').css({
                'display': 'block'

            })

            //Makes all of the buttons in the video controller Jquery UI buttons:
            // $("#videoPlaybackControls button").button();
            $('#beginning').button({
                label: 'Jump To Beginning',
                text: false,
                icons: {
                    primary: "ui-icon-seek-first"
                }
            }).on('click', function () {
                if (playing == false) {
                    var frame = startFrame;
                    showFrame(frame);
                }
            });;

            $('#forward').button({
                label: 'Step Forward',
                text: false,
                icons: {
                    primary: "ui-icon-circle-triangle-e"
                }
            }).on('click', function () {
                if (playing == false) {
                    //frameStepForward();
                    frameStepForward();
                }
            });;

            $('#backward').button({
                label: 'Step Backward',
                text: false,
                icons: {
                    primary: "ui-icon-circle-triangle-w"
                }
            }).on(' click', function () {
                if (playing == false) {
                    frameStepBackward();
                }
            });

            $('#videoLoopBtn').button({
                label: 'Turn off video looping',
                text: false,
                icons: {
                    primary: 'ui-icon-cancel'//"ui-icon-refresh"
                }
            }).on('click', function () {
                loopingBool = !loopingBool;

                if (loopingBool) {//We know that we are looping

                    $(this).button({
                        label: 'Turn off video looping',
                        text: false,
                        icons: {
                            primary: 'ui-icon-cancel'//"ui-icon-refresh"
                        }
                    });
                }
                else {//We know that we are not looping

                    $(this).button({
                        label: 'Turn on video looping',
                        text: false,
                        icons: {
                            primary: "ui-icon-refresh"
                        }
                    });
                }

            });

            $('#speedSelector').spinner().on('spin', function (e, ui) {

                $('#speedSelector').on('spinstop', function () {
                    e.preventDefault();
                    e.stopPropagation();
                });
                //Since the spinner value will always be a string, the new value will be either +1 or -1 depending on the direction. 
                //the function incrementSpeedSelector expects these as input
                var incrementorDirection = ui.value;

                incrementSpeedSelector(incrementorDirection);
                e.preventDefault();
                return false;
            }).on('blur', function () {

                var newValue = parseInt($(this).val().split('%')[0]);

                //A safety check 
                newValue = isNaN(newValue) ? 100 : newValue;

                changePlayBackSpeed(newValue);

                $(this).val(Math.round(playbackSpeed * 100) + '%');
            }).on('keydown', function (e) {

                var keyCode = e.which;

                if (keyCode == 13) { //enter key pressed
                    $(this).trigger('blur');
                }
                else if (keyCode == 38) {//up arrow pressed                    
                    e.preventDefault()
                    incrementSpeedSelector(1);
                }
                else if (keyCode == 40) {//down arrow pressed                    
                    e.preventDefault()
                    incrementSpeedSelector(-1);
                }
            });

            $("#playPauseButton").button({
                label: 'Play',
                text: false,
                icons: {
                    primary: "ui-icon-play"
                }
            }).on('click', function () {
                if (playing) {
                    stopGIF();
                }
                else {
                    playGIF();
                }

            });


            //Initializes the slider(playhead) with a mininum value of the first frame index, a maximum value of the final frame(calculated above)
            //and a slider step size of the frame step size
            //We do this so that the only frames we display are those for which we have track data
            $('#videoPlayHead').slider({
                min: 0,
                max: finalFrameIndex - 1,
                // step: 1,
                value: startFrame,
                start: handleSlideStart,
                stop: handleSlideStop,
                slide: handleSlideProgress,
                animate: false
            });

            $('#videoPlayHead a').addClass('sliderHandle');

            var startPercentage = (validFrameIndices[0] / (finalFrameIndex - 1)) * 100;
            var endFramePercentage = (validFrameIndices[validFrameIndices.length - 1] / (finalFrameIndex - 1)) * 100;

            var delimiter = $('<a>').addClass('frameDelimiter');

            delimiter.clone().css({ left: startPercentage + '%' }).attr('title', 'Starting Position').appendTo('#videoPlayHead');
            delimiter.clone().css({ left: endFramePercentage + '%' }).attr('title', 'Ending Position').appendTo('#videoPlayHead');

        }

        var incrementSpeedSelector = function (incrementDecrementModifier) {

            //Removes the percentage sign from the text area and grabs the actual value
            var currentVal = parseInt($('#speedSelector').val().split('%'));

            var increment = 10;

            //Determines if this is a increase or decrease
            increment = increment * incrementDecrementModifier;

            currentVal += increment;

            changePlayBackSpeed(currentVal);

            $('#speedSelector').val(Math.round(playbackSpeed * 100) + '%');
        }

        var changePlayBackSpeed = function (newPlayBackSpeed) {

            if (newPlayBackSpeed < 10) {
                playbackSpeed = .1;
            }
            else if (newPlayBackSpeed > maxPlaybackSpeed * 100) {
                playbackSpeed = maxPlaybackSpeed;
            }
            else {
                playbackSpeed = Math.round(newPlayBackSpeed) / 100;
            }

            playbackSpeed = Math.ceil(playbackSpeed * 10) / 10;

        }

        var handleSlideProgress = function (e, ui) {


            var currentVal = ui.value;

            //var cancelable = e.cancelable;

            //if ($(e.currentTarget.activeElement).is('a')) {//Know that it was a drag that triggered this event
            //    console.log('this is an a');
            //    //Dont want to interfere with the video playback
            if (!playing) {


                showFrame(currentVal);


            }
            else {

                return false;

            }
            //}
            //else {//Know that it was a track click that triggered this event

            //    e.stopPropagation();
            //    return false;

            //}
            //return false

        }

        var handleSlideStart = function (e, ui) {

            if (playing) {

                stopGIF();

                return false;
            }



        }

        var handleSlideStop = function (e, ui) {

            //We have a handler here because we only want the slider to stop on a valid video frame
            var currentSliderValue = ui.value;

            //Need to do check to see if the user stopped on a valid frame value:
            if (validFrameIndices.indexOf(currentSliderValue) < 0) {//We have an invalid frame value

                //Need to find the closest frame value to the current value
                var closestFrame = getClosestValue(validFrameIndices, currentSliderValue);

                showFrame(closestFrame);

            }

        }

        //Determines which array value in the array 'a' is closest to the given value 'x'
        var getClosestValue = function (a, x) {
            var lo = -1, hi = a.length;
            while (hi - lo > 1) {
                var mid = Math.round((lo + hi) / 2);
                if (a[mid] <= x) {
                    lo = mid;
                } else {
                    hi = mid;
                }
            }
            if (a[lo] == x) {

                hi = lo;
            }

            //Need to know the difference between the low and x and then the difference between the hi and x
            var diffLo = x - a[lo];
            var diffHi = a[hi] - x

            var closestValue;

            //Determines which value is actually closer(defers to lower in case of tie)
            if (diffLo <= diffHi || isNaN(diffHi)) {
                closestValue = a[lo];
            }
            else {
                closestValue = a[hi];
            }

            return closestValue;
        }

        // Display frame
        function showFrame(frameNumber) {

            //console.time('showframe');

            //Need to know if this frame index should be shown:
            if (validFrameIndices.indexOf(frameNumber) >= 0) {

                //Hides the previously shown frame:                
                $(scrubImages[currentFrame]).parent().css({ 'display': 'none' })

                //$('.frameContainer:visible').css({ 'display': 'none' });

                //Shows the next frame            
                $(scrubImages[frameNumber]).parent().css({ 'display': 'block' });

                ////Updates the currentframe to the new frame
                currentFrame = frameNumber;

                ns.updateDataHighlighting(currentFrame)//(frameNumber - startFrame) / stepSize);

                $('#videoPlayHead').slider('value', frameNumber);

                //if (typeof sliderInstance.data('uiSlider') != 'undefined') {

                //    sliderInstance;
                //}

                $('#frameNumberDisplay').text(frameNumber);

            }

            //console.timeEnd('showframe');
        }

        // Scrub
        var numFrames = 0;

        // Play
        var advanceFrame = function () {

            moveForward();

            if (playing) {
                playTimeoutId = setTimeout(advanceFrame, (scrubImages[0].name * timeModifier) / playbackSpeed);
            }

        }

        var moveForward = function () {
            var nextFrame = currentFrame + stepSize;
            if (nextFrame > validFrameIndices[validFrameIndices.length - 1]) {
                if (!loopingBool) {//Check for looping                    
                    currentFrame = validFrameIndices[validFrameIndices.length - 1];
                    //TODO: For some reason this call is not canceling the setTimeout so we need to figure that out so looping can be cancelled
                    stopGIF();

                    return false;
                }
                nextFrame = startFrame;
            }
            showFrame(nextFrame);
        }

        //Steps the animation forward by a single frame
        var frameStepForward = function () {
            var nextFrame = currentFrame + stepSize;
            if (nextFrame > finalFrameIndex - 1) {
                nextFrame = finalFrameIndex - 1;
                return false;
            }
            showFrame(nextFrame);
        }

        //Steps animation backwards by a single frame
        var frameStepBackward = function () {
            var prevFrame = currentFrame - stepSize;
            if (prevFrame < startFrame) {
                prevFrame = startFrame;
                return false;
            }
            showFrame(prevFrame);
        }

        function playGIF() {

            //TODO: The video is off by quite a bit time-wise we definitly need to speed up the video processing so that it isnt so slow and can match Tracker
            console.time('bob');

            if (playing) return false;
            var options = {
                label: "Pause",
                icons: {
                    primary: "ui-icon-pause"
                }
            }
            $("#playPauseButton").button("option", options);

            playing = true;

            frameDelay = (scrubImages[0].name * timeModifier) / playbackSpeed;

            playTimeoutId = setTimeout(advanceFrame, frameDelay);

            //playTimeoutId = setTimeout(advanceFrame, (scrubImages[currentFrame].name * 10) / Math.abs(playbackSpeed));
        }

        function stopGIF() {

            console.timeEnd('bob');

            var options = {
                label: "Play",
                icons: {
                    primary: "ui-icon-play"
                }
            }
            $("#playPauseButton").button("option", options);

            playing = false;
            clearTimeout(playTimeoutId);

        }

        var playStopGIF = function () {

            if (playing) {
                stopGIF();
            }
            else {
                playGIF();
            }

        }

        //Adds keyboard shortcuts to aid video playback functionality
        $(document).on('keydown', function (e) {
            switch (e.which) {
                case 32: // Space
                    playStopGIF()
                    break;
                case 37: // Left Arrow
                    stopGIF();
                    frameStepBackward();
                    break;
                case 39: // Right Arrow
                    stopGIF();
                    frameStepForward();
                    break;
            }

        });

        //Adds play/pause functionality to a click on the video
        $('#frameDisplayArea').on('mousedown', '.frameContainer, #coordinateAxisContainer', function (e) {

            e.preventDefault();

            playStopGIF();
        });


        //TODO: Need to resolve IE and Opera incompatibility with the change of MIME type
        $.ajax({
            url: imgUrl,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.overrideMimeType("text/plain; charset=x-user-defined");
            },
        }).success(function (data) {
            handleGIF(data);
        }).error(function () {
            console.error('Video could not be retrieved.');
        })

        //Jumps the the given frame(public version)
        ns.jumpToFrame = function (frameIndexToShow) {

            //Check to make sure we arent playing the video
            if (!playing) {
                showFrame(frameIndexToShow);
            }

        }
    }

    //A preproccessing function which draws the video points for every track on every frame 
    ns.drawFootprintLayers = function () {
       
        //Check to ensure that track data has been instanitated
        //TODO: Is this a good practice? Assumes that tracker file processing will take longer than video processing, is this a safe bet?
        if (typeof ns.trackerDataInstance == 'undefined') {
            console.error('Tracker data has not been initialized');
        }
        else {

            var tracksObjectLiteral = ns.trackerDataInstance.tracksContainer.getTracks();

            ns.drawTracksFrameLayers(tracksObjectLiteral)
        }

        //Sets initial track visibility according to visibility in tracker
        //ns.setTrackInitialVisibility()
    }

    ns.drawTracksFrameLayers = function (tracksObjectLiteral) {
    

        var videoData = ns.trackerDataInstance.getVideoObjectLiteral();

        var coordSysData = ns.trackerDataInstance.getCoordinateSystemObjectLiteral();

        //Need to get the drawn video dimensions in order to determine how much saling should occure
        var drawnVideoDimensions = ns.getVideoPlayerDimensions();

        /*
        Needed for overlay scaling(basically finds how much of a transofmation needs to take place to get the coordinates from the original file form(which is what we 
        get from tracker) to the form where they fit on the video
        */


        var xScale = drawnVideoDimensions.width / videoData.videoWidth
        var yScale = drawnVideoDimensions.height / videoData.videoHeight;       

        //Need to draw points for each track
        for (var trackName in tracksObjectLiteral) {

            var trackInstance = tracksObjectLiteral[trackName];

            var trackFrameData = trackInstance.getFrameData();

            var frameArray = trackFrameData.frames;
            var xArray = trackFrameData.x;
            var yArray = trackFrameData.y;

            var footprint = trackInstance.getData().footprintData;

            var colorString = ns.formatRGBAColor(footprint.red, footprint.green, footprint.blue, footprint.alpha);
            var footprint = trackInstance.getData().footprintData.footprint;

            var boldModifier = 1;

            if (footprint.bold === true) {
                boldModifier = 1.5;
            }

            //Need to get the actual 'blueprint' for the footprint from globalDataProperties. Theses are object literal containing all of the SVG attributes of each footprint
            var footprintBlueprint = ns.footprints[footprint];

            ns.drawFrameOverlays(frameArray, xArray, yArray, xScale, yScale, footprintBlueprint, boldModifier, colorString, trackName);
        }
    }

    ns.drawFrameOverlays = function (frameArray, xArray, yArray, xScale, yScale, footprintBlueprint, boldModifier, colorString, trackName) {

        var scrubImages = $('.scrub')

        //Essentially a loop over the frames that we have data for
        for (var index = 0; index < frameArray.length; index++) {

            var frameIndex = frameArray[index];

            //Need the actual html element containing this index which is store locally in the scrub images array
            var videoFrame = scrubImages[frameIndex];


            //Need to make sure that the frame is actually present
            if (typeof videoFrame == 'undefined') {//We dont have a frame...something is definitely wrong

                console.error("Video Frame " + frameIndex + " is not present");

            }
            else { //Now we know we have everything we need

                //Need the <g> group tag within this frame
                var svgGroupTag = $(videoFrame).siblings('svg').find('g');

                //Add class to g tag to allow for easy manipulation (mostly hiding and showing)
                svgGroupTag.attr('class', 'videoFootprint');

                //Need to make the footprints bigger than they are, each is drawn within a 2x2 square based around (0, 0)
                //var footprintScalingFactor = 10;

                //Determines how much we need to translate the points(according to the pixel values defined by the trackerfile)
                var translateX = xArray[index];
                var translateY = yArray[index];

                //drawFootprints
                //Transforms the point and places in the correct location with the correct scale(we divide by the x and y scale so that the size of the point
                //does not depend on the size of the original video but rather the size of the container)
                var transform = "translate(" + translateX + "," + translateY + ") scale(.7, .7)";

                ns.drawFootprint(footprintBlueprint, boldModifier, colorString, transform, svgGroupTag, trackName);

            }
        }

    }

    ns.drawFootprint = function (footprintBlueprint, boldModifier, colorString, transform, SVGContainer, trackName) {

        //Some footprints contain multiple tags so we need to loop through the array of footprint elements defined in the 
        for (var i = 0; i < footprintBlueprint.length; i++) {

            //TODO: shouldnt need after we redo the footprint options parser
            //Makes a true copy of the blueprint object in order to prevent reference issues(FOR NOW)
            var blueprint = $.extend(true, {}, footprintBlueprint[i]);

            //Creates the appropriate element
            var footPrintElement = ns.drawSVGElement(blueprint, colorString, transform, trackName);

            //Checks if in a g-tag: 
            if ($(footPrintElement).parent('g').length != 0) {
                //Get g-tag scale
            }


            //Again, part of the really bad bold handler
            $(footPrintElement).attr('stroke-width', $(footPrintElement).attr('stroke-width') * boldModifier);

            SVGContainer.append(footPrintElement);
        }
    }

    ns.drawSVGElement = function (elementBlueprint, color, transformation, trackName) {

        var attributes = elementBlueprint.attributes;

        //Creates a new svg element(such as a line, rect, circle, etc. We use createElementNS because we need an element with a different doc type than html
        var footprint = document.createElementNS("http://www.w3.org/2000/svg", elementBlueprint.type)

        attributes.stroke = color;

        attributes.fill = color;

        attributes.transform = transformation;

        $(footprint).attr(attributes);
        $(footprint).attr('trackName', trackName);

        return footprint;
    }

    /*
    Changes the given track's overlay point position in the given frame container to the new values
    Useful for any track update function which would need to redraw it points after something has changed(eg change of defining function or center of mass dependencies)
    */
    ns.translateFrameOverlayPoint = function (currentFrameContainer, newXValue, newYValue, trackName) {

        var trackDataPointElement = currentFrameContainer.find('g *[trackname="' + trackName + '"]')[0];


        /*
        Setting just the translate attribute with javascript
        May lead to compatibility issues, see here
            http://stackoverflow.com/questions/10349811/how-to-manipulate-translate-transforms-on-a-svg-element-with-javascript-in-chrom
        and here
            https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform#Browser_compatibility
        */
        trackDataPointElement.transform.baseVal.getItem(0).setTranslate(newXValue, newYValue);
    }

    //Returns dimensions of the drawn video
    ns.getVideoPlayerDimensions = function () {
        return {
            height: $('.scrub:visible').height(),
            width: $('.scrub:visible').width(),
        }
    };

    //Calculates the frames which should be shown according to the video properties defined by tracker
    ns.calculateFrameIndices = function (videoStartFrame, videoStepSize, videoStepCount) {
        var indexArr = [];

        for (var index = 0; index < videoStepCount; index++) {

            var validIndex = videoStartFrame + index * videoStepSize;

            indexArr.push(validIndex);

        }

        return indexArr;
    }

}(ed))
