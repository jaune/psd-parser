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
                            var li = document.createElement('LI');
                            li.innerText = font.Name + JSON.stringify(font);
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