//Enter date parameters
var start = ee.Date('2013-03-01');
var end = ee.Date('2013-05-03');

//visualization parameters
var vizParams = {bands: ['swir1','nir', 'red'], min: 0.0, max: 0.3, gamma:1.3}; // SWIR, NIR, R
var vizParams2 = {bands: ['nir', 'red', 'green'], min: 0.0, max: 0.3, gamma:1.3}; //NIR, R, G

//Predefined aoi extent
var aoi = ee.FeatureCollection("users/pberiain5/aoi_uganda");
var region = aoi;

/////////////////////////////////////////////////


var land8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
                  .filterBounds(aoi)
                  .filterDate(start,end)
                  .map(function(image){return image.clip(aoi)})
                  // Define a function to mask out clouds and cloud shadows.
                  .map(function(img) {
                    var cloudShadowBiMask = 1 << 3;
                    var cloudBitMask = 1 << 5;
                    var qa = img.select('QA_PIXEL');
                    var mask = qa.bitwiseAnd(cloudShadowBiMask).eq(0)
                    .and(qa.bitwiseAnd(cloudBitMask).eq(0));
                  return img.updateMask(mask);
                    })
                  .map(function(img){
 
                    var t = img.select([ 'SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7']).divide(10000);//Rescale to 0-1
                    t = t.addBands(img.select(['QA_PIXEL']));
                    var out = t.copyProperties(img).copyProperties(img,['system:time_start']);
                  return out;
                    })
                    .select(['QA_PIXEL','SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'],['QA60','cb', 'blue', 'green', 'red','nir', 'swir1', 'swir2'])
                    ;

print(land8, 'GEE-pulled S2, 2021');
Map.centerObject(aoi, 10);
//Map.addLayer(s2s, vizParams, 's2 pull first');
Map.addLayer(land8, {bands: ['red', 'green', 'blue'], min: 0.0, max: 0.7, gamma:1.3}, 'SR', false);
//Map.addLayer(s2s.maskS2clouds(), vizParams, 's2 masked');
// Get the first image from the filtered collection
var firstImage = land8.first();

// Display the first image with specified visualization parameters
Map.addLayer(firstImage, {bands: ['red', 'green', 'blue'], // Change bands as needed
                           min: 0.0,
                           max: 0.7}, 
             'First Landsat 8 Image');

////////////////////////////////////////////////
//SRTM
var dem = ee.Image('USGS/SRTMGL1_003') //note ee.Image not ee.ImageCollection!
  .clip(aoi);
var elevation = dem.select('elevation');
var slope = ee.Terrain.slope(elevation);
//var aspect = ee.Terrain.aspect(elevation);


//Rename image
var land8_vis = land8

//////////////////////////////////////////////////////

                             
//////////////////////////////////////////////////////
//seasonal components, median, sd and percentiles

var land8_med = land8_vis.filterDate(start, end).median();
var land8_sd = land8_vis.filterDate(start, end).reduce(ee.Reducer.stdDev());
var land8_perc = land8_vis.filterDate(start, end).reduce(ee.Reducer.percentile([25,75]));
//CALCULATE BSI expression METHOD
var bsi_ex= '((SWIR1+RED)-(NIR+BLUE))/((SWIR1+RED)+(NIR+BLUE))'
var bsi = ee.Image(land8_med).expression({
  expression: bsi_ex,
  map:{
  SWIR1:land8_med.select('swir1'),
  RED:land8_med.select('red'),
  NIR:land8_med.select('nir'),
  BLUE:land8_med.select('blue')
  }
}).rename('bsi');

//CALCULATE CIG expression METHOD
var cig_ex= '((NIR)/(GREEN))-1'
var cig = ee.Image(land8_med).expression({
  expression: cig_ex,
  map:{
  NIR:land8_med.select('nir'),
  GREEN:land8_med.select('green')
  }
}).rename('cig');

Map.addLayer(cig,{palette:['yellow','green']},'cvi')
//Merge components
var land8united = land8_med.select(['blue', 'green', 'red','nir','swir1', 'swir2'])
.addBands(land8_sd.select(['blue_stdDev', 'green_stdDev', 'red_stdDev','nir_stdDev', 'swir1_stdDev', 'swir2_stdDev'])
.addBands(land8_perc.select(['blue_p25','blue_p75', 'green_p25','green_p75',
'red_p25','red_p75','nir_p25','nir_p75','swir1_p25','swir1_p75', 'swir2_p25','swir2_p75']))).addBands(bsi).addBands(cig);
var land8_all = land8united.addBands(slope).float();

print(land8_all, 'land8 all')
/////////////////////////////////////////////////////////////////

// properties: ['blue', 'green', 'red', 're1','re2','re3','nir', 'nir2','swir1', 'swir2', 'IC', cosZ', 'cosS',' slope' 
// 'ndvi', 'ndvi2', 'evi', 'evi2', 'mtci', 'gcvi','tvi', 'savi', 'ndwi', 'ndwi2', 'mcrc', 'ndti', 'mtci_frac', // 'ndvi_contrast', 'ndvi_corr', 'ndvi_var', 'ndvi_ent']
// 'ndvi_contrast_b', 'ndvi_corr_b', 'ndvi_var_b', 'ndvi_ent_b']

//Export.image.toAsset({
Export.image.toAsset({
  image: land8_all,
  description: '2013_wet',
  assetId: 'projects/<project-name>/assets/<asset-name>',  // <> modify these
  region: aoi,
  scale: 30,
  crs: 'EPSG:4326'
});

Export.image.toDrive({
  image: land8_all,
  description: '2014_wet_raw',
  folder: 'Form_data',
  region: aoi,
  scale: 30,
});