function AppCtrl(options) {

	var pgmReader,
		pgmDrawer,
		originalFileReaderOutput,
		filteredFileOutput,
		currentUploadedFile,
		downloadFile = null,
		isProccessing,
		contrastFilterValues = {
			r1: parseInt(options.contrastControlElements.r1ValueDomEl.value),
			s1: parseInt(options.contrastControlElements.s1ValueDomEl.value),
			r2: parseInt(options.contrastControlElements.r2ValueDomEl.value),
			s2: parseInt(options.contrastControlElements.s2ValueDomEl.value)
		},
		init = function () {
			pgmReader = new PgmReader();
			pgmDrawer = new PgmDrawer();
			initHandlers();
			setFilterValuesLabels();
			return this;
		},
		initHandlers = function () {
			options.inputFileDomEl.addEventListener('change', handleFileSelect, false);

			options.contrastControlElements.r1ValueDomEl.addEventListener('change', function (ev) {
				contrastFilterValues.r1 = parseInt(ev.target.value);
				fixMaxR1Value();
			});

			options.contrastControlElements.s1ValueDomEl.addEventListener('change', function (ev) {
				contrastFilterValues.s1 = parseInt(ev.target.value);
				setFilterValuesLabels();
				redrawEdittedFile();
			});

			options.contrastControlElements.r2ValueDomEl.addEventListener('change', function (ev) {
				contrastFilterValues.r2 = parseInt(ev.target.value);
				fixMaxR1Value();
			});

			options.contrastControlElements.s2ValueDomEl.addEventListener('change', function (ev) {
				contrastFilterValues.s2 = parseInt(ev.target.value);
				setFilterValuesLabels();
				redrawEdittedFile();
			});

			options.downloadFileLink.addEventListener('click', function (ev) {
				if ( filteredFileOutput ) {
					var fileText = pgmReader.createFileOutput(filteredFileOutput);
					var data = new Blob([fileText], {type: 'text/plain'});

					if ( downloadFile !== null ) {
						window.URL.revokeObjectURL(downloadFile);
					}

					downloadFile = window.URL.createObjectURL(data);

					var newFileName = currentUploadedFile.name.replace('.pgm', '-editted.pgm');
					options.downloadFileLink.setAttribute('download', newFileName);
					options.downloadFileLink.href = downloadFile;
				}
			});
		},
		handleFileSelect = function (evt) {
			currentUploadedFile = evt.target.files[0];
		
			if ( !currentUploadedFile ) {
				return;
			}

			setFileNameLabel(true);
			setDownloadLink(false);

			originalFileReaderOutput = null;
			filteredFileOutput = null;

			pgmReader.readPGM(evt.target.files[0], function onError (err) {
				
				alert(err.message);
				return;

			}, function onReady(readerOutput) {
				originalFileReaderOutput = readerOutput;

				pgmDrawer.drawPGM(originalFileReaderOutput, options.inputFileCanvas);

				redrawEdittedFile();

				setFileNameLabel(false);
			});
		},
		setFileNameLabel = function (isProccessing) {
			var name = currentUploadedFile.name;

			if ( isProccessing ) {
				name += ' ( processing... )';
			}

			options.fileNameLabelDomEl.innerHTML = name;
		},
		setDownloadLink = function (visible) {
			var styleVisible = visible ? 'block' : 'none';

			options.downloadFileLink.style.display = styleVisible;
		},
		redrawEdittedFile = function () {

			if ( originalFileReaderOutput ) {
				setFileNameLabel(true);
				
				setTimeout(function () {
					filteredFileOutput = pgmDrawer.drawPGM(originalFileReaderOutput, options.outputFileCanvas, contrastFilterValues);
					setFileNameLabel(false);
					setDownloadLink(true);
				}, 20);

			}
		},
		fixMaxR1Value = function () {

			if ( contrastFilterValues.r1 > contrastFilterValues.r2 - 1 ) {
				options.contrastControlElements.r1ValueDomEl.value = contrastFilterValues.r2 - 1;
				var event = new Event('change');
				options.contrastControlElements.r1ValueDomEl.dispatchEvent(event);
				return;
			}

			setFilterValuesLabels();
			redrawEdittedFile();
		},
		setFilterValuesLabels = function () {
			options.contrastControlElements.r1ValueLabelDomEl.innerHTML = contrastFilterValues.r1;
			options.contrastControlElements.r2ValueLabelDomEl.innerHTML = contrastFilterValues.r2;
			options.contrastControlElements.s1ValueLabelDomEl.innerHTML = contrastFilterValues.s1;
			options.contrastControlElements.s2ValueLabelDomEl.innerHTML = contrastFilterValues.s2;
		}

	return {
		init: init
	};
}