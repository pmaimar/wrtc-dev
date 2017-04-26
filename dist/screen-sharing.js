// ......................................................
// .......................UI Code........................
// ......................................................

            //Abrir una sala one to many
            /////////////////////////////////////////

            document.getElementById('open-room').onclick = function() {
                disableInputButtons();
                connection.sdpConstraints.mandatory = {
                    OfferToReceiveAudio: false,
                    OfferToReceiveVideo: false
                };
                connection.open(document.getElementById('room-id').value, function() {
                    showRoomURL(connection.sessionid);
                });

                var streamControl = document.getElementById('streamControl');
                var recordControl = document.getElementById('recordControl');
                streamControl.style.display = "inline-block";
                //recordControl.style.display = "inline-block";
            };

            //Unirse a una sala existente
            //////////////////////////////////////////

            document.getElementById('join-room').onclick = function() {
                //disableInputButtons();
                connection.sdpConstraints.mandatory = {
                    OfferToReceiveAudio: true,
                    OfferToReceiveVideo: true
                };
                connection.join(document.getElementById('room-id').value);

            };

            //Auto unirse o crear sala
            //////////////////////////////////////////

            document.getElementById('open-or-join-room').onclick = function() {
                disableInputButtons();
                connection.openOrJoin(document.getElementById('room-id').value, function(isRoomExists, roomid) {
                    if(!isRoomExists) {
                        showRoomURL(roomid);
                    }
                });
            };

            //Abrir una sala compartiendo el escritorio
            ///////////////////////////////////////////

            document.getElementById('toggle-video').onclick = function() {
                connection.disconnect();
            };


// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................

            var connection = new RTCMultiConnection();

            // by default, socket.io server is assumed to be deployed on your own URL
            connection.socketURL = '/';
            // comment-out below line if you do not have your own socket.io server
            // connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
            connection.socketMessageEvent = 'video-broadcast-demo';
            connection.session = {
                video: true,
                audio: true,
                screen: true,
                oneway: false
            };
            connection.videosContainer = document.getElementById('videos-container');
            connection.onstream = function(event) {
                connection.videosContainer.appendChild(event.mediaElement);
                event.mediaElement.play();
                setTimeout(function() {
                    event.mediaElement.play();
                }, 5000);
            };
            // Using getScreenId.js to capture screen from any domain
            // You do NOT need to deploy Chrome Extension YOUR-Self!!
            connection.getScreenConstraints = function(callback) {
                getScreenConstraints(function(error, screen_constraints) {
                    if (!error) {
                        screen_constraints = connection.modifyScreenConstraints(screen_constraints);
                        callback(error, screen_constraints);
                        return;
                    }
                    throw error;
                });
            };

            function disableInputButtons() {
                document.getElementById('open-or-join-room').disabled = true;
                document.getElementById('open-room').disabled = true;
                document.getElementById('join-room').disabled = true;
                document.getElementById('room-id').disabled = true;
            }

            // ......................................................
            // ......................Handling Room-ID................
            // ......................................................

            function showRoomURL(roomid) {
                var roomHashURL = '#' + roomid;
                var roomQueryStringURL = '?roomid=' + roomid;

                var html = '<h4>URL de sala:</h4>';

                html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
                html += '<br>';
                html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';
                html += '<br><br>';

                var roomURLsDiv = document.getElementById('room-urls');
                roomURLsDiv.innerHTML = html;

                roomURLsDiv.style.display = 'block';
            }

            (function() {
                var params = {},
                    r = /([^&=]+)=?([^&]*)/g;

                function d(s) {
                    return decodeURIComponent(s.replace(/\+/g, ' '));
                }
                var match, search = window.location.search;
                while (match = r.exec(search.substring(1)))
                    params[d(match[1])] = d(match[2]);
                window.params = params;
            })();

            var roomid = '';

            if (localStorage.getItem(connection.socketMessageEvent)) {
                roomid = localStorage.getItem(connection.socketMessageEvent);
            } else {
                roomid = connection.token();
            }
            document.getElementById('room-id').value = roomid;
            document.getElementById('room-id').onkeyup = function() {
                localStorage.setItem(connection.socketMessageEvent, this.value);
            };

            var hashString = location.hash.replace('#', '');
            if(hashString.length && hashString.indexOf('comment-') == 0) {
              hashString = '';
            }

            var roomid = params.roomid;
            if(!roomid && hashString.length) {
                roomid = hashString;
            }

            if(roomid && roomid.length) {
                document.getElementById('room-id').value = roomid;
                localStorage.setItem(connection.socketMessageEvent, roomid);

                // auto-join-room
                (function reCheckRoomPresence() {
                    connection.checkPresence(roomid, function(isRoomExists) {
                        if(isRoomExists) {
                            connection.join(roomid);
                            return;
                        }

                        setTimeout(reCheckRoomPresence, 5000);
                    });
                })();

                disableInputButtons();
            }



///////////////////////////////////////////////////
/////////////////////RecordRTC/////////////////////
///////////////////////////////////////////////////


function PostBlob(audioBlob, videoBlob, fileName) {
    var formData = new FormData();
    formData.append('filename', fileName);
    formData.append('audio-blob', audioBlob);
    formData.append('video-blob', videoBlob);
    xhr('https://192.168.0.108:4443/wrtcdev/RTCMultiConnection-master/save.php', formData, function(ffmpeg_output) {
        document.querySelector('h5').innerHTML = ffmpeg_output.replace(/\\n/g, '<br />');
        
        //var video = document.createElement('video');
        //videoPreviews.appendChild(video);
        //video.src = '/uploads/' + fileName + '-merged.webm';
        //video.controls = true;
        //preview.play();
        //video.muted = false;
    });
}

var record = document.getElementById('record');
var stop = document.getElementById('stop');

var audio = document.querySelector('audio');

var recordVideo = document.getElementById('record-video');
var videoPreviews = document.getElementById('videoPreviews');

var container = document.getElementById('container');

var recordAudio, recordVideo;
record.onclick = function() {
    record.disabled = true;
    !window.stream && navigator.getUserMedia({
        audio: true,
        video: true
    }, function(stream) {
        window.stream = stream;
        onstream();
    }, function(error) {
        alert(JSON.stringify(error, null, '\t'));
    });

    window.stream && onstream();

    function onstream() {
        //preview.src = window.URL.createObjectURL(stream);
        //preview.play();
        //preview.muted = true;

        recordAudio = RecordRTC(stream, {
            type: 'audio',
            recorderType: StereoAudioRecorder,
            // bufferSize: 16384,
            onAudioProcessStarted: function() {
                recordVideo.startRecording();
            }
        });

        var videoOnlyStream = new MediaStream();
        videoOnlyStream.addTrack(stream.getVideoTracks()[0]);
        recordVideo = RecordRTC(videoOnlyStream, {
            type: 'video',
            // recorderType: MediaStreamRecorder || WhammyRecorder
        });

        recordAudio.startRecording();

        stop.disabled = false;
    }
};

var fileName;
stop.onclick = function() {
    document.querySelector('h5').innerHTML = 'Getting Blobs...';

    record.disabled = false;
    stop.disabled = true;

    //preview.src = '';
    //preview.poster = 'ajax-loader.gif';

    fileName = Math.round(Math.random() * 99999999) + 99999999;
    //fileName = roomid;

    recordAudio.stopRecording(function() {
        document.querySelector('h5').innerHTML = 'Got audio-blob. Getting video-blob...';
        recordVideo.stopRecording(function() {
            document.querySelector('h5').innerHTML = 'El archivo de video esta siendo procesado...';
            PostBlob(recordAudio.getBlob(), recordVideo.getBlob(), fileName);
        });
    });
};

function xhr(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            callback(request.responseText);
        }
    };
    request.open('POST', url);
    request.send(data);
}



////////////////////////////////////////////////////////////////
//////////////////////Ajax Function JQuery//////////////////////
////////////////////////////////////////////////////////////////

// $(document).ready(function(){
//     $("#loadRecentStreams").click(function(){
//         $.ajax({url: ":4443/wrtcdev/RTCMultiConnection-master/readfiles.php", success: function(result){
//             $("#videoPreviews").html(result);
//         }});
//     });
// });


////////////////////////////////////////////////////////////////
//////////////////////Check extension//////////////////////
////////////////////////////////////////////////////////////////
