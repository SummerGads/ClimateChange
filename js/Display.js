define(["Game", "jsonEditor", "HealthBar", "text!avatars", "jQuery", "jQueryUI"], function(Game, JSONEditor, HealthBar, avatarsData) {

	var State;
	var Coordinator;

	var gameModeChosen = "";				//holder for if game is chosen through UI knobs for scene
	var interfaceMode = "normal";			//how scenes progress...a timeline that's returned to ("timeline"), or progress scene-to-scene ("normal")
	var avatarMode = "oneMain";				//oneMain means just one main character, otherwise "normal" RPG style

	//initializes our copy of State and Coordinator
	var init = function(_Coordinator, _State) {
		State = _State;
		Coordinator = _Coordinator;

		State.set("displayType", "notEditor");		//this is so we properly end scenes, etc. and don't do editor/viz stuff
	}

	var makeLink = function(_coordinator, id, content, target) {
		
		var pTag = $('<p/>', {
		    class: 'titleLink',
		});

		var linkId = id;
		if (id.indexOf(":") > -1) { linkId = id.split(":")[1]; }

		$('<a/>', {
		    href: target,
		    id: "startScene_" + linkId,
		    text: content,
		    click: function() {
				$( "#blackout" ).fadeIn( "slow", function() {
	    			startScene(_coordinator,id, true);
  				});
			}
		}).appendTo(pTag);

		return pTag;
	}

	var startScene = function(_coordinator, id, loadIntro) {

		if (id.substring(0,6) == "intro:") {		//if we're just using the intro as an interstitial scene, not actually running the game...
			initSceneScreen(State, bg, id);
			_coordinator.loadSceneIntro(id);
			State.set("currentScene", id);
		}
		else {
			_coordinator.cleanState(id);
			var bg = _coordinator.loadBackground(id);
			processWishlistSettings(_coordinator, id);
			initSceneScreen(State, bg, id);
			if (loadIntro) { _coordinator.loadSceneIntro(id); }
			_coordinator.loadAvatars(id);
			_coordinator.validateArtAssets(id);
			_coordinator.loadStoryMaterials(id);
		}
	}

	var initTitleScreen = function(_Coordinator, _State, scenes, playGameScenes) {

		init(_Coordinator, _State);				//initialize our copy of the coordinator and state
		
		$('<h1/>', {
		    text: "Emma's Journey",
		    id: 'title'
		}).appendTo('body');

		var begin = $('<h2/>', {
			text: 'Begin',
			id: 'begin',
			click: function() {
				$( "#blackout" ).fadeIn( "slow", function() {
	    			startScene(_Coordinator, playGameScenes[0], true);
  				});
			}
		}).appendTo('body');

		if (localStorage.getItem("playerIdentifier") == null) { setPlayerIdentifier(); }
		
		$('body').append('<h2 id="trackingId">Identifier: <span style="color:yellow">' + localStorage.getItem("playerIdentifier") + "</span>");

		var regenerateLink = $('<h2/>', {
			html: '(click to regenerate)',
			id: 'regenerateLink',
			style: 'color:#43d9ff',
			click: function() {
				setPlayerIdentifier();
				$("#trackingId").html('Identifier: <span style="color: yellow">' + localStorage.getItem("playerIdentifier") + "</span>");
			}
		}).appendTo('body');

		$("body").append("<h2><a href='https://docs.google.com/forms/d/1ZF2XaZMxnn3f321c2LjIWYvXiqKzQCeby8ttOfb7_pg' target=_blank>Fill Out Survey</a></h2>");

		var offset = "0px;"
		if (gameVersion == "release") { offset = "300px"; }

		$('<h2/>', {
		    text: 'Scene Selection',
		    id: 'sceneSelectTitle',
		    style: 'margin-top:' + offset
		}).appendTo('body');

		// For each scene, make a link to start it.
		scenes.forEach(function(scene, pos) {
			var el = makeLink(_Coordinator, scene, scene, "#");
			$('body').append(el);
			$('body').append("<div id='hiddenKnobs'></div>");
			createKnobs(scene, "hiddenKnobs");
			populateKnobs(scene, _Coordinator, _State, scenes);
		});


		$('<div/>', {
		    id: 'blackout'
		    //text: ''
		}).appendTo('body');
	}
//---------Functions for the timeline UI-----------------------------
	var initTimelineScreen = function(_Coordinator, _State, scenes) {
		init(_Coordinator, _State);				//initialize our copy of the coordinator and state

		var theDiv = $('<div/>', {			//make container
		    id: 'timeline'
		}).appendTo('body');

		$('<div/>', {
		    id: 'blackout'
		    //text: ''
		}).appendTo('body');

		scenes.forEach(function(scene, pos) {			//make scene / knob containers


			$("#timeline").append("<div id='"+scene+"-panel' class='scenePanel'></div>");

			var yearStr;
			if (_Coordinator.getStorySpec(scene))

			var date = $('<div/>', {
				id: 'date_' + scene,
				class: 'date',
				html: '<span>' + _Coordinator.getStorySpec(scene).year + '</span>'
			}).appendTo("#" + scene + '-panel');

			var theDiv = $('<div/>', {
			    id: 'scene_' + scene,
			    class: 'sceneWindows',
			    html: '<p>' + _Coordinator.loadTimelineDesc(scene) + '</p>'
			}).appendTo("#" + scene + '-panel');

			$("#scene_" + scene).click(function() {
				$('.sceneKnobs:visible').slideToggle("slow", function() {});
				$('#knobs_' + scene).slideToggle("slow", function() {});

				$('.sceneWindows.active').toggleClass('active', 500);
				$(this).toggleClass('active', 500);
			});

			var targetDiv = scene + '-panel';
			createKnobs(scene, targetDiv);
			populateKnobs(scene, _Coordinator, _State, scenes);
		});

		initMetaKnobs(_Coordinator, _State);	//initiate meta knobs (after we've made scene knobs, so we can give default meta-knob values)

		activateBegins(_Coordinator, _State, scenes);

		//if we haven't sent form data yet, send it
		postTrackingStats();
		
		//if we don't have a unique tracking identifier for the player, set it	
		if (localStorage.getItem("playerIdentifier") == null) { setPlayerIdentifier(); }
	}

	var returnToTimelineScreen = function(scenes) {

		$('body').empty();			//reset all html
		$('body').css("background-image", "none");

		var theDiv = $('<div/>', {			//make container
		    id: 'timeline'
		}).appendTo('body');

		$('<div/>', {
		    id: 'blackout'
		    //text: ''
		}).appendTo('body');

		scenes.forEach(function(scene, pos) {			//make scene / knob containers


			$("#timeline").append("<div id='"+scene+"-panel' class='scenePanel'></div>");

			var date = $('<div/>', {
				id: 'date_' + scene,
				class: 'date',
				html: '<span>' + Coordinator.getStorySpec(scene).year + '</span>'
			}).appendTo("#" + scene + '-panel');

			var theDiv = $('<div/>', {
			    id: 'scene_' + scene,
			    class: 'sceneWindows',
			    html: '<p>' + Coordinator.loadTimelineDesc(scene) + '</p>'
			}).appendTo("#" + scene + '-panel');

			$("#scene_" + scene).click(function() {
				$('.sceneKnobs:visible').slideToggle("slow", function() {});
				$('#knobs_' + scene).slideToggle("slow", function() {});

				$('.sceneWindows.active').toggleClass('active', 500);
				$(this).toggleClass('active', 500);
			});

			var theKnobs = $('<div/>', {
			    id: 'knobs_' + scene,
			    class: 'sceneKnobs closed'
			}).appendTo("#" + scene + '-panel');

			populateKnobs(scene, Coordinator, State, scenes);
		});

		initMetaKnobs(Coordinator, State);	//initiate meta knobs (after we've made scene knobs, so we can give default meta-knob values)

		activateBegins(Coordinator, State, scenes);

		//if we haven't sent form data yet, send it
		postTrackingStats();
	}

	//process the wishlist for the passed in story according to its current settings in the UI
	var processWishlistSettings = function(_Coordinator, id) {

		var knobList = [];
		var widgetNum = 0;
		var story = _Coordinator.getStorySpec(id);
		var knobsWishlistStateSettingsCache = [];				//a cache we store in case we need to use it later (just used for viz right now)

		for (var x=0; x < story.wishlist.length; x++) {
			if (story.wishlist[x].condition.includes("[") && !story.wishlist[x].condition.includes("game_mode")) {
				
				State.set("dynamicWishlist", true);			//set flag that we have a dynamic wishlist (so we know to look it up later)
				
				var stateSetter = false;			//whether it's a state setter, not a wishlist setter
				story.wishlist[x].condition.replace("State:", "state:");		//correct capitalization if necessary
				if (story.wishlist[x].condition.includes("state:")) { stateSetter = true; }

				if (story.wishlist[x].condition.includes("-")) {			//it's a slider
					var value = $("#" + story.id + "-slider-" + x).slider("option", "value");
					if (stateSetter) {
						var key = story.wishlist[x].condition.replace("state:","").trim().split(" ")[1];
						State.set(key, value);
						knobsWishlistStateSettingsCache.push({"type" : "stateSetter", "key" : key, "value" : value});
					}
					else {
						story.wishlist[x].condition = story.wishlist[x].condition.replace(/\[.*?\]/g, value);
					}
					widgetNum++;
				}
				else if (story.wishlist[x].condition.includes("|")) {	//it's a dropdown
					var value = $("#" + story.id + "-select-" + x).val();
					if (stateSetter) {
						var key = story.wishlist[x].condition.replace("state:","").trim().split(" ")[1];
						State.set(key, value);
						knobsWishlistStateSettingsCache.push({"type" : "stateSetter", "key" : key, "value" : value});
					}
					else {
						story.wishlist[x].condition = story.wishlist[x].condition.replace(/\[.*?\]/g, value);
					}
					widgetNum++;
				}
				else {									//it's a switch
					var value = $("#" + story.id + "-switch" + x).val();
					if (value == "on") {		//if it's on, remove brackets
						story.wishlist[x].condition = story.wishlist[x].condition.replace(/^\[(.+)\]$/,'$1');
					}
					else {			//otherwise, remove it
						story.wishlist.splice(x,1);
					}
					widgetNum++;
				}
				delete story.wishlist[x].label;
				delete story.wishlist[x].hoverText;
				delete story.wishlist[x].changeFunc;

				if (stateSetter) { delete story.wishlist[x]; }		//if it's a state setter, just remove whole thing
				
			}
			else if (story.wishlist[x].condition.includes("game_mode")) {
				var value = $("#" + story.id + "-select-" + x).val();
				if (value !== "random") { State.set("gameModeChosen",value); }			//if they chose a non-random value, set it
				delete story.wishlist[x];					//remove it from the list, as it's not actually a wishlist item
			}
		}

		State.set("processedWishlist", story.wishlist);
		State.set("knobsWishlistStateSettingsCache", knobsWishlistStateSettingsCache);
	}

	//activate begin links in timeline
	var activateBegins = function(_Coordinator, _State, scenes) {
		$(".beginScene").click(function(evnt) { 
			evnt.stopPropagation(); 
			var sceneId = $(this).attr( "id" ).split("-")[1];
			$( "#blackout" ).fadeIn( "slow", function() {
    			startScene(_Coordinator, sceneId, true);
			});
		});
	}

	var initMetaKnobs = function(_Coordinator, _State) {
		//TODO
	}

	var createKnobs = function(sceneId, targetDivId) {
		var theKnobs = $('<div/>', {
		    id: 'knobs_' + sceneId,
		    class: 'sceneKnobs closed'
		}).appendTo("#" + targetDivId);
	}

	//activate and add in knobs for coordinator stuff
	var populateKnobs = function(sceneId, _Coordinator, _State, scenes) {
		var sceneSpec = _Coordinator.getStorySpec(sceneId);

		if (sceneSpec == null) { 
			console.log("no sceneSpec for scene to use to populate knobs!");
			return;
		}

		var sliderX = [];
		for (var x=0; x < sceneSpec.wishlist.length; x++) {
			
			if (sceneSpec.wishlist[x].condition.includes("[")) {		//if the wishlist item has [] in it...
				var knobHtml = "";
				var regExp = /\[([^)]+)\]/;
				var knobString = regExp.exec(sceneSpec.wishlist[x].condition)[1];
				
				var theLabel;			//set up label stuff if they have it
				if (sceneSpec.wishlist[x].label != null) { theLabel = sceneSpec.wishlist[x].label; }
				else { theLabel = sceneSpec.wishlist[x].condition.replace(/ *\[[^)]*\] */g, ""); }

				var hoverTextClass = "";
				var hoverText;
				if (sceneSpec.wishlist[x].hoverText != null) { 		//set up hovertext stuff if they have it
					hoverTextClass = " class='tooltip'"; 
					hoverText = "<span class='tooltiptext'>"+sceneSpec.wishlist[x].hoverText + "</span>"; 
				}

				if (knobString.includes("-")) {			//range slider (e.g. "confidence eq [0-4]")
					if (!knobString.includes(":")) { throw knobString + " needs a default value!"}
					var minValStart = knobString.indexOf("[") + 1;
					var minValEnd = knobString.indexOf("-");
					var minVal = knobString.substring(minValStart,minValEnd);		//get min value
					var maxValStart = knobString.indexOf("-") + 1;
					var maxValEnd = knobString.indexOf(":");
					var maxVal = knobString.substring(maxValStart,maxValEnd);		//get max value
					knobHtml += '<label for="'+ sceneId +'-slider-' + x.toString() +'"'+ hoverTextClass +'>'+hoverText+theLabel+'</label><div id="'+ sceneId +'-slider-' + x.toString() +'"><div id="custom-handle-'+ sceneId + '_' + x.toString() +'" class="ui-slider-handle"></div></div>';
					$("#knobs_" + sceneId).append(knobHtml);
					sliderX.push({xVal:x, min: minVal, max: maxVal, knobString: knobString});
					$( function() {
						var data = sliderX.shift();
						var knobString = data.knobString;
				    	var handle = $( "#custom-handle-"+ sceneId + "_" + data.xVal.toString() );
					    $( "#" + sceneId + "-slider-" + data.xVal.toString() ).slider({
					    	create: function() { 
					    		var sliderDefaultStart = knobString.indexOf(":")+1;
								var sliderDefaultEnd = knobString.length;
					    		$(this).slider('value', knobString.substring(sliderDefaultStart,sliderDefaultEnd));
					    		handle.text( $( this ).slider( "value" ) ); 
					    	},
					      	slide: function( event, ui ) { handle.text( ui.value );	},
					      	stop: function(event, ui) {
					      		if (sceneSpec.wishlist[data.xVal].changeFunc !== null){
					      			runChangeFunc(this, sceneSpec.wishlist[data.xVal].changeFunc);
					      		}
					      	},
					      	min: parseFloat(data.min),
					      	max: parseFloat(data.max),
					      	step: 1
					    });
					});
					

					
				}
				else if (knobString.includes("|")) {		//dropdown w/ options (e.g. "career eq [shrimp|lobster]")
					var theLabel;
					if (sceneSpec.wishlist[x].label != null) { theLabel = sceneSpec.wishlist[x].label; }
					else { theLabel = sceneSpec.wishlist[x].condition.replace(/ *\[[^)]*\] */g, ""); }

					knobHtml += "<label for='"+ sceneId +"-select-"+x+"'"+ hoverTextClass +">"+hoverText+theLabel+"</label><select id='"+ sceneId +"-select-"+x+"' class='selectKnob'>";
					var theOptions = knobString.split("|");
					for (var y=0; y < theOptions.length; y++) {
						knobHtml += '<option value="'+ theOptions[y] +'">'+ theOptions[y] +'</option>';
					}
					knobHtml += "</select>";
					$("#knobs_" + sceneId).append(knobHtml);
					$("#knobs_" + sceneId).append("<br class='clearFloat'/>");
				}
				else {			//otherwise must be an on/off switch (e.g. "[introFriends eq true]")
					var theLabel;
					if (sceneSpec.wishlist[x].label != null) { theLabel = sceneSpec.wishlist[x].label; }
					else { theLabel = sceneSpec.wishlist[x].condition; }
					knobHtml += '<div class="switch-container">';
					knobHtml += '<label class="switch" for="'+ sceneId +'-switch'+ x +'"'+hoverTextClass+'>'+hoverText+'<input type="checkbox" id="'+ sceneId +'-switch'+x+'" checked="checked"><span class="slider round"></span></label>';
					knobHtml += '<span class="switch-label">'+ theLabel +'</span>';
					knobHtml += "</div>"
					$("#knobs_" + sceneId).append(knobHtml);
					$("#knobs_" + sceneId).append("<br class='clearFloat'/>");
				}				
				
			}
		}

	}

	var runChangeFunc = function(changingElement, functionName) {
		switch (functionName) {
			case "studentBalance":
				studentBalance(changingElement);
				break;
			case "friendBackgroundBalance":
				friendBackgroundBalance(changingElement);
				break;
			case "friendSupportivenessBalance":
				friendSupportivenessBalance(changingElement);
				break;
		}
	}

	//-------------KNOB TWIDDLING FUNCTIONS-------------------------------------------

	var studentBalance = function(changer) {
		var partnerSlider;
		if (changer.id == "finalLecture-slider-11") { partnerSlider = "#finalLecture-slider-12"}
		else { partnerSlider = "#finalLecture-slider-11"; }
		var currentValue = $("#" + changer.id).slider('value');
		$(partnerSlider).slider('value', (3-currentValue));
		$(partnerSlider).find(".ui-slider-handle").text((3-currentValue));
	}

	var friendBackgroundBalance = function(changer) {
		var sliders = $('#knobs_finalDinner .ui-slider').toArray();
		var changerIndex = sliders.indexOf(changer);
		var partnerIndex = (changerIndex % 2 === 0) ? changerIndex + 1 : changerIndex - 1;
		var partnerSlider = sliders[partnerIndex];
		var currentValue = $("#" + changer.id).slider('value');
		$(partnerSlider).slider('value', (2-currentValue));
		$(partnerSlider).find(".ui-slider-handle").text((2-currentValue));
	}

	var friendSupportivenessBalance = function(changer) {
		var sliders = $('#knobs_finalDinner .ui-slider').toArray();
		var changerIndex = sliders.indexOf(changer);
		var partnerIndex = (changerIndex % 2 === 0) ? changerIndex + 1 : changerIndex - 1;
		var partnerSlider = sliders[partnerIndex];
		var currentValue = $("#" + changer.id).slider('value');
		$(partnerSlider).slider('value', (2-currentValue));
		$(partnerSlider).find(".ui-slider-handle").text((2-currentValue));
	}
//------------------------------------------------------------------------------------
	//builds the scene divs
	var initSceneScreen = function(State, bg, id) {

		$('body').html('');
		$('body').css("background-image", "url('assets/bgs/"+ bg +"')"); 

		$('<div/>', {
		    id: 'storyContainer'
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
		    id: 'gameContainer'
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
			id: 'gameControls'
		}).appendTo('#gameContainer');

		$('<div/>', {
		    id: 'statsContainer',
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
		    id: 'sceneIntro'
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
		    id: 'blackout'
		    //text: ''
		}).appendTo('body');

		if (avatarMode == "oneMain") {
			$("#statsContainer").addClass("oneMain");
			$("#storyContainer").addClass("oneMain");
		}

		initStatsUI(State);
	}

	var initStatsUI = function(State) {

		$('<div/>', {
		    id: 'storyStats'
		    //text: ''
		}).appendTo('#stats');

		$('<div/>', {
		    id: 'gameStats'
		    //text: ''
		}).appendTo('#stats');
	}

	/*
		Sets avatar on-screen based on state
	*/
	var setAvatars = function() {
		
		if (typeof State.get("characters") !== "undefined") {
			State.get("characters").forEach(function(char, pos) {
				var url = false;
				var defaultTag;
				var avatar = State.avatars.filter(function( avatar ) { return avatar.id == char.id; })[0];

				for (var x=0; x < avatar.states.length; x++) {			//check all avatar states to find true one
					var correctAvatar = false;
					if (avatar.states[x].state[0] == "default") {
						defaultTag = avatar.states[x].tag;
					}
					else {			//don't evaluate default avatars
						var allTrue = true;
						for (var y=0; y < avatar.states[x].state.length; y++) {
							if (!State.isTrue(avatar.states[x].state[y])) {
								allTrue = false;
								break;
							}
						}
						if (allTrue) {			//if it's valid...
							url = getAvatar(avatar.graphics, avatar.age, avatar.states[x].tag);		//get avatar URL
							break;
						}
					}
				}

				//fallback to default if no state valid
				if (!url) { 

					url = getAvatar(avatar.graphics, avatar.age, defaultTag); 
				}

				var picClass = "supportingChar";
				if (pos == 0) { picClass = "mainChar" }

				if (avatarMode == "oneMain") {		//if we're in the mode where there's just one portrait for the main character...

					var fragmentPortraitChar = State.get("currentAvatar");		//grab the avatar for this fragment. If there isn't one, default to main character
					if (typeof fragmentPortraitChar == "undefined") {
						fragmentPortraitChar = State.get("characters")[0].id;
					}
					if (avatar.id == fragmentPortraitChar) {
						if (document.getElementById('mainAvatar') == null){			//if div doesn't exist, create it
							$('<div/>', {
								id: "mainAvatarDiv",
								class: 'statContainer oneMain'
							}).appendTo('#statsContainer');

							$('<div/>', {			//create avatarBox and stat-holding box for character
							    id: "mainAvatar",
							    class: picClass + " oneMain"
							}).appendTo('#mainAvatarDiv');

							createStats();
						}

						$('#mainAvatar').css("background-image", "url("+url+")"); 					//set avatar
						$('#mainAvatar').html("<div class='nameLabel'>" + char.name + "</div>");	//set name label
					}

					else {
						if (document.getElementById(char.id) == null){			//if div doesn't exist, create it
							$('<div/>', {
								id: char.id,
								class: 'statContainer hidden'
							}).appendTo('#statsContainer');

							$('<div/>', {			//create avatarBox and stat-holding box for character
							    id: 'charPic_' + char.id,
							    class: picClass + " hidden"
							}).appendTo('#' + char.id);

							createStats();
						}
					}

				}

				else {				//otherwise if it's one portrait per character...(rpg style)
					if (document.getElementById(char.id) == null){			//if div doesn't exist, create it
						$('<div/>', {
							id: char.id,
							class: 'statContainer'
						}).appendTo('#statsContainer');

						$('<div/>', {			//create avatarBox and stat-holding box for character
						    id: 'charPic_' + char.id,
						    class: picClass
						}).appendTo('#' + char.id);

						createStats();
					}
					
					if (url) { 		//set avatar
						//$('#charPic').css("background-image", "url(/assets/avatar/"+ theAvatar.src +")"); 
						$('#charPic_' + char.id).css("background-image", "url("+url+")"); 
					}

					if (picClass == "supportingChar") { 
						$('#charPic_' + char.id).html("<div class='nameLabel'>" + char.name + "</div>");
					}
				}
			});
		}	
	}

	//returns asset url for an avatar of a given tag, in a given set
	var getAvatar = function(set, age, tag) {
		var avatarsObj = HanSON.parse(avatarsData);
		avatarSet = avatarsObj.filter(function( avatar ) { return avatar.character == set; })[0];
		var ageIndex = false;
		for (var x=0; x < avatarSet.ages.length; x++) { if (avatarSet.ages[x] == age) { ageIndex = x; }}
		if (!ageIndex) { ageIndex = 0; }		//if no age provided, use first value

		return "assets/avatars/" + avatarSet.character + "/" + avatarSet.character + "_" + avatarSet.ages[ageIndex] + "_" + tag +".png"; 
	}

	/*
	Called by story and game systems to change stat displayed, or add it
	containerId: which container to update...if set to "all" updates all containers
	*/

	var createStats = function() {
		var stats = State.get("storyUIvars");

		if (typeof stats !== "undefined") {

			State.get("characters").forEach(function(char, pos) {

				if (document.getElementById(char.id + "_barContainer") == null) {
					$('<div/>', {		//make progressbar divs
				    	class: 'barContainer',
				    	id: char.id + "_barContainer"
					}).appendTo("#"+char.id);
				}
			});

			var statClass = "stat";
			if (avatarMode == "oneMain") { statClass += " hidden";	}

			stats.forEach(function(stat, pos) {

				for (var x=0; x < stat.characters.length; x++) { //for each character...

					if (document.getElementById(stat.characters[x] + "_" + stat.varName) == null) {
						$('<div/>', {		//make progressbar divs
							id: stat.characters[x] + "_" + stat.varName,
					    	class: statClass,
					    	html: "<div class='stat-label'>"+ stat.label + "</div>"
						}).appendTo("#"+stat.characters[x] + "_barContainer");
					}

					setBarWidth(stat.characters[x] + "_" + stat.varName);

				}
			});
		}
	};

	var setStats = function() {
		var stats = State.get("storyUIvars");
		if (typeof stats !== "undefined") {
			stats.forEach(function(stat, pos) {
				for (var x=0; x < stat.characters.length; x++) { //for each character...
					setBarWidth(stat.characters[x] + "_" + stat.varName);
				}
			});
		}

	}

	//sets stat bar width
	var setBarWidth = function(statDivId) {
		var character = statDivId.split("_")[0];
		var statName = statDivId.split("_")[1];
		var stat = State.getBlackboard().storyUIvars.filter(function(thing,i){ 
			return thing.varName == statName;
		})[0];
		var newWidth = State.get(statName)/(stat.range[1] - stat.range[0]) * 100;

		if (avatarMode !== "oneMain" && statsContainer.firstChild !== null && typeof statsContainer.firstChild.children[1].children[2] !== "undefined") {
			var statName1 = statsContainer.firstChild.children[1].firstChild.id;
			var statName2 = statsContainer.firstChild.children[1].children[2].id;

			if (statDivId == statName1 || statDivId == statName2) {		//if it's a big stat, increase appropriately
				newWidth *= 2;
			}
		}
		$("#" + statDivId).css("width", newWidth + "%");
	}

	//sets the intro screen for each scene
	var setSceneIntro = function(sceneText, id) {
		$("#blackout").show();

		$("#sceneIntro").html("<div id='introText'>" + sceneText + "</div><div id='introGame'></div>");
		if (id.substring(0,6) == "intro:") { 
			$("#sceneIntro").html("<div id='introText' style='width:100%'>" + sceneText + "</div>");
		}

		var linkText = "";
		if (id.substring(0,6) !== "intro:") {	//if we're not using the intro as an interstitial scene, start game...
			Coordinator.startGame(id, true, true);		//start intro game
			linkText = "Begin";
		}
		else { linkText = "Continue"; }

		$("#gameContainer").css("visibility","hidden"); // hide the empty game container during intro or interstitial scene

		var begin = $('<h2/>', {
			text: linkText,
			click: function() {
				if (id.substring(0,6) == "intro:") {	//if this is interstitial, clicking the link starts the next scene
					initTitleScreen(Coordinator, State, State.get("scenes"), State.get("scenes"));		//reinitialize title screen (terrible)
					var nextIndex = Coordinator.getNextScene(State.get("currentScene"));
					var nextScene = State.get("scenes")[nextIndex];
					if (nextScene.indexOf(":") > 0) { nextScene = nextScene.split(":")[1]; }
					setTimeout(function (){
					  $("#startScene_" + nextScene).click();
					}, 500);
					
				}
				else {			//otherwise, it closes the intro window and starts the scene
					Coordinator.startGame(id);				//start real game
					$("#sceneIntro").fadeOut( "slow" );
					$("#blackout").fadeOut( "slow" );
					$("#gameContainer").css("visibility","visible"); // unhide the game container
					State.set("refreshEnabled", true);		//enable refreshNarrative for game hook up
					State.setPlaythroughData(State.get("currentTextId"), State.get("currentChoices"));	//set playthrough data
				}
			}
		}).appendTo("#sceneIntro");
		$("#sceneIntro").fadeIn( "slow" );
	}

	var setSceneOutro = function(endText) {

		var nextIndex = Coordinator.getNextScene(State.get("currentScene"));
		var nextScene = State.get("scenes")[nextIndex];
		$( "#blackout" ).delay(1600).fadeIn( "slow", function() {
	    	$("#sceneIntro").html(endText);

	    	$('<h3/>', {
	    		text : 'Stats',
	    	}).appendTo("#sceneIntro");
	    	var stats = State.get("storyUIvars");
	    	stats.forEach(function(stat, pos) {
	    		if ($.inArray("protagonist", stat.characters) !== -1) {
					$('<div/>', {
						id: stat.varName+'ContainerOutro',
				    	class: 'stat'
					}).appendTo("#sceneIntro");

					$('<span/>', {
				    	class: 'statLabel',
				    	text: "Ending " + stat.label + ": "
					}).appendTo('#'+stat.varName+'ContainerOutro');

					$('<span/>', {
				    	class: 'statValue',
				    	text: State.get(stat.varName).toFixed(1)
					}).appendTo('#'+stat.varName+'ContainerOutro');
				}
			});


	    	var begin = $('<h2/>', {
			text: 'Next',
			click: function() {

				postTrackingStats();		//post tracking stats

				if (interfaceMode == "timeline") {		//if timeline, return there
					returnToTimelineScreen(State.get("scenes"));
				}
				else {			//otherwise, start next scene
					$('body').append("<div id='hiddenKnobs'></div>");
					createKnobs(nextScene, "hiddenKnobs");
					populateKnobs(nextScene, Coordinator, State, State.get("scenes"));
					setTimeout(function (){		//gotta put in some lag for the knobs to populate
					  startScene(Coordinator, nextScene, true);
					}, 500);
					
				}
			}
			}).appendTo("#sceneIntro");

	    	$( "#sceneIntro" ).fadeIn();
	    });
	}

	var addGameDiagnostics = function(gameSpec, aspFilepath, aspGame, aspGameInstructions, initialPhaserFile) {
		if (document.getElementById("gameDiagnostics") !== null) {
		  document.getElementById("gameDiagnostics").remove();
		}
		$('<div/>', {
			id: "gameDiagnostics",
			html: '<ul><li><a href="#ReportBugDiv">Report Bug</a></li><li><a href="#ASPEditor">ASP Editor</a></li><li><a href="#JSONEditorDiv">JSON Editor</a></li></ul><div id="ReportBugDiv"></div><div id="ASPEditor"></div><div id="JSONEditorDiv"></div>'
		}).appendTo("body");

		addBugReporter(gameSpec, aspFilepath, aspGame, aspGameInstructions);
		addJSONEditor(gameSpec, initialPhaserFile);
		addASPEditor(gameSpec, aspFilepath, aspGame);

		$('<div/>', {
			id: "gameDiagnosticsButton",
			click: function() {
        updateBugReportTexts(aspFilepath, aspGame, aspGameInstructions);
  			$("#gameDiagnostics").toggle();
			}
		}).appendTo("body");

		$( "#gameDiagnostics" ).tabs();
	};
  var gameBugBaseURL = "https://github.com/LudoNarrative/ClimateChange/issues/new?labels="+encodeURIComponent("Gemini/Cygnus")+",bug";
  var storyBugBaseURL = "https://github.com/LudoNarrative/ClimateChange/issues/new?labels=StoryAssembler,bug";

  var updateGameBugHref = function() {
    $("#GameBugSubmit").attr("href", gameBugBaseURL + "&body="+encodeURIComponent($("#GameBug").text()));
  };
  var updateStoryBugHref = function() {
    $("#StoryBugSubmit").attr("href", storyBugBaseURL + "&body="+encodeURIComponent($("#StoryBug").text()));
  };
    
  var updateBugReportTexts = function(aspFilepath, aspGame, aspGameInstructions) {
    $("#GameBug").text(
      "This game (delete any that do not apply):\n- Was confusing.\n- Was difficult to play.\n- Was boring.\n- Did not function according to the instructions.\n- Was not appropriate for this scene.\n\n"+
        "Other comments/elaborations:\n\n\n"+
        "Game: "+aspFilepath+"\n" +
        "```\n"+
        aspGame + "\n" + "==========\n" + aspGameInstructions +
        "\n```"
    );
    
    // TODO: also show vars and other interesting things, and grab this in a nice way instead of this rude way 
    $("#StoryBug").text("Issue:\n\nCurrent story chunks:\n```\n"+$( "#storyContainer" ).text()+"\n```");

    updateGameBugHref();
    updateStoryBugHref();
  };

	  var addBugReporter = function(gameSpec, aspFilepath, aspGame, aspGameInstructions) {

        var left = $("<div/>", {style:"width: 40%; display:inline-block;"}).appendTo("#ReportBugDiv");
        var submitLeft = $("<a/>", {
            id: 'GameBugSubmit',
            text: 'Submit game bug',
            href: gameBugBaseURL,
            target: "_blank",
            style: "display:block; width:200px;"
        }).appendTo(left);
		    $('<textarea/>', {
			      id: 'GameBug',
			      rows: "4",
			      cols: "40",
            style: "margin-right: 20px",
            text: "",
            change: updateGameBugHref
		    }).attr('spellcheck',false)
		        .appendTo(left);

        var right = $("<div/>", {style:"width:40%; display:inline-block;"}).appendTo("#ReportBugDiv");
        var submitRight = $("<a/>", {
            id: 'StoryBugSubmit',
            text: 'Submit story bug',
            href: storyBugBaseURL,
            target: "_blank",
            style: "display:block; width:200px;"
        }).appendTo(right);
        $('<textarea/>', {			//add editing field
			      id: 'StoryBug',
			      rows: "4",
			      cols: "40",
			      text: "",
            change: updateStoryBugHref
		    }).attr('spellcheck',false)
		        .appendTo(right);
	  };

	//adds a JSON editor to the game diagnostics panel
	var addJSONEditor = function(gameSpec, initialPhaserFile) {

        var ruleSchemas = [
        	{
        		"properties": {
				    "l": {
				      "type": "array",
				      "format": "table",
				      "title": "Left",
				      "items": {
				        "type": "string"
				      }
				    },
				    "r": {
				      "type": "array",
				      "format": "table",
				      "title": "Right",
				      "items": {
				        "type": "string"
				      }
				    },
				    "relation": {
				      "type": "string",
				      "title": "Relation",
				      "enum": [
				        "is_a",
				      ],
				    }
				}
			}
		];

		var schema = {					// The schema for the editor
          type: "array",
          title: "Phaser Rules",
          items: {
            title: "Rule",
            headerTemplate: "Rule {{i}}",
            oneOf: ruleSchemas
          }
        };

		var options = {
    		//schema: schema,
    		mode: 'text',
    		modes: ['tree', 'text'],
    		theme: 'html'
  		};

  		var container = document.getElementById('JSONEditorDiv');
  		var editor = new JSONEditor(container, options);		//create editor (make it global so other buttons can pass it [hacky])

  		$('<div/>', {
			id: "JSONDumpDiv",
		})
		.appendTo("#JSONEditorDiv");
		$('<textarea/>', {			//add JSON dump field
			id: 'JSONDump',
			rows: "4",
			cols: "75",
			text: ""
		}).attr('spellcheck',false)
		.appendTo("#JSONDumpDiv");

		$('<div/>', {
			id: "closeDump",
			class: "diagButton",
			text: "Close",
			click: function() { $("#JSONDumpDiv").toggle(); }
		})
		.appendTo("#JSONDumpDiv");


  		$('<div/>', {
			id: "evaluateJSONButton",
			class: "diagButton",
			text: "Run new JSON",
			click: function() {
				Game.runGenerator(gameSpec, $("#ASPinput")[0].value.split("==========")[0], $("#ASPinput")[0].value.split("==========")[1], editor.get(), false);
			}
		})
		.appendTo("#JSONEditorDiv");

		$('<div/>', {
			id: "dumpJSONButton",
			class: "diagButton",
			text: "Dump JSON",
			click: function() {
				$("#JSONDump")[0].value = JSON.stringify(editor.get(), null, 2);
    			$("#JSONDumpDiv").toggle();
			}
		})
		.appendTo("#JSONEditorDiv");

		editor.set(initialPhaserFile);

	}

	//adds an ASP editor to the game diagnostics panel
	var addASPEditor = function(gameSpec, aspFilepath, aspGame) {

		$('<p/>', {					//add header
			text: "ASP code from: " + aspFilepath
		}).appendTo("#ASPEditor");

		$('<textarea/>', {			//add editing field
			id: 'ASPinput',
			rows: "4",
			cols: "75",
			text: aspGame
		}).attr('spellcheck',false)
		.appendTo("#ASPEditor");

		$('<div/>', {				//add evaluate ASP button
			id: "evaluateASPButton",
			class: "diagButton",
			text: "Run ASP",
			click: function() {
				Game.runGenerator(gameSpec, $("#ASPinput")[0].value.split("==========")[0], $("#ASPinput")[0].value.split("==========")[1], editor.get(), false);
			}
		})
		.appendTo("#ASPEditor");
	}

	//posts tracking stats if we have any unsent ones
	var postTrackingStats = function() {
		if (Coordinator.recordPlaythroughs && localStorage.getItem('playthroughScene') !== null) {
			postToGoogleForm();
			localStorage.removeItem("playthroughScene");
			localStorage.removeItem("playthroughData");
		}
	}

	var postToGoogleForm = function() {

		if (State.get("displayType") !== "editor") {
			postToForm(getData());
			postToForm(getData("times"));
		}

		function postToForm(data) {
			var url = 'https://script.google.com/macros/s/AKfycbxXDhwmHQZMTTYrU6JzqQnC3t57cHLNOAlmTIQsLtde0LHwezo/exec';
		    var xhr = new XMLHttpRequest();
		    xhr.open('POST', url);
		    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		    // url encode form data for sending as post data
		    var encoded = Object.keys(data).map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }).join('&');
		    xhr.send(encoded);	
		}
	}

	var setPlayerIdentifier = function() {

		var emotions = ['understanding','great','playful','calm','confident','courageous','peaceful','reliable','joyous','energetic','lucky','liberated','comfortable','amazed','fortunate','optimistic','pleased','free','delighted','provocative','encouraged','sympathetic','overjoyed','impulsive'];
		var colors = ['amber','amethyst','apricot','aqua','aquamarine','auburn','azure','beige','black','blue','bronze','brown','cardinal','carmine','celadon','cerise','cerulean','charcoal','chartreuse','chocolate','cinnamon','scarlet','copper','coral','cream','crimson','cyan','denim','ebony','ecru','eggplant','emerald','fuchsia','gold','goldenrod','gray','green','indigo','ivory','jade','jet','khaki','lavender','lemon','light','lilac','lime','magenta','mahogany','maroon','mauve','mustard','ocher','olive','orange','orchid','pale','pastel','peach','periwinkle'];
		var animals = ['alligator','ant','bear','bee','bird','bull','camel','cat','cheetah','chicken','chimpanzee','cow','crocodile','deer','dog','dolphin','duck','eagle','elephant','fish','fly','fox','frog','giraffe','goat','goldfish','gorilla','hamster','hippopotamus','horse','kangaroo','kitten','lion','lobster','monkey','octopus','owl','panda','pig','puppy','rabbit','rat','scorpion','seal','shark','sheep','snail','snake','spider','squirrel','swan','tiger','turtle','wolf','wren','zebra','pale','pastel','peach','periwinkle'];
		var letters = ['A','B','C','D','E','F','G','H','I','J','H'];
		var identifier = "";
		var d = new Date();
		identifier = emotions[d.getHours()] + " " + colors[d.getMinutes()] + " " + animals[d.getSeconds()] + " " + letters[Math.trunc(d.getMilliseconds()/100)] + (d.getMilliseconds()%100).toString();

		localStorage.setItem("playerIdentifier", identifier);
	}

	// get all data in form and return object
	//mode: if it's "times", it only puts times for choices
	var getData = function(mode) {

		var data = {};
		data.scene = localStorage.getItem("playthroughScene");
		data.identifier = localStorage.getItem("playerIdentifier");

		var temp = JSON.parse(localStorage.getItem('playthroughData'));

		//set total time
		totalTime = (temp[temp.length-1].time - temp[0].time)/1000;

		//set times for each node
		for (x = 0; x < temp.length-1; x++) {
			temp[x].time = (temp[x+1].time - temp[x].time)/1000;
		}

		var labels = '["identifier","scene","total time"';
		for (var x=1; x < 51; x++) { 
			if (x <= temp.length) {
				labels += ',"choice_' + x + '"';		//add label field
				if (mode == "times" && data["choice_" + x] !== null) { 		//add time data if mode correct
					data["choice_" + x] = temp[x-1].time; 
				}		
				else if (data["choice_" + x] !== null) { 			//otherwise add all choice data
					data["choice_" + x] = JSON.stringify(temp[x-1]); 
				}
			}
			else { labels += ',""'; }
		}
		labels += "]";

		// add form-specific values into the data
		//data.formDataNameOrder = '["scene","data"]';
		data.formDataNameOrder = labels;
		data.totalTime = totalTime;
		data.formGoogleSheetName = "responses"; // default sheet name
		if (mode == "times") { data.formGoogleSheetName = "justTimes"; }
		data.formGoogleSendEmail = ""; // no email by default

		return data;
	}

	return {
		init : init,
		initTitleScreen : initTitleScreen,
		initTimelineScreen : initTimelineScreen,
		initSceneScreen : initSceneScreen,
		setAvatars : setAvatars,
		createStats : createStats,
		createKnobs : createKnobs,
		populateKnobs : populateKnobs,
		setStats : setStats,
		setSceneIntro : setSceneIntro,
		setSceneOutro : setSceneOutro,
		startScene : startScene,
		addGameDiagnostics : addGameDiagnostics,
		processWishlistSettings : processWishlistSettings,
		interfaceMode : interfaceMode,
		avatarMode : avatarMode
	} 
});