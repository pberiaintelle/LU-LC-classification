////Import classiffied image.
var s2s1 = ee.Image("users/pberiain5/S2S1_classified_2021_22")
//Extract wetland and rock classes
//var wr_mask = s2s1.eq(5).or(s2s1.eq(6));

// Extract wetland and rock classes and assign values 5 and 6
//WETLANDS
// Create two bands for wetland and rock classes
var wetland_mask = s2s1.eq(5).rename('wetland'); // Band representing wetland class
// Apply sieve to remove pixel clusters that are less than 120 square meters.
var objectSize = wetland_mask.connectedPixelCount({
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
var areaMask = objectArea.gte(8000);
// Update the mask of the `objectId` layer defined previously using the
// minimum area mask just defined.
var sieved_wetlands = wetland_mask.updateMask(areaMask);

//ROCKS
var rock_mask = s2s1.eq(6).rename('rock'); // Band representing rock class
// Apply sieve to remove pixel clusters that are less than 120 square meters.
var objectSize = rock_mask.connectedPixelCount({
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
var areaMask = objectArea.gte(15000);
// Update the mask of the `objectId` layer defined previously using the
// minimum area mask just defined.
var sieved_rocks = rock_mask.updateMask(areaMask);
// Export to Google Drive
Export.image.toDrive({
  image: sieved_rocks,
  description: 'sieved_rocks', // Description for the exported file
  folder: 'Form_data', // Specify your Google Drive folder here
  fileNamePrefix: 'sieved_rocks', // File name prefix
  region: aoi, // Assuming you want to export the entire image region
  scale: 30,
  crs: 'EPSG:4326'
});

var wr_mask = sieved_rocks.or(sieved_wetlands);
Export.image.toDrive({
  image: wr_mask,
  description: 'wr_mask_sieved',
  folder: 'Form_data',
  region: aoi,
  scale: 30,
});
// Export to asset
Export.image.toAsset({
  image: wr_mask,
  description: 'wr_mask',
  assetId: 'projects/<project-name>/assets/<asset-name>',  // Modify these
  region: aoi,
  scale: 30,
  crs: 'EPSG:4326'
});
Map.addLayer(wr_mask, {palette: 'ff0000'}, 'Overall Mask');
/////////////////////////////////////////////////////////////////////////////////////7
//Import Landsat 8 image
var land8_2014 = ee.Image("users/pberiain5/2013_wet")
var land8_2024 = ee.Image("users/pberiain5/2022_wet")
//Resample land8_2014 to s2s1(10m)
var land8_2014_resampled = land8_2014.resample('bicubic').reproject({
  crs: s2s1.projection(),
  scale: 10
});

// Mask out pixels
var land8_2014_masked = land8_2014_resampled.updateMask(wr_mask.not());
//print(land8_2014_masked,'masked 2019')
// Display the masked image
Map.centerObject(land8_2014_masked, 10);
Map.addLayer(land8_2014_masked, {bands: ['red', 'green', 'blue'], max: 3000}, 'Masked Landsat 8 2014');

// Resample back to 30m
var land8_2014_veg = land8_2014_masked.resample('bicubic').reproject({
  crs: 'EPSG:4326',
  scale: 30
});

// Export to asset
Export.image.toAsset({
  image: land8_2014_veg,
  description: '2013_wet_masked',
  assetId: 'projects/<project-name>/assets/<asset-name>',  // Modify these
  region: aoi,
  scale: 30,
  crs: 'EPSG:4326'
});
Map.addLayer(land8_2014_veg, {bands: ['red', 'green', 'blue'], max: 3000}, '2014');
/////////////////////////////////////////////77
// Resample land8_2024 to s2s1(10m)
var land8_2024_resampled = land8_2024.resample('bicubic').reproject({
  crs: s2s1.projection(),
  scale: 10
});

// Mask out pixels
var land8_2024_masked = land8_2024_resampled.updateMask(wr_mask.not());
//print(land8_2024_masked,'masked 2024')
// Display the masked image
Map.centerObject(land8_2024_masked, 10);

// Resample back to 30m
var land8_2024_veg = land8_2024_masked.resample('bicubic').reproject({
  crs: 'EPSG:4326',
  scale: 30
});

// Export to asset
Export.image.toAsset({
  image: land8_2024_veg,
  description: '2022_wet_masked',
  assetId: 'projects/<project-name>/assets/<asset-name>',  // Modify these
  region: aoi,
  scale: 30,
  crs: 'EPSG:4326'
});