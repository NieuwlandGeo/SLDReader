import sax from 'sax';

var parser = sax.parser(true);

var result = {};

export function reader(sld) {
  parser.write(sld);
  return result;
}
