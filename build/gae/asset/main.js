var Parser = require('../../../source').DataViewParser;

var dropzone = document.getElementById('dropzone');
var fontlist = document.getElementById('fontlist');

dropzone.addEventListener('dragenter', dragEnterHandler, false);
dropzone.addEventListener('dragover', dragOverHandler, false);
dropzone.addEventListener('drop', dropHandler, false);

function dragEnterHandler(event) {
    if (event.dataTransfer.types.indexOf('Files') === 0) {
        event.preventDefault();
    }
}

function dragOverHandler(event) {
    if (event.dataTransfer.types.indexOf('Files') === 0) {
        event.dataTransfer.dropEffect = 'move';
        event.preventDefault();
    }
}

function dropHandler(event) {
    if (event.dataTransfer.types.indexOf('Files') === 0) {
        event.preventDefault();

        var files = event.dataTransfer.files, i, l;
        for (i = 0, l = files.length; i < l; i++) {
            var file = files.item(i);
            var reader = new FileReader();

            reader.addEventListener('load', function (event) {
                var parser = new Parser();
/*
                parser.on('Layer', function (layer) {
                    // console.debug(layer.attributes.layer_name);
                });

 */

                var fonts = {};
                fontlist.innerHTML = '';

                parser.on('TypeToolObjectSetting', function (section) {
                    section.attributes.text.items.EngineData.data.ResourceDict.FontSet.forEach(function (font) {
                        if (!fonts.hasOwnProperty(font.Name)) {

                            if (font.Name === 'AdobeInvisFont') {
                                return;
                            }

                            var li = document.createElement('LI');
                            //li.innerHTML = font.Name +' '+ JSON.stringify(font) +' ';
                            li.innerHTML = font.Name;
                            // li.style.display = 'none';


                            var re = /^(([A-Z][a-z]+)(([A-Z][a-z]+)*))(\-(([A-Z][a-z]+)(([A-Z][a-z]+)*)))?$/;

                            var matches = re.exec(font.Name);
                            var family = matches[1];
                            var google_family = family.replace(/([a-z])([A-Z])/g, '$1+$2');


                            var query = google_family;

                            if (matches[7]) {
                                query += ':'+matches[7];
                            }

                            (function () {
                                var google_api_url = 'http://www.google.com/fonts/specimen/'+google_family+'';
                                var google_use_url = 'http://www.google.com/fonts/specimen/'+google_family+'';
                                var yql = 'use "http://yqlblog.net/samples/data.html.cssselect.xml" as data.html.cssselect; select * from data.html.cssselect where url="'+google_api_url+'" and css=".styles .fontitem .identifier"';
                                $.ajax({
                                    url: 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(yql) + '&format=json&callback=?',
                                    dataType: 'jsonp',
                                    crossDomain: 'true',
                                    success: function(data) {
                                        if (data.query.results && data.query.results.results) {
//                                            li.style.display = 'block';
                                            li.innerHTML += ' <a target="_blank" href="'+google_api_url+'">Google Fonts</a>';
                                        }
                                    }
                                });
                            })();

                            (function () {
                                var squirrel_family = family.replace(/([a-z])([A-Z])/g, '$1-$2');

                                var squirrel_api_url = 'http://www.fontsquirrel.com/api/familyinfo/'+squirrel_family;
                                var squirrel_use_url = 'http://www.fontsquirrel.com/fonts/'+squirrel_family;

                                var yql = 'select * from json where url="'+squirrel_api_url+'" or url="http://www.fontsquirrel.com/api/familyinfo/'+family+'"';

                                $.ajax({
                                    url: 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(yql) + '&format=json&callback=?',
                                    dataType: 'jsonp',
                                    crossDomain: 'true',
                                    success: function(data) {
                                        if (data.query.results && data.query.results.json) {
                                            console.debug(data.query.results.json);
//                                            li.style.display = 'block';
                                            li.innerHTML += ' <a target="_blank" href="'+squirrel_use_url+'">Font Squirrel</a>';
                                        }
                                    }
                                });
                            })();

                            (function () {
                                var typekit_family = family.replace(/([a-z])([A-Z])/g, '$1-$2');

                                var typekit_family_url = 'https://typekit.com/fonts/'+typekit_family;

                                var yql = 'use "http://yqlblog.net/samples/data.html.cssselect.xml" as data.html.cssselect; select * from data.html.cssselect where url="'+typekit_family_url+'" and css=".font-variations dt"';

                                $.ajax({
                                    url: 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(yql) + '&format=json&callback=?',
                                    dataType: 'jsonp',
                                    crossDomain: 'true',
                                    success: function(data) {
                                        if (data.query.results && data.query.results.results) {
//                                            li.style.display = 'block';
                                            li.innerHTML += ' <a target="_blank" href="'+typekit_family_url+'">typekit</a>';
                                        }
                                    }
                                });
                            })();

                            fontlist.appendChild(li);

                        }
                        fonts[font.Name] = font.Name;
                    });
                });

                parser.parse(new DataView(reader.result), function () {
                    console.debug('done !');
                });

            }, false);

            reader.readAsArrayBuffer(file);
        }
    }
}
