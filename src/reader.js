import sax from 'sax';

var parser = sax.parser(true, {
  normalize: true
});


export function reader(sld) {
  var result = [];
  var currentlayer = {};
  var currentTag = null;
  parser.onopentag = (tag) => {
    tag.parent = currentTag;
    currentTag = tag;
  };
  parser.ontext = (text) => {
    if (currentTag && currentTag.parent && currentTag.parent.name == 'sld:NamedLayer' && currentTag.name == 'sld:Name') {
      currentlayer.name = text;
    }
  };
  parser.onclosetag = (name) => {
    if (name === 'sld:NamedLayer') {
      result.push(currentlayer);
      currentlayer = {};
    }
    currentTag = currentTag.parent;
  };

  parser.write(sld).close();
  return result;
}
