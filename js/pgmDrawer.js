'use strict';
function PgmDrawer() {

	var cachePixels = {},
		imagePartSize = 125,
		ctx,
		drawPGM = function ( pgmReaderOutput, canvasDomEl, filter ) {

			var pgmReaderOutput = JSON.parse(JSON.stringify(pgmReaderOutput));

			ctx = canvasDomEl.getContext('2d');
			ctx.clearRect(0, 0, canvasDomEl.width, canvasDomEl.height);

			canvasDomEl.width = pgmReaderOutput.header.imageWidth;
			canvasDomEl.height = pgmReaderOutput.header.imageHeight;

			console.time('draw PGM', 'time');
			// drawPerPX( pgmReaderOutput, canvasDomEl, filter );
			pgmReaderOutput.matrix = generateBitmap(pgmReaderOutput.matrix, pgmReaderOutput.header.imageWidth,  pgmReaderOutput.header.imageHeight, filter);
			console.timeEnd('draw PGM', 'time');

			// returning the output with apllied filter
			return pgmReaderOutput;
		},
		getImagePartsCount = function (pxSize) {
			var parts = 0;

			if ( pxSize >= imagePartSize ) {
				parts = parseInt(( pxSize / imagePartSize ));
			}

			if ( pxSize % imagePartSize > 0 ) {
				parts++;
			}

			return parts;
		},
		generateBitmap = function (arrPixels, width, height, filter) {
			var imageParts = [],
				xParts,
				yParts,
				partPixelsArr = [];

			xParts = getImagePartsCount(width);
			yParts = getImagePartsCount(height);

			var pixelsLeftWidth,
				pixelsLeftHeight = height;

			var imgPartPixels,
				bmp,
				greyValue,
				decimalGrey;

			// image parts generation
			for (var i = 0; i < yParts; i++ ) {
				pixelsLeftWidth = width;

				var stepY = Math.min(imagePartSize, pixelsLeftHeight);

				for ( var j = 0; j < xParts; j++ ) {
					var stepX = Math.min(imagePartSize, pixelsLeftWidth);

					var startX = width - pixelsLeftWidth,
						startY = height - pixelsLeftHeight,
						partObj = {
							startX: startX,
							endX: startX + stepX,
							startY: startY,
							endY: startY + stepY,
							width: stepX,
							height: stepY
						};

					imageParts.push(partObj);

					bmp = new Bitmap(partObj.width, partObj.height);
					imgPartPixels = [];

					for ( var x = 0; x < partObj.width; x++ ) {
						imgPartPixels[x] = [];
						for (var y = 0; y < partObj.height; y++ ) {

							var realX = partObj.startX + x,
								realY = partObj.startY + y;

							greyValue = arrPixels[realY][realX];

							if ( filter ) {
								greyValue = ( filter.s1 + ( greyValue * (filter.s2 - filter.s1) / (filter.r2 - filter.r1) ) );
								greyValue = Math.min(parseInt(greyValue), 255);
							}

							arrPixels[realY][realX] = greyValue;

							decimalGrey = greyValue / 255;

							imgPartPixels[x][y] = [decimalGrey, decimalGrey, decimalGrey, 1];

						}
					}

					bmp.pixel = imgPartPixels;
					partObj.bmp = bmp;

					addToCanvas(partObj);

					pixelsLeftWidth -= stepX;
				}

				pixelsLeftHeight -= stepY;
			}

			return arrPixels;
		},
		addToCanvas = function (imagePart) {
			var image = new Image();

			image.onload = function() {
			    ctx.drawImage(image, imagePart.startX, imagePart.startY);
			};

			image.src = imagePart.bmp.dataURL();
		},
		drawPerPX = function ( pgmReaderOutput, canvasDomEl, filter ) {
			ctx = canvasDomEl.getContext("2d");

			var greyValue,
				pxData,
				bigImage = ( pgmReaderOutput.matrix.length * pgmReaderOutput.matrix[0].length ) > 6 ? true : false;

			canvasDomEl.width = pgmReaderOutput.header.imageWidth;
			canvasDomEl.height = pgmReaderOutput.header.imageHeight;
			//ctx.clearRect(0, 0, canvasDomEl.width, canvasDomEl.height);

			for ( var y = 0; y < pgmReaderOutput.matrix.length; y++ ) {
				for ( var x = 0; x < pgmReaderOutput.matrix[y].length; x ++ ) {

					greyValue = pgmReaderOutput.matrix[y][x];

					if ( filter ) {
						greyValue = ( filter.s1 + ( greyValue * (filter.s2 - filter.s1) / (filter.r2 - filter.r1) ) );
						greyValue = Math.min(parseInt(greyValue), 255);
					}

					pgmReaderOutput.matrix[y][x] = greyValue;

					if ( bigImage ) {
						ctx.fillStyle = "rgba(" + greyValue + ', ' + greyValue + ', ' + greyValue + ", 255)";
						ctx.fillRect( x, y, 1, 1 );
						continue;
					}

					if ( cachePixels[greyValue] ) {
						ctx.putImageData(cachePixels[greyValue], x, y);
					} else {

						pxData = ctx.createImageData(1, 1);

						pxData.data[0] = pxData.data[1] = pxData.data[2] = greyValue;
						pxData.data[3] = 255;

						cachePixels[greyValue] = pxData;
					}
				}
			}
		}

	return {
		drawPGM: drawPGM
	};
};
