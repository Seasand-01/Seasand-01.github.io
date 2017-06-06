/**
 * MusicBox - script.js
 */

$(function(){
	MBConfig.init();
});

var MBConfig = {

	pageBGRes : ['./images/pageBG/01.jpg','./images/pageBG/02.jpg','./images/pageBG/03.jpg',
				'./images/pageBG/04.jpg','./images/pageBG/05.jpg','./images/pageBG/06.jpg',
				'./images/pageBG/07.jpg','./images/pageBG/08.jpg','./images/pageBG/09.jpg',
				'./images/pageBG/10.jpg','./images/pageBG/11.jpg','./images/pageBG/12.jpg',
				'./images/pageBG/13.jpg','./images/pageBG/14.jpg','./images/pageBG/15.jpg'
	],

	songsRes : [],

	currentSongIndex : 0,

	currentSongLyric : null,

	init : function(){
		MBConfig.initPageBG();
		MBConfig.loadPageBGRes();
		MBConfig.switchPageBG();
		MBConfig.scrollSongTitle();
		MBConfig.loadSongsRes();
		MBConfig.autoPlayNext();
		MBConfig.scrollLyric();
	},

	setPageBG : function(url){
		$('body').css({
			'background': 'url('+url+') no-repeat center center fixed',
			'-webkit-background-size': 'cover',
		    '-moz-background-size': 'cover',
		    '-o-background-size': 'cover',
		    'background-size': 'cover'
		});
	},

	initPageBG : function(){
		var index = Math.floor(Math.random() * MBConfig.pageBGRes.length);
		var url = MBConfig.pageBGRes[index];
		MBConfig.setPageBG(url);
	},

	loadPageBGRes : function(){
		var strContent = '';
		for(var i=0; i<MBConfig.pageBGRes.length; i++){
			var url = MBConfig.pageBGRes[i];
			strContent += '<div class="skinPic">'
						+ '		<label>'
                        + '			<input type="radio" name="skins" alt="'+url+'"/>'
                        + '			<img src="'+url+'" width="230px" >'
                        + '		</label>'
                        + '</div>';
		}
		$('#skinContent').html(strContent);
	},

	switchPageBG : function(){
		$('#saveButton').click(function(){
			var url = $('input[name=skins]:checked').attr('alt');
			if(url!=''){
				MBConfig.setPageBG(url);
			}
			$("#cancleButton").click();
		});
	},

	scrollSongTitle : function(){
		var doScroll = function(){
			var carts = $('#titleView .cart');
			for(var i=0; i<carts.length; i++){
				var oriVal = parseInt(carts[i].style.left);
				var val;
				if(oriVal>-500){
					val = oriVal - 1;
				}else{
					val = 500;
				}
				carts[i].style.left = val + 'px';
			}
		};

		var inter = setInterval(function(){
			doScroll();
		},30);

		$('#titleView').hover(function(){
			clearInterval(inter);
		},function(){
			inter = setInterval(function(){
				doScroll();
			},30);
		});
	},

	loadSongsRes : function(){
		$.getJSON("./content/config/songs.json", function(data){
			if(data && data.songs){
				MBConfig.songsRes = data.songs;
				MBConfig.renderPlayList(MBConfig.songsRes);
				MBConfig.autoPlayOnPageLoad();
			}
		});
	},

	renderPlayList : function(songs){
		if(!songs){
			return ;
		}
		var contStr = '';
		for(var i=0; i<songs.length; i++){
			var singer = songs[i].singer;
			var songName = songs[i].songName;
			var filename = songs[i].filename;
			contStr += '<li><a class="menuLink" onclick="MBConfig.playSong('+i+',\''+singer+'\',\''+songName+'\',\''+filename+'\')">'+singer+' - '+songName+'</a></li>';
		}
		$('#playList ol').html(contStr);
	},

	playSong : function(index,singer,songName,filename){
		MBConfig.currentSongIndex = index;

		//show song info on title
		$('#titleView .cart h3').text(songName);
		$('#titleView .cart h5').text(" -- 演唱者："+singer);

		window.location.hash = filename;
		var targetLi = $('#playList ol li').eq(index);
		$(targetLi).addClass('isPlayonList');
		$(targetLi).siblings().removeClass('isPlayonList');

		var lyricURL = './content/lyric/'+filename.substring(0,filename.lastIndexOf('.'))+'.lrc';
		MBConfig.getLyric(lyricURL);

		var playURL = './content/song/'+filename;
		var audioPlayer = document.getElementById('audio');
		audioPlayer.src = playURL;
		audioPlayer.addEventListener('canplay', function() {
            this.play();
        });
	},

	autoPlayOnPageLoad : function(){
		var index = 0;
		if(window.location.hash){
			index = parseInt(window.location.hash.substring(1,window.location.hash.lastIndexOf('.')));
		}
		var song = MBConfig.songsRes[index];
		MBConfig.playSong(index,song.singer,song.songName,song.filename);
	},

	autoPlayNext : function(){
		var audioPlayer = document.getElementById('audio');
        audioPlayer.addEventListener('ended', function() {
            if(MBConfig.currentSongIndex<MBConfig.songsRes.length-1){
            	index = MBConfig.currentSongIndex+1;
            }else{
            	index = 0;
            }
            var song = MBConfig.songsRes[index];
			MBConfig.playSong(index,song.singer,song.songName,song.filename);
        });
	},

	getLyric : function(url) {
        $('#lyricView').html('<p style="font-size:20px;font-weight:bold;color:yellow;"> Loading... </p>');
        $.ajax({
			type: "GET",
			url: url,
			dataType: "text",
			success: function(data){
				var lyric = MBConfig.parseLyric(data);
				MBConfig.renderLyric(lyric);
				MBConfig.currentSongLyric = lyric;
			},
			error: function(jqXHR, textStatus, errorThrown) {
                $('#lyricView').html('<p style="font-size:20px;font-weight:bold;color:yellow;"> 歌词加载失败！ </p>');
            }
		});
    },

    parseLyric : function(text) {
        //get each line from the text
        var lines = text.split('\n'),
            //this regex mathes the time [00.12.78]
            pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
            result = [];

        // Get offset from lyrics
        var offset = MBConfig.getOffset(text);

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

    renderLyric : function(lyric) {
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

    getOffset : function(text) {
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

    scrollLyric : function(){
    	var colors = ['#FAFA17','#ff1493','#adff2f','#c617e8'];
    	var lyricStyle = Math.floor(Math.random() * 4);
    	var audioPlayer = document.getElementById('audio');
    	audioPlayer.addEventListener("timeupdate", function(e) {
    		var lyric = MBConfig.currentSongLyric;
    		if (!lyric) return;
            for (var i = 0, l = lyric.length; i < l; i++) {
                if (this.currentTime > lyric[i][0] - 0.50 /*preload the lyric by 0.50s*/ ) {
                    var line = document.getElementById('line-' + i),
                        prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                    
                    prevLine.style.color = '#fff';
                    prevLine.style.fontSize = '16px';
                    //randomize the color of the current line of the lyric
                    line.style.color = colors[lyricStyle];
                    line.style.fontSize = '20px';

                    var lyricView = document.getElementById('lyricView');
                    lyricView.style.top = 130 - line.offsetTop + 'px';
                };
            };
        });
    }

};
