
//Test Vars


//If album/artist is searched Add this object to DOM

/**
* Handle the response for a specific category.
* TODO: implement the artist
*
* @intitial Object that contain the Album/Artist response from the Last.fm API
*/

// var Songlist = function(data){
// 	this.songName = data.toptracks.track[0].name;
// 	this.artistName = data.toptracks.track[0].artist.name;
// 	this.image = data.toptracks.track[0].image[1]["#text"];

// 	this.songTable = $("<table>");
// 	this.songTableLabels = $("<tr>").append($("<td>").html("Icon"))
// 									.append($("<td>").html("Artist"))
// 									.append($("<td>").html("Song Name"));

// 	console.log(this.songName + " " + this.artistName + " " + this.image);
// }



// $(document).ready(function(){
// 	$.ajax({
// 		url: artistURL, 
// 		method: 'GET'
// 	}).done(function(data){
// 		Songlist(data);
// 	});
// });

$(document).ready(function(){

    (function ($) {
        

        /**
         * Callback function that render the calculate elements on ret.
         */
        var globalResponse,

        /**
         * Array that contains the autocomplete suggestions.
         */
            ret = [],

        /**
         * Array with set of modules to work on the user input.
         *
         * Possible elements are: 'artist', 'album' adn 'track'.
         */
            moduleList = ["track", "artist", "album"],

        /**
         * Auxiliar moduleList struct that keeps track of what modules have been
         * added to ret var already.
         */
            moduleListAux = [],

        /**
         * Current module being processed.
         */
            currentModule,

        /**
         * Last.fm API key.
         */
            apiKey,

        /**
         * For each JSON returned by the rest API, interpret it and assemble
         * the result hint object.
         */
            processRow = function (row) {
                var image = '/album.png',
                    obj;

                if (
                    undefined !== row.image && row.image instanceof Array &&
                        row.image.length > 0
                ) {
                    image = row.image[undefined !== row.image[1] ? 1 : 0]['#text'];
                }

                if ('artist' === currentModule) {
                    row.artist = row.name;
                }

                obj = {
                    data: row.artist + ' - ' + row.name,
                    value: 'artist' === currentModule ? row.name : row.artist + ' - ' + row.name,
                    category: currentModule,
                    artist: row.artist,
                    musicTitle: row.name,
                    lastfm: row
                };

                obj.label = '<div class="cover"><img src="' + image +
                    '"/></div> <div class="description"><span>' + obj.value +
                    '</span></div>';


                return obj;
            };

        /**
         * Handle the response for a specific category.
         * TODO: implement the artist
         *
         * @data Object that contain the response from the Last.fm API
         */
        function callbackAutocomplete(data) {
            var aux = null,
                acData;

            if (null !== data && undefined !== data.results) {
                if (undefined !== data.results.albummatches) {
                    acData = data.results.albummatches.album;
                    currentModule = 'album';
                } else if (undefined !== data.results.trackmatches) {
                    acData = data.results.trackmatches.track;
                    currentModule = 'track';
                } else if (undefined !== data.results.artistmatches) {
                    acData = data.results.artistmatches.artist;
                    currentModule = 'artist';
                }

                aux = $.map(acData, processRow, 'json');

                if (null !== aux) {
                    ret = ret.concat(aux);
                    moduleListAux.push(currentModule);
                }
            }

            // Only call globalResponse when all the modules have checked-in.
            if (moduleListAux.length === moduleList.length) {
                moduleListAux = [];
                globalResponse(ret);
                ret = [];
            }
        }

        /**
         * Communicate error to the user.
         */
        function acError() {
            $.bootstrapMessageAuto(
                $.i18n._('Error loading suggestions. Please, try reloading your browser.'),
                'error'
            );
        }

        /**
         * Make a set of requests to Last.fm API.
         */
        function makeRequestSet(request, response) {
            var baseUrl = 'https://ws.audioscrobbler.com/2.0/',
                key,
                optionSet;

            console.log(baseUrl);
            
            for (key in moduleList) {
                if (['artist', 'album', 'track'].indexOf(moduleList[key]) >= 0) {
                    globalResponse = response;
                    optionSet = {
                        method: moduleList[key] + ".search",
                        api_key: apiKey,
                        limit: 5,
                        format: 'json'
                    };
                    optionSet[moduleList[key]] = request.term;
                    $.get(baseUrl, optionSet, callbackAutocomplete, 'json').error(acError);
                }
            }
        }

        // TODO: remove this function from this file.
        function openAutocomplete() {
            $('.ui-autocomplete').addClass(0 === $('#userId').length ? 'ui-autocomplete-logout' : 'ui-autocomplete-login');
        }

        $.widget("custom.catcomplete", $.ui.autocomplete, {
            _renderMenu: function (ul, items) {
                if(items.length > 15){
                    var tempItems = [];

                    for(var i = items.length - 15; i < items.length; i++){
                        tempItems.push(items[i]);
                    }
                    items = tempItems;
                }

                var that = this,
                    currentCategory = "";
                $.each(items, function (index, item) {
                    if (item.category !== currentCategory) {
                        var t = item.category.charAt(0).toUpperCase() + item.category.slice(1) + 's';
                        ul.append("<li class='ui-autocomplete-category " + item.category + "'>" + t + "</li>");
                        currentCategory = item.category;
                    }
                    that._renderItemData(ul, item);
                });
            }
        });

        // autocomplete the search input from last.fm.
        $.ui.autocomplete.prototype._renderItem = function (ul, row) {
            var a = $('<li></li>')
                .data('item.autocomplete', row)
                .append('<a>' + row.label + '</a>')
                .appendTo(ul)
                .addClass(row.category);
            return a;
        };




        /**
         * Provide Last.fm autocomplete feature to the target input.
         */
        $.fn.lfmComplete = function (options) {
            var acOption = {
                messages: {
                    noResults: ''
                },
                open: openAutocomplete,
                source: makeRequestSet
            };

            // Evaluate options.callback
            if (null !== options && undefined !== options.callback && 'function' === typeof options.callback) {
                acOption.select = acOption.change = options.callback;
            }

            // Evaluate options.modules
            if (
                null !== options && undefined !== options.modules &&
                    'object' === typeof options.modules &&
                    options.modules instanceof Array
            ) {
                moduleList = options.modules;
            } else {
                moduleList = [];
            }

            // Evaluate options.apiKey
            if (null !== options && undefined !== options.apiKey && 'string' === typeof options.apiKey) {
                apiKey = options.apiKey;
            }

            this.catcomplete(acOption);
        };
    }(jQuery));


    (function ($) {
        // 'use strict';

        function handleAutocompleteChoice(e, ui) {
            var d = ui.item;

            if (null !== d) {
                $('#value').html(d.value);
                sessionStorage.setItem('tempArtist', d.artist); //sessionStorage.getItem('tempArtist')
                sessionStorage.setItem('searchType', d.category); //sessionStorage.getItem('searchType')
                sessionStorage.setItem('tempMusicName', d.musicTitle); //sessionStorage.getItem('tempMusicName')

                $('#label').html('<pre>' + d.label + '</pre>');
                $('#data').html(d.data);
                $('#lastfm').html(JSON.stringify(d.lastfm));

                console.log("<<<<<<<<<<<<<<    " + d.category + "     >>>>>>>>>>>>>>>>>");
            }
        }

        function bindLfmAutocomplete() {
            // Autocomplete options.
            var acOptions = {
                callback: handleAutocompleteChoice,
                modules: [],
                apiKey: '932e4c349b7caae7626ea15a10649e1f'
            };

            // See what modules, among ['artist', 'album', 'track'], are checked.
            var modules = ['track' , 'artist', 'album'];
            // $('.music-type').each(function(key, value) {
            //     if ($(this).is(':checked')) {
            //         modules.push($(this).attr('id'));
            //     }

            //     //Additional check
            //     if(modules.length >= 3){
            //         modules = ['artist', 'album', 'track'];
            //     }
            // });
            acOptions.modules = modules;

            // if lfmAutocomplete is already placed, remove it.
            if ($('#search').data('custom-lfmAutocomplete')) {
                $('#search').lfmAutocomplete("destroy");
                $('#search').removeData('custom-lfmAutocomplete');
            }

            // bind autocomplete.
            // $('#search').off();
            $('#search').lfmComplete(acOptions);
        }

        $(document).ready(function() {
            $('.music-type').on('change', function(e) {
                // rebind lfmAutocomplete when checkbox items changes.
                bindLfmAutocomplete();
            });

            // First time it binds lfmAutocomplete.
            bindLfmAutocomplete();
        });
    }(jQuery));

});

