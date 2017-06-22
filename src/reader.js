

var result = {};

var parsers = {
  NamedLayer: (element) => {
    let layername = getText(element, 'sld:Name');
    result[layername] = {};
  }
};

function readNode(node) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n);
    }
  }
}

function getText(element, tagName) {
  return element.getElementsByTagName(tagName).item(0).textContent;
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
