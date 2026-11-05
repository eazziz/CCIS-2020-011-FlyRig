const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path.replace('.asar','.asar.unpacked');

console.log(ffmpegPath);

obtain(['fs','fluent-ffmpeg', 'path', 'child_process'], (fs, ffmpeg, path, childProcess)=> {
  ffmpeg.setFfmpegPath(path.resolve(ffmpegPath));

  console.log(fs);
  if (!customElements.get('cam-era')) {

    class Camera extends HTMLElement {
      constructor() {
        super();

        this.options = {
          video: {
            width: {min: 640, ideal: 1920 },
            height: {min: 480, ideal: 1080 },
            frameRate: {exact: 30}
          }
        }

        this.metadata = {
          foo: "bar",
          bar: "foo",
          far: 'boo'
        };

        this.addMet = '';

        this.filePath = '';

        this.baseName = '';

        // Local clone of the IU-ISE-FlyRig-Files data repo; set from config
        // in app.js. When set, each save is handed to that repo's
        // scripts/add_run.py once the video finishes writing.
        this.dataRepoPath = '';
        this.pythonPath = 'python3';
        this.operator = '';
        this.runType = 'practice';
        this.cameraLabel = '';
        this.requestedFps = null;
        this.exposure = null;
        this.brightness = null;

        this.onAddRunStart = ()=>{};
        this.onAddRunDone = ()=>{};
        this.onAddRunError = ()=>{};
      }

      clear() {
        //this.recorder.clearRecordedData();
      }

      record() {
        this.isRecording = true;
        this.recordedChunks = [];
        this.recorder.start();
        this.recordTime = 0;
        this.startTime = Date.now();
      }

      stop() {
        var _this = this;
        if(_this.isRecording){
          _this.isRecording = false;
          _this.recorder.stop();
          this.recordTime = Date.now() - _this.startTime;
        }
      }

      play() {
        this.video.play();
        //this.tempVideo.play();
      }

      pause() {
        this.video.stop();
        //this.tempVideo.stop();
      }

      getSourceNames(cb) {
        navigator.mediaDevices.enumerateDevices().then(cb);
      }

      setSourceFromLabel(label) {
        var _this = this;
        return navigator.mediaDevices.enumerateDevices().then(dev=>{
          _this.options.deviceId = dev.find(dev=>dev.label == label).deviceId;
        });

      }

      init(cb) {
        var _this = this;
        if (navigator.getUserMedia) {
          console.log(_this.options);
          navigator.getUserMedia( _this.options, cb, (error)=>console.log(error.code));
          console.log('after get user mdeia')
        }
      }

      blobToBuffer(blob){
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(blob);
            reader.onloadend = () => { resolve(Buffer.from(reader.result)); };
            reader.onerror = (ev) => { reject(ev.error); };
        });
      }

      onDataAvailable (blob){
        //this.makeDownload(blob);
        var _this = this;
        _this.blobToBuffer(blob).then(_this.saveFile.bind(_this));
        //this.addMetadata(blob).then(_this.saveFile);
      }

      onSaveProgress(perc){

      }

      onSaveEnd(){

      }

      beforeSave(){

      }

      addMetadata (blob){
        // var _this = this;
        // const decoder = new Decoder();
        //
        // // load webm blob and inject metadata
        // return _this.blobToBuffer(blob).then((buffer) => {
        //     decoder.on('data', chunk => console.log(chunk));
        //     decoder.write(buffer);
        // });
      }


      saveFile(buffer){
        var _this = this;
        _this.beforeSave();
        console.log('saving');
        var basePath = path.join(_this.filePath, _this.baseName);
        var inter = path.join(__dirname,'../../../intermediate.webm').replace('.asar','.asar.unpacked');
        console.log(basePath);
        console.log(inter);

        // One timestamp shared by the video and CSV, so they always match
        // exactly (also what add_run.py is handed as --app-csv).
        var stamp = (new Date()).toISOString().replace(/:|-|\./g,'_');
        var stampedBase = `${basePath.replace(/\/:|-|\./g,'_')}_${stamp}`;
        var videoFile = `${stampedBase}.mp4`;
        var csvFile = `${stampedBase}.csv`;

        fs.writeFile(inter,buffer,'base64',(e)=>{
          if(!e){
            console.log("convert")
            var command = ffmpeg(inter).noAudio().videoCodec('copy');//.fps(30)

            // for (var key in _this.metadata) {
            //   if (_this.metadata.hasOwnProperty(key)) {
            //     command.outputOptions('-metadata', `"${key}"="${_this.metadata[key]}"`);
            //   }
            // }

            command.on('stderr', function(stderrLine) {
              console.log('Stderr output: ' + stderrLine);
            });

            command.on('progress', function(progress) {
              var perc = (Date.parse("15 Jan 1987 "+progress.timemark) - Date.parse("15 Jan 1987 00:00:00")) / _this.recordTime;
              _this.onSaveProgress(perc);
            });

            command.on('end', function() {
              _this.onSaveEnd();
              console.log('Finished processing');
              _this.addRun(videoFile, csvFile);
            })


            command.save(videoFile);
            var csv = '';
            csv += _this.addMet;
            for (var key in _this.metadata) {
              if (_this.metadata.hasOwnProperty(key)) {
                csv+=`"${key}","${_this.metadata[key]}"\n`;
              }
            }
            fs.writeFileSync(csvFile, csv);
          }
        });

      }

      addRun(videoFile, csvFile){
        var _this = this;
        if (!_this.dataRepoPath) return;

        // videoFile/csvFile may be relative (e.g. if Save Location's "Set"
        // was never clicked - see app_notes.md). Resolve them against this
        // process's cwd, same as the ffmpeg child process that wrote them,
        // before handing them to add_run.py, which runs with a different cwd.
        videoFile = path.resolve(videoFile);
        csvFile = path.resolve(csvFile);

        var scriptPath = path.join(_this.dataRepoPath, 'scripts', 'add_run.py');
        if (!fs.existsSync(scriptPath)) {
          var missing = new Error(`add_run.py not found at ${scriptPath}`);
          console.log(missing.message);
          _this.onAddRunError(missing);
          return;
        }

        var args = [scriptPath, videoFile, '--app-csv', csvFile, '--run-type', _this.runType || 'practice'];
        if (_this.operator) args.push('--operator', _this.operator);
        if (_this.cameraLabel) args.push('--camera', _this.cameraLabel);
        if (_this.requestedFps) args.push('--requested-fps', String(_this.requestedFps));
        if (_this.exposure) args.push('--exposure', String(_this.exposure));
        if (_this.brightness) args.push('--brightness', String(_this.brightness));

        _this.onAddRunStart();

        childProcess.execFile(_this.pythonPath || 'python3', args, { cwd: _this.dataRepoPath }, (error, stdout, stderr)=>{
          if (error) {
            console.log('add_run.py failed:', stderr || error.message);
            _this.onAddRunError(new Error(stderr || error.message));
          } else {
            console.log(stdout);
            _this.onAddRunDone(stdout);
          }
        });
      }

      makeDownload(blob){
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = `${this.baseName}_${(new Date()).toISOString()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      startStream(cb){
        var _this = this;
        _this.init((stream)=> {
          console.log("here");
          _this.stream = stream;

          _this.video.srcObject = _this.stream;

          let track = stream.getVideoTracks()[0];
          let consts = track.getConstraints();

          if(consts.brightness) console.log("brightness");

          console.log(consts);

          _this.overlayCB = ()=>{};

          _this.video.addEventListener('loadedmetadata', ()=> {

            //_this.canvas.width = _this.tempVideo.videoWidth;
            //_this.canvas.height = _this.tempVideo.videoHeight;

            _this.play();

            var frames = 0;
            //var startTime = Date.now();

            // clearInterval(_this.canvInt);
            // _this.canvInt = setInterval(()=>{
            //   //frames++;
            //   //console.log(1000 * frames/(Date.now() - startTime));
            //   _this.ctx.drawImage(_this.tempVideo,0,0,_this.canvas.width, this.canvas.height);
            //
            // },1000/_this.options.video.frameRate.exact);
            //
            // _this.stream = _this.canvas.captureStream(_this.options.video.frameRate.exact);

            // _this.video.srcObject = _this.stream;
            // _this.video.play();

            this.recordedChunks = [];

            var options = {
              mimeType: "video/webm; codecs=h264", //vp9
              //videoBitsPerSecond: 2 * 1024 * 1024,
            };
            _this.recorder = new MediaRecorder(_this.stream, options);

            this.recorder.ondataavailable = event=>{
              if (event.data.size > 0) {
                  this.recordedChunks.push(event.data);
                  let blob = new Blob(this.recordedChunks, {
                    type: "video/webm"
                  });
                _this.onDataAvailable(blob);
              }
            };

            if(cb) cb();
          });

        });
      }

      connectedCallback() {
        //register events, check contents, etc.
        var _this = this;

        _this.onRecordEnd = (blob)=> {};

        if (!_this.shadowRoot) {
          _this.root = _this.attachShadow({ mode: 'open' });

          _this.root.innerHTML = `<style> @import "css/camera.css";</style>`;

          _this.video = µ('+video', _this.root);
          //_this.tempVideo = µ('+video', _this.root);
          //_this.tempVideo.display = "none";
          _this.canvas = µ('+canvas', _this.root);
          _this.ctx = _this.canvas.getContext('2d');

        }
      };
    };

    customElements.define('cam-era', Camera);
  }

  exports.Camera = customElements.get('cam-era');

  provide(exports);
});
