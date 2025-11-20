/* global ol SLDReader */
const BOX_SIZE = 84; // px

let styleFunction = null; // Style that maps a feature with a wellknownname property to a mark symbolizer.

// Register custom 'crystal' symbol.
SLDReader.registerCustomSymbol('crystal', [
  [0.5, 0],
  [0.75, 0.75],
  [0, 0.5],
  [-1, 1],
  [-0.5, 0],
  [-0.75, -0.75],
  [0, -0.5],
  [1, -1],
]);

const wellknownNames = [
  {
    category: 'sld',
    names: ['square', 'circle', 'triangle', 'star', 'cross', 'x'],
  },
  {
    category: 'geoserver',
    names: [
      'shape://vertline',
      'shape://horline',
      'shape://slash',
      'shape://backslash',
      'shape://dot',
      'shape://plus',
      'shape://times',
      'shape://oarrow',
      'shape://carrow',
    ],
  },
  {
    category: 'qgis',
    names: [
      'equilateral_triangle',
      'diamond',
      'regular_star',
      'pentagon',
      'hexagon',
      'octagon',
      'decagon',
      'cross2',
      'line',
      'arrow',
      'cross_fill',
      'arrowhead',
      'filled_arrowhead',
      'semi_circle',
      'third_circle',
      'quarter_circle',
      'half_arc',
      'third_arc',
      'quarter_arc',
      'quarter_square',
      'half_square',
      'diagonal_half_square',
      'right_half_triangle',
      'left_half_triangle',
      'trapezoid',
      'parallelogram_right',
      'parallelogram_left',
      'square_with_corners',
      'shield',
      'star_diamond',
      'asterisk_fill',
    ],
  },
  {
    category: 'other',
    names: ['horline', 'backslash', 'slash', 'crystal'],
  },
];

function createFeatureTypeStyle() {
  let allWellknownNames = [];
  wellknownNames.forEach(batch => {
    allWellknownNames = allWellknownNames.concat(batch.names);
  });
  const featureTypeStyle = {
    rules: allWellknownNames.map(wellknownname => ({
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
            size: BOX_SIZE / 2,
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
          size: BOX_SIZE / 2,
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

function prepareGallery(batch, options) {
  const defaultOptions = {
    showOutlines: false,
  };

  const galleryOptions = Object.assign(defaultOptions, options);

  const galleryContainer = document.querySelector(
    `#mark-gallery-${batch.category}`
  );
  if (!galleryContainer) {
    console.warn('NO GALLERY CONTAINER: ', `#mark-gallery-${batch.category}`);
    return;
  }

  galleryContainer.innerHTML = '';
  batch.names.forEach(wellknownname => {
    const markCard = document.createElement('div');
    markCard.classList.add('mark-card');
    galleryContainer.appendChild(markCard);

    const markBox = document.createElement('div');
    markBox.classList.add('mark-box');
    markCard.appendChild(markBox);

    // Draw point symbol using point style corresponding to the symbol wellknownname.
    const canvasWidth = BOX_SIZE * ol.has.DEVICE_PIXEL_RATIO;
    const canvasHeight = BOX_SIZE * ol.has.DEVICE_PIXEL_RATIO;
    const symbolCanvas = document.createElement('canvas');
    symbolCanvas.width = canvasWidth;
    symbolCanvas.height = canvasHeight;
    markBox.appendChild(symbolCanvas);

    const context = symbolCanvas.getContext('2d');
    const olContext = ol.render.toContext(context, {
      size: [BOX_SIZE, BOX_SIZE],
    });
    const centerX = BOX_SIZE / 2;
    const centerY = BOX_SIZE / 2;

    if (galleryOptions.showOutlines) {
      const outlineStyle = new ol.style.Style({
        image: new ol.style.RegularShape({
          angle: Math.PI / 4,
          points: 4,
          radius: (BOX_SIZE / 4) * Math.sqrt(2.0),
          stroke: new ol.style.Stroke({
            color: '#444444',
            width: 1,
            lineDash: [3, 3],
          }),
          rotation: 0,
        }),
      });
      olContext.setStyle(outlineStyle);
      olContext.drawGeometry(new ol.geom.Point([centerX, centerY]));
    }

    const symbolStyle = getOlMarkStyle(wellknownname);
    olContext.setStyle(symbolStyle);

    olContext.drawGeometry(new ol.geom.Point([centerX, centerY]));

    const markTitle = document.createElement('div');
    markTitle.classList.add('mark-title');

    // Perform shenanigans to make long underscored symbol names fit.
    const index = wellknownname.lastIndexOf('_') > -1;
    if (wellknownname.length > 10 && index > -1) {
      const formattedName = wellknownname.replace(/(_)[^_]+$/, stuff => {
        return stuff.replace('_', '_<br>');
      });
      markTitle.style.fontSize = '12px';
      if (wellknownname === 'diagonal_half_square') {
        markTitle.style.fontSize = '11px';
      }
      markTitle.innerHTML = formattedName;
    } else {
      markTitle.textContent = wellknownname;
    }
    markCard.appendChild(markTitle);
  });
}

function prepareGalleries(options) {
  wellknownNames.forEach(batch => {
    prepareGallery(batch, options);
  });
}

function init() {
  prepareGalleries();

  document
    .getElementById('chk-show-outline')
    .addEventListener('change', evt => {
      prepareGalleries({ showOutlines: evt.target.checked });
    });
  window.meep = prepareGallery;
}

document.addEventListener('DOMContentLoaded', init);
