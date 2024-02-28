/* global ol SLDReader */
const BOX_WIDTH = 92; // px
const BOX_HEIGHT = 92; // px

let styleFunction = null; // Style that maps a feature with a wellknownname property to a mark symbolizer.

// prettier-ignore
const wellknownnames = [
  'circle', 'triangle', 'star', 'cross', 'hexagon', 'octagon',
  'cross2', 'x', 'diamond', 'horline', 'line', 'backslash', 'slash',
];

function createFeatureTypeStyle() {
  const featureTypeStyle = {
    rules: wellknownnames.map(wellknownname => ({
      filter: {
        type: 'comparison',
        operator: 'propertyisequalto',
        matchcase: true,
        expression1: {
          type: 'propertyname',
          typeHint: 'string',
          value: 'wellknownname',
        },
        expression2: wellknownname,
      },
      pointsymbolizer: [
        {
          graphic: {
            mark: {
              wellknownname,
              fill: {
                styling: {
                  fill: '#F5F5F5',
                },
              },
              stroke: {
                styling: {
                  stroke: '#7253ed',
                  strokeWidth: 2.0,
                },
              },
            },
            size: 40,
          },
        },
      ],
    })),
  };

  // Add else filter to display unknown wellknownname as a boring gray square.
  featureTypeStyle.rules.push({
    elsefilter: true,
    pointsymbolizer: [
      {
        graphic: {
          mark: {
            wellknownname: 'square',
            fill: {
              styling: {
                fill: '#cccccc',
              },
            },
            stroke: {
              styling: {
                stroke: '#000000',
                strokeWidth: 1.0,
              },
            },
          },
          size: 20,
        },
      },
    ],
  });

  return featureTypeStyle;
}

function getOlMarkStyle(wellknownname) {
  if (typeof styleFunction !== 'function') {
    styleFunction = SLDReader.createOlStyleFunction(createFeatureTypeStyle());
  }
  const olFeature = new ol.Feature({
    wellknownname,
    geometry: new ol.geom.Point([0, 0]),
  });
  const style = styleFunction(olFeature)[0];
  return style;
}

function prepareGallery() {
  const galleryContainer = document.querySelector('#mark-gallery');
  wellknownnames.forEach(wellknownname => {
    const markCard = document.createElement('div');
    markCard.classList.add('mark-card');
    galleryContainer.appendChild(markCard);

    const markBox = document.createElement('div');
    markBox.classList.add('mark-box');
    markCard.appendChild(markBox);

    // Draw point symbol using point style corresponding to the symbol wellknownname.
    const canvasWidth = BOX_WIDTH * ol.has.DEVICE_PIXEL_RATIO;
    const canvasHeight = BOX_HEIGHT * ol.has.DEVICE_PIXEL_RATIO;
    const symbolCanvas = document.createElement('canvas');
    symbolCanvas.width = canvasWidth;
    symbolCanvas.height = canvasHeight;
    markBox.appendChild(symbolCanvas);

    const context = symbolCanvas.getContext('2d');
    const olContext = ol.render.toContext(context, {
      size: [BOX_WIDTH, BOX_HEIGHT],
    });
    const symbolStyle = getOlMarkStyle(wellknownname);
    olContext.setStyle(symbolStyle);
    const centerX = BOX_WIDTH / 2;
    const centerY = BOX_HEIGHT / 2;
    olContext.drawGeometry(new ol.geom.Point([centerX, centerY]));

    const markTitle = document.createElement('div');
    markTitle.classList.add('mark-title');
    markTitle.textContent = wellknownname;
    markCard.appendChild(markTitle);
  });
}

function init() {
  prepareGallery();
}

document.addEventListener('DOMContentLoaded', init);
