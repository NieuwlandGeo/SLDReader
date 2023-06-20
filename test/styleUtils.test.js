/* global describe it expect */

import {
  calculateGraphicSpacing,
  getOLColorString,
} from '../src/styles/styleUtils';

describe('Style utils', () => {
  describe('Calculate graphic spacing', () => {
    it('Graphic spacing without gaps', () => {
      const symbolizer = {
        stroke: {
          graphicstroke: {
            graphic: {
              mark: {
                wellknownname: 'circle',
              },
              size: '10',
            },
          },
        },
      };
      expect(calculateGraphicSpacing(symbolizer, 10)).to.equal(10);
    });

    it('Calculate from gap and graphic size', () => {
      const symbolizer = {
        stroke: {
          graphicstroke: {
            graphic: {
              mark: {
                wellknownname: 'circle',
              },
              size: '10',
            },
            gap: 5,
          },
        },
      };
      expect(calculateGraphicSpacing(symbolizer, 10)).to.equal(15);
    });

    it('Calculate from dasharray when gap is not given', () => {
      const symbolizer = {
        stroke: {
          graphicstroke: {
            graphic: {
              mark: {
                wellknownname: 'circle',
              },
              size: '10',
            },
          },
          styling: {
            strokeDasharray: '1 2',
          },
        },
      };
      expect(calculateGraphicSpacing(symbolizer, 10)).to.equal(30);
    });

    it('Handle zero opacity color', () => {
      expect(getOLColorString('#646464', 0)).to.equal('rgba(100, 100, 100, 0)');
    });
  });
});
