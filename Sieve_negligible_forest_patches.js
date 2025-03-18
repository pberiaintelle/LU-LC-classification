///https://developers.google.com/earth-engine/guides/image_objects
// Get a pixel area image.
var pixelArea = ee.Image.pixelArea();

// Multiply pixel area by the number of pixels in an object to calculate
// the object area. The result is an image where each pixel
// of an object relates the area of the object in m^2.
var objectArea = objectSize.multiply(pixelArea);

// Display object area to the Map.
Map.addLayer(objectArea,
             {min: 0, max: 30000, palette: ['0000FF', 'FF00FF']},
             'Object area m^2');
// Uniquely label the hotspot image objects.
var objectId = hotspots.connectedComponents({
  connectedness: ee.Kernel.plus(1),
  maxSize: 128
});

// Threshold the `objectArea` image to define a mask that will mask out
// objects below a given size (1 hectare in this case).
var areaMask = objectArea.gte(10000);

// Update the mask of the `objectId` layer defined previously using the
// minimum area mask just defined.
objectId = objectId.updateMask(areaMask);
Map.addLayer(objectId, null, 'Large hotspots');