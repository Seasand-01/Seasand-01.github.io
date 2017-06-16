/**
 * MusicBox - script.js
 * Author: Seasand-yyh
 * Date: 2017-06-13
 */

$(function(){
	MusicBox.init();
});

var MusicBox = {

	currentSongIndex: 0,
	currentPlayList: [],
	currentSongLyric: null,
	player: null,
	pageBGRes: ['./images/pageBG/01.jpg','./images/pageBG/02.jpg','./images/pageBG/03.jpg',
				 './images/pageBG/04.jpg','./images/pageBG/05.jpg','./images/pageBG/06.jpg',
				 './images/pageBG/07.jpg','./images/pageBG/08.jpg','./images/pageBG/09.jpg',
				 './images/pageBG/10.jpg','./images/pageBG/11.jpg','./images/pageBG/12.jpg',
				 './images/pageBG/13.jpg','./images/pageBG/14.jpg','./images/pageBG/15.jpg'
	],


	init: function(){
		MusicBox.player = document.getElementById('audio');

		MusicBox.initPageBG();
		MusicBox.loadPageBGRes();
		MusicBox.switchPageBG();
		MusicBox.scrollSongTitle();
		MusicBox.togglePlayList();
		MusicBox.togglePlayButton();
		MusicBox.loadSongsRes();
		MusicBox.listenOnPlayList();
		MusicBox.writeRecordOnUnload();
		MusicBox.autoPlayNext();
		MusicBox.listenOnControl();
		MusicBox.initVolume();
		MusicBox.initTracker();
		MusicBox.scrollLyric();
	},

	setPageBG: function(url){
		$('body').css({
			'background': 'url('+url+') no-repeat center center fixed',
			'-webkit-background-size': 'cover',
		    '-moz-background-size': 'cover',
		    '-o-background-size': 'cover',
		    'background-size': 'cover'
		});
		EasyStorage.setItem('skinURL',url);
	},

	initPageBG: function(){
		var skinURL = EasyStorage.getItem('skinURL');
		var url = '';
		if(skinURL && skinURL!=''){
			url = skinURL;
		}else{
			var index = Math.floor(Math.random() * MusicBox.pageBGRes.length);
			url = MusicBox.pageBGRes[index];
		}
		MusicBox.setPageBG(url);
	},

	loadPageBGRes: function(){
		var strContent = '';
		for(var i=0; i<MusicBox.pageBGRes.length; i++){
			var url = MusicBox.pageBGRes[i];
			strContent += '<div class="skinPic">'
						+ '		<label>'
                        + '			<input type="radio" name="skins" value="'+url+'"/>'
                        + '			<img src="'+url+'" width="230px" >'
                        + '		</label>'
                        + '</div>';
		}
		$('#skinContent').html(strContent);
	},

	switchPageBG: function(){
		$('#saveButton').click(function(){
			var url = $('input[name=skins]:checked').val();
			if(url!=''){
				MusicBox.setPageBG(url);
			}
			$("#cancleButton").click();
		});
	},

	scrollSongTitle: function(){
		var doScroll = function(){
			var carts = $('#titleView .cart');
			for(var i=0; i<carts.length; i++){
				var oriVal = parseInt(carts[i].style.left);
				var val;
				if(oriVal>-300){
					val = oriVal - 1;
				}else{
					val = 300;
				}
				carts[i].style.left = val + 'px';
			}
		};

		var inter = setInterval(function(){
			doScroll();
		},50);

		$('#titleView').hover(function(){
			clearInterval(inter);
		},function(){
			inter = setInterval(function(){
				doScroll();
			},50);
		});
	},

	togglePlayList: function(){
		var count = 1;
		var leftValue = '';
		$('#listBtn img').click(function(){
			if(count>0){
				leftValue = '-300px';
			}else{
				leftValue = '0px';
			}
			count = -1*count;
			$('#playList').animate({
				left: leftValue
			},'slow');
		});
	},

	togglePlayButton: function(){
		$('#playBtn').click(function(){
			$('#pauseBtn').show();
			$('#playBtn').hide();
		});
		$('#pauseBtn').click(function(){
			$('#playBtn').show();
			$('#pauseBtn').hide();
		});
	},

	loadSongsRes: function(){
		$.getJSON("./content/config/songs.json", function(data){
			if(data && data.songs){
				MusicBox.currentPlayList = data.songs;
				MusicBox.renderPlayList(MusicBox.currentPlayList);
				MusicBox.autoPlayOnLoad();
			}
		});
	},

	renderPlayList: function(songs){
		if(!songs){
			return ;
		}
		var contStr = '';
		for(var i=0; i<songs.length; i++){
			var obj = songs[i];
			contStr += '<li><a class="menuLink songTag" alt="'+i+'">'+obj.singer+' - '+obj.songName+'</a></li>';
		}
		$('#playList ol').html(contStr);
	},

	listenOnPlayList: function(){
		$('#playList ol').delegate('.songTag','click',function(){
			var index =$(this).attr('alt');
			MusicBox.currentSongIndex = index;
			MusicBox.playSong();
		});
	},

	playSong: function(){
		var index = MusicBox.currentSongIndex;
		var currentSong = MusicBox.currentPlayList[index];
		if(currentSong==null){
			return;
		}

		//show song info on title
		$('#titleView .cart h3').text(currentSong.songName);
		$('#titleView .cart h5').text(" -- 演唱："+currentSong.singer);

		window.location.hash = currentSong.songName;
		var targetLi = $('#playList ol li').eq(index);
		$(targetLi).addClass('isPlayonList');
		$(targetLi).siblings().removeClass('isPlayonList');

		$('#pauseBtn').show();
		$('#playBtn').hide();

		var lyricURL = './content/lyric/'+currentSong.filename.substring(0,currentSong.filename.lastIndexOf('.'))+'.lrc';
		MusicBox.getLyric(lyricURL);

		var playURL = './content/song/'+currentSong.filename;
		MusicBox.player.src = playURL;
		MusicBox.player.addEventListener('canplay', function() {
            this.play();

            var min = parseInt(MusicBox.player.duration/60);
            if(min<10){
            	min = '0'+min;
            }
			var sec = parseInt(MusicBox.player.duration%60)+1;
			if(sec<10){
            	sec = '0'+sec;
            }
			$('#tip2').text(min+':'+sec);

			var progressBar = document.getElementById('progressBar');
			progressBar.min = 0;
			progressBar.step = 1;
			progressBar.value = 0;
			progressBar.max = MusicBox.player.duration;
        });
	},

	autoPlayOnLoad: function(){
		var songIndex = EasyStorage.getItem('songIndex');
		var songCurrentTime = EasyStorage.getItem('songCurrentTime');

		if(songIndex && songIndex!=''){
			MusicBox.currentSongIndex = parseInt(songIndex);
			if(songCurrentTime){
				MusicBox.player.currentTime = parseInt(songCurrentTime,10);
			}
		}else{
			MusicBox.currentSongIndex = 0; //如果没有记录，则播放第一首
		}
		MusicBox.playSong();
	},

	writeRecordOnUnload: function(){
		$(window).unload(function(){
			EasyStorage.setItem('songIndex',MusicBox.currentSongIndex);
			EasyStorage.setItem('songCurrentTime',MusicBox.player.currentTime);
		});
	},

	autoPlayNext: function(){
        MusicBox.player.addEventListener('ended', function() {
            if(MusicBox.currentSongIndex<MusicBox.currentPlayList.length-1){
            	MusicBox.currentSongIndex++;
            }else{
            	MusicBox.currentSongIndex = 0;
            }
            MusicBox.playSong();
        });
	},

	listenOnControl: function(){

		$('#playBtn').click(function(){
			MusicBox.player.play();
		});

		$('#pauseBtn').click(function(){
			MusicBox.player.pause();
		});

		$('#preBtn').click(function(){
			if(MusicBox.currentSongIndex>0){
            	MusicBox.currentSongIndex--;
            }else{
            	MusicBox.currentSongIndex = MusicBox.currentPlayList.length-1;
            }
            MusicBox.playSong();
		});

		$('#nextBtn').click(function(){
			if(MusicBox.currentSongIndex<MusicBox.currentPlayList.length-1){
            	MusicBox.currentSongIndex++;
            }else{
            	MusicBox.currentSongIndex = 0;
            }
            MusicBox.playSong();
		});
	},

	initVolume: function(){
		MusicBox.player.volume = parseInt($('#soundBar').val())/10;
		$('#soundBar').change(function(){
			var volume = $(this).val();
			MusicBox.player.volume = volume/10;
		});
	},

	initTracker: function(){
		$('#progressBar').change(function(){
			var progress = $(this).val();
			if(progress){
				$('#pauseBtn').show();
				$('#playBtn').hide();
				MusicBox.player.currentTime = progress;
			}
		});

		MusicBox.player.addEventListener('timeupdate',function (){
            var curtime = parseInt(MusicBox.player.currentTime, 10);
            var duration = parseInt(MusicBox.player.duration, 10);

            var progressBar = document.getElementById('progressBar');
			progressBar.value = curtime;

            var min = parseInt(curtime/60);
            if(min<10){
            	min = '0'+min;
            }
			var sec = parseInt(curtime%60);
			if(sec<10){
            	sec = '0'+sec;
            }
			$('#tip1').text(min+':'+sec);		
        });
	},

	getLyric: function(url) {
        $('#lyricView').html('<p style="font-size:20px;font-weight:bold;color:yellow;"> Loading... </p>');
        $.ajax({
			type: "GET",
			url: url,
			dataType: "text",
			success: function(data){
				var lyric = MusicBox.parseLyric(data);
				MusicBox.renderLyric(lyric);
				MusicBox.currentSongLyric = lyric;
			},
			error: function(jqXHR, textStatus, errorThrown) {
                $('#lyricView').html('<p style="font-size:20px;font-weight:bold;color:yellow;"> 歌词加载失败！ </p>');
            }
		});
    },

    parseLyric: function(text) {
        //get each line from the text
        var lines = text.split('\n'),
            //this regex mathes the time [00.12.78]
            pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
            result = [];

        // Get offset from lyrics
        var offset = MusicBox.getOffset(text);

        //exclude the description parts or empty parts of the lyric
        while (!pattern.test(lines[0])) {
            lines = lines.slice(1);
        };
        //remove the last empty item
        lines[lines.length - 1].length === 0 && lines.pop();
        //display all content on the page
        lines.forEach(function(v, i, a) {
            var time = v.match(pattern),
                value = v.replace(pattern, '');
            time.forEach(function(v1, i1, a1) {
                //convert the [min:sec] to secs format then store into result
                var t = v1.slice(1, -1).split(':');
                result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value]);
            });
        });
        //sort the result by time
        result.sort(function(a, b) {
            return a[0] - b[0];
        });
        return result;
    },

    renderLyric: function(lyric) {
        var lyricContainer = document.getElementById('lyricView');
        var fragment = document.createDocumentFragment();
        //clear the lyric container first
        lyricContainer.innerHTML = '';

        lyric.forEach(function(v, i, a) {
            var line = document.createElement('p');
            line.id = 'line-' + i;
            line.textContent = v[1];
            fragment.appendChild(line);
        });
        lyricContainer.appendChild(fragment);
    },

    getOffset: function(text) {
        //Returns offset in miliseconds.
        var offset = 0;
        try {
            // Pattern matches [offset:1000]
            var offsetPattern = /\[offset:\-?\+?\d+\]/g,
                // Get only the first match.
                offset_line = text.match(offsetPattern)[0],
                // Get the second part of the offset.
                offset_str = offset_line.split(':')[1];
            // Convert it to Int.
            offset = parseInt(offset_str);
        } catch (err) {
            offset = 0;
        }
        return offset;
    },

    scrollLyric: function(){
    	var colors = ['#FAFA17','#ff1493','#adff2f','#c617e8'];
    	var lyricStyle = Math.floor(Math.random() * 4);
    	
    	MusicBox.player.addEventListener("timeupdate", function(e) {
    		var lyric = MusicBox.currentSongLyric;
    		if (!lyric) return;
            for (var i = 0, l = lyric.length; i < l; i++) {
                if (this.currentTime > lyric[i][0] - 0.50 /*preload the lyric by 0.50s*/ ) {
                    var line = document.getElementById('line-' + i),
                        prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                    
                    prevLine.style.color = '#fff';
                    prevLine.style.fontSize = '16px';
                    //randomize the color of the current line of the lyric
                    line.style.color = colors[lyricStyle];
                    line.style.fontSize = '26px';

                    var lyricView = document.getElementById('lyricView');
                    lyricView.style.top = 130 - line.offsetTop + 'px';
                };
            };
        });
    }

};
