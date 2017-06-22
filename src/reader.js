

var result = {};

var parsers = {
  NamedLayer: function(obj) {
    // let layername = obj.getElementsByTagName('sld:Name').item(0).innerHTML;
  }
};

function readNode(node) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n);
    }
  }
}


export function reader(sld) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(sld, 'application/xml');

  for (let n = doc.firstChild; n; n = n.nextSibling) {
    result.version = n.getAttribute('version');
    readNode(n);
  }
  return result;
}
