import {parseString} from 'xml2js';

export function reader(sld) {

  return parseString(sld);
}
