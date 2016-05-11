'use strict';
function PgmReader() {

	var browserReader,
		encryptionTypeAllowed = {
			'P2': true
		},
		readPGM = function (fileInput, onError, onFileReady) {
			browserReader = new FileReader();
			
			browserReader.onload = function (e) {
				onFileLoad(e, onError, onFileReady);
			};

			browserReader.onerror = function (ev) {
				var errMessage;

				switch (ev.target.error.code) {
					case ev.target.error.NOT_FOUND_ERR:
						errMessage = 'File Not Found.';
						break;
					case ev.target.error.NOT_READABLE_ERR:
						errMessage = 'File is not readable.';
						break;
					case ev.target.error.ABORT_ERR:
						errMessage = 'File reading aborted.';
						break;
					default:
						errMessage = 'An error occurred reading this file.';
				};

				onError({
					message: errMessage
				});

				return;
			};

			browserReader.readAsText(fileInput);
		},
		onFileLoad = function (e, onError, onFileReady) {
			var headerData = [],
				lines = e.target.result.split('\n'),
				arrValues = [],
				lineArr,
				line;

			for ( var l = 0; l < lines.length; l++ ) {
				lineArr = lines[l];

				// remove multiple spaces and split by empty space
				lineArr = lines[l].replace(/\s+/g, ' ').trim().split(' ');

				// dont include comments
				if ( lineArr[0].indexOf('#') < 0 ) {
					for ( var i = 0; i < lineArr.length; i++ ) {

						if ( l == 0 && i == 0 ) {
							// first value on the first line is the encryption type
							arrValues.push(lineArr[i]);
							continue;
						}

						// if the value is number
						// we store in the array with values
						if ( !isNaN(parseInt(lineArr[i])) ) {
							arrValues.push(parseInt(lineArr[i]));
						}
					}
				}				
		    }

		    var headerValidation = validateHeader(arrValues);

		    if ( !headerValidation.isValid ) {
		    	onError({
		    		message: headerValidation.errMessage
		    	});
		    }

		    // if header is not valid fallback to square image
		    headerValidation.header = headerValidation.header || generatePGMHeader(arrValues);

		    // matrix contains all pixel values, except header settings (first 4 values)
	    	onFileReady({
	    		'header': headerValidation.header,
	    		'matrix': generateMatrix(headerValidation.header, arrValues)
	    	});
		},
		validateHeader = function (fileArrValues) {
			var validHeader = {
				'encryptionType': fileArrValues[0],
				'imageWidth': parseInt(fileArrValues[1]),
				'imageHeight': parseInt(fileArrValues[2]),
				'maxGreyValue': parseInt(fileArrValues[3])
			};

			if ( !encryptionTypeAllowed[fileArrValues[0]] ) {
				return {
					header: validHeader,
					isValid: false,
					errMessage: 'Not supported encryption type or invalid value.'
				}
			}

			if ( !parseInt(fileArrValues[1]) || !parseInt(fileArrValues[2]) ) {
				return {
					header: null,
					isValid: false,
					errMessage: 'Invalid image size.'
				}
			}

			if ( !parseInt(fileArrValues[3]) ) {
				return {
					header: validHeader,
					isValid: false,
					errMessage: 'Invalid max grey value.'
				}
			}

			// all validations passed
			return {
				header: validHeader,
				isValid: true
			}
		},
		generateMatrix = function (header, arrValues) {
			arrValues.splice(0, 4);
			
			var outputMatrix = [],
				arrIndex = 0,
				colorValue;

			for ( var i = 0; i < header.imageHeight; i++ ) {
				outputMatrix[i] = [];

				for (var j = 0; j < header.imageWidth; j++ ) {
					colorValue = parseInt(arrValues[arrIndex]);
					// set white color if value is invalid
					outputMatrix[i][j] = isNaN( colorValue ) ? 255 : colorValue;
					arrIndex++;
				}
			};

			return outputMatrix;
		},
		generatePGMHeader = function (arrValues) {
			var size = parseInt(Math.sqrt(arrValues.length));

			return {
				'encryptionType': null,
				'imageWidth': size,
				'imageHeight': size,
				'maxGreyValue': 255
			};
		},
		createFileOutput = function (fileObject) {
			var CR = String.fromCharCode(13),
				space = String.fromCharCode(32)

			var text = 'P2' + CR;
			
			text += fileObject.header.imageWidth + ' ' + fileObject.header.imageHeight + CR + fileObject.header.maxGreyValue + CR;

			for ( var y = 0; y < fileObject.matrix.length; y++ ) {
				for ( var x = 0; x < fileObject.matrix[y].length; x++ ) {

					text += fileObject.matrix[y][x] + ' ';

				}

				text += CR;
			}

			return text;
		};

	return {
		readPGM: readPGM,
		createFileOutput: createFileOutput
	}
};