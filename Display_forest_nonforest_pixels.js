////Import fused image from asset
var land8 = ee.Image("users/pberiain5/2024_wet_masked_CLASSIFIED_updated")
print(land8, 'image')
// Merge classes 3, 4, and 5 and call them 'non forest'
var mergedClasses = land8.remap([1, 2, 3, 4, 5], [1, 6, 6, 6, 6], 0); // Assigns class 6 to merged classes
print(mergedClasses, 'forest- non forest')
///Forest_non forest image
Export.image.toDrive({
  image: mergedClasses,
  description: '2024_pure_fnf_updated',
  folder: 'Form_data',
  region: aoi,
  scale: 30,
});
var objectSize = mergedClasses.connectedPixelCount({
    maxSize: 128, eightConnected: false
  });
  
  // Get a pixel area image.
var pixelArea = ee.Image.pixelArea();
// Multiply pixel area by the number of pixels in an object to calculate
// the object area. The result is an image where each pixel
// of an object relates the area of the object in m^2.
var objectArea = objectSize.multiply(pixelArea);
// Threshold the `objectArea` image to define a mask that will mask out
// objects below a given size (1 hectare in this case).
var areaMask = objectArea.gte(10000);
// Update the mask of the `objectId` layer defined previously using the
// minimum area mask just defined.
var sieved_2014 = mergedClasses.updateMask(areaMask);
// Fill in empty pixels in the combined mask by taking the mode in a neighborhood
var wr_mask = ee.Image("users/pberiain5/wr_mask")
// Apply focal_mode() to sieved_2014, respecting wr_mask
// Apply focal_mode() to sieved_2014
var fnf_2014 = sieved_2014.focalMode( 1,'circle','pixels')
// Mask out the pixels using wr_mask
var fnf_2014 = fnf_2014.updateMask(wr_mask.not());
///Sieved image
Export.image.toDrive({
  image: fnf_2014,
  description: '2024_sieved_fnf_updated',
  folder: 'Form_data',
  region: aoi,
  scale: 30,
});

//------------------map ------------------//
// land cover palette
var palette = [
   '4E751F', // forest
   '929900', // degraded forest
   'F096FF', // savanah
   'FFFF4C', // cropland
   'FFBB22' // shrub
 ];
Map.addLayer(fnf_2014, {min: 1, max: 5,  palette: palette} , 'filled sieved masked');
Map.addLayer(mergedClasses, {min: 1, max: 5,  palette: palette} , 'pure image');
//Map.addLayer(land8, {min: 1, max: 5,  palette: palette} , 'classified image');
/////////

//------------------legend ------------------//

// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '3px 6px'
  }
});
 
// Create legend title
var legendTitle = ui.Label({
  value: "LC/LU",
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 2px 0',
    padding: '0'
    }
});
 
// Add the title to the panel
legend.add(legendTitle);
 
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 2px 0'
        }
      });
 
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 2px 4px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};
 
//  Palette with the colors
var palette_c = [
  '4E751F', // forest
   '929900', // degraded forest
   'F096FF', // savanah
   'FFFF4C', // cropland
   'FFBB22' // shrub
];
 
// name of the legend
var names = [
  'forest',
  'degraded forest', 
  'savanah',
  'cropland',
  'shrub'
];
// Add color and and names
for (var i = 0; i < 5; i++) {
  legend.add(makeRow(palette_c[i], names[i]));
  }  
// add legend to map
Map.add(legend);

