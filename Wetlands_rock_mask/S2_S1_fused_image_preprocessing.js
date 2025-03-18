Map.centerObject(aoi, 10);
//date parameters
var start = ee.Date('2018-11-01');
var end_dry = ee.Date('2029-03-29');
var start_wet = ee.Date('2019-03-30');
var end = ee.Date('2019-10-30');

//visualization parameters
var vizParams = {bands: ['swir1','nir', 'red'], min: 0.0, max: 0.4, gamma:1.3}; // SWIR, NIR, R
var vizParams2 = {bands: ['nir', 'red', 'green'], min: 0.0, max: 0.4, gamma:1.3}; //NIR, R, G

var region = aoi;

/////////////////////////////////////////////////
//s1 data pull dry season
var SAR19_d = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filterDate(start, end_dry)
  .map(function(image){return image.clip(aoi)})
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'));
//print(SAR19, "SAR collection 2021");

//var asc_SAR19_d = SAR19_d.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
//var desc_SAR19_d = SAR19_d.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
//print(asc_SAR19, '2021 SAR Ascending Images pulled');

///////////////////////////////////////////////
// S1 components dry

//median & median comps
var VH_d = SAR19_d.select('VH').median().rename('VH_d');
var VV_d = SAR19_d.select('VV').median().rename('VV_d');
var ratio_VH_VV_d = VH_d.divide(VV_d).rename('ratio_VH_VV_d');

Map.addLayer(VV_d, {min: -25, max: 5}, 'S1_d', true);
//sd
var VH_sd_d = SAR19_d.select('VH')
                           .reduce(ee.Reducer.stdDev())
                           .rename('VH_sd_d');
                          
var VV_sd_d = SAR19_d.select('VV')
                           .reduce(ee.Reducer.stdDev())
                           .rename('VV_sd_d');
//percentiles
var VH_perc_d = SAR19_d.select('VH')
                             .reduce(ee.Reducer.percentile([25,75]))
                             .rename(['VH_25_d','VH_75_d']);
                             
var VV_perc_d = SAR19_d.select('VV')
                             .reduce(ee.Reducer.percentile([25,75]))
                             .rename(['VV_25_d','VV_75_d']);
                             

var S1img_dry = ee.Image.cat([VH_d, VV_d, ratio_VH_VV_d, VH_sd_d, VV_sd_d, VH_perc_d, VV_perc_d]);
print(S1img_dry, 's1_dry');
////////////////////////////////////////////////
// GLCM Texture
//DESC VV and VH bands for S1 images
// Define a neighborhood for offset
var square1 = ee.Kernel.square({radius: 1});
//texture for S1 composites
var texture_vh_d = VH_d.int().glcmTexture({ //use .int() to cast to a "signed 32-bit". Originally double, which is 64-bit & too high
    size: 5,
    kernel: square1,
    //average: true
  });
print('texture_d', texture_vh_d)
////////////////////////////////////////////////
//S1 data pull wet season
var SARwet = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filterDate(start_wet, end)
  .map(function(image){return image.clip(aoi)})
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'));
//print(SAR19, "SAR collection 2021");

//var asc_SARwet = SARwet.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
//var desc_SARwet = SARwet.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
//print(asc_SARwet, '2021 SAR wet season');


///////////////////////////////////////////////
// S1 components

//median & median comps
var VH_w = SARwet.select('VH').median().rename('VH_w');
var VV_w = SARwet.select('VV').median().rename('VV_w');
var ratio_VH_VV_w = VH_w.divide(VV_w).rename('ratio_VH_VV_w');


//sd wet season
var VH_sd_w = SARwet.select('VH')
                           .reduce(ee.Reducer.stdDev())
                           .rename('VH_sd_w');
                          
var VV_sd_w = SARwet.select('VV')
                           .reduce(ee.Reducer.stdDev())
                           .rename('VV_sd_w');
//percentiles for wet season
var VH_perc_w = SARwet.select('VH')
                             .reduce(ee.Reducer.percentile([25,75]))
                             .rename(['VH_25_w','VH_75_w']);
                             
var VV_perc_w = SARwet.select('VV')
                             .reduce(ee.Reducer.percentile([25,75]))
                             .rename(['VV_25_w','VV_75_w']);
                             

var S1img_wet = ee.Image.cat([VH_w, VV_w, ratio_VH_VV_w,
VH_sd_w, VV_sd_w, VH_perc_w, VV_perc_w]);
print(S1img_wet, 's1_wet');

// merge dry and wet season
var S1img = S1img_dry.addBands(S1img_wet);
print(S1img, 's1_ALL');
////////////////////////////////////////////////
// GLCM Texture
//DESC VV and VH bands for S1 images
// Define a neighborhood for offset
var square1 = ee.Kernel.square({radius: 1});
//texture for S1 composites
var texture_vh_w = VH_w.int().glcmTexture({ //use .int() to cast to a "signed 32-bit". Originally double, which is 64-bit & too high
    size: 5,
    kernel: square1,
    //average: true
  });
print('texture_w', texture_vh_w)
// var texture_vv = desc_VV.int().glcmTexture({ //use .int() to cast to a "signed 32-bit". Originally double, which is 64-bit & too high
//     size: 5,
//     kernel: square1,
//     //average: true
//   });
Map.addLayer(texture_vh_w, {min: -25, max: 5}, 'S1texturewet', true);
// add 16 texture computation to images
var S1_all = S1img.addBands(texture_vh_d.select(['VH_d_idm', 'VH_d_contrast', 'VH_d_corr', 'VH_d_var', 'VH_d_ent', 'VH_d_svar', 'VH_d_sent', 'VH_d_asm'])
.addBands(texture_vh_w.select(['VH_w_idm', 'VH_w_contrast', 'VH_w_corr', 'VH_w_var', 'VH_w_ent', 'VH_w_svar', 'VH_w_sent', 'VH_w_asm'])));
print(S1_all, 'All S1 bands- CHECK');

//Map.centerObject(region, 7);
Map.addLayer(S1_all, {min: -25, max: 5}, 'S1', true);
//Map.addLayer(region, {color: 'FF0000'}, 'colored');
////////////////////////////////////////////////////////
// s2 data pull (TOA)

/**
 * Function to mask clouds using the Sentinel-2 QA band
 * @param {ee.Image} image Sentinel-2 image
 * @return {ee.Image} cloud masked Sentinel-2 image
 */
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask);
}


var s2s = ee.ImageCollection('COPERNICUS/S2')
                  .filterBounds(aoi)
                  .filterDate(start,end)
                  .map(function(image){return image.clip(aoi)})
                  //.filterDate(start, end_dry)
                  //.filterDate(start_wet, end)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) //30 percent
                  .sort('CLOUDY_PIXEL_PERCENTAGE')//,false)
                  .map(function(img){
 
                    var t = img.select([ 'B1','B2','B3','B4','B5','B6','B7','B8','B8A', 'B9','B10', 'B11','B12']).divide(10000);//Rescale to 0-1
                    t = t.addBands(img.select(['QA60']));
                    var out = t.copyProperties(img).copyProperties(img,['system:time_start']);
                  return out;
                    })
                    .select(['QA60', 'B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B10', 'B11','B12'],['QA60','cb', 'blue', 'green', 'red', 're1','re2','re3','nir', 'nir2', 'waterVapor', 'cirrus','swir1', 'swir2'])
                    .map(maskS2clouds);

print(s2s, 'GEE-pulled S2, 2021');

Map.centerObject(aoi, 10);
//Map.addLayer(s2s, vizParams, 's2 pull first');
//Map.addLayer(s2s.maskS2clouds(), vizParams, 's2 masked');


//////////////////////////////////////////////////////
//pull cloudscore and TDOM shadow mask module, for S2
var importS2cloud = require ('users/gmm402/REP_maskell:modules/S2-cloud-shadow-score');
var S2_cloudscore = importS2cloud.s2cloudshadow(s2s); 

print(S2_cloudscore, 'S2 2021-22 cloud & shadow removed collection, pre-processed');


////////////////////////////////////////////////
//SRTM
var dem = ee.Image('USGS/SRTMGL1_003') //note ee.Image not ee.ImageCollection!
  .clip(aoi);
var elevation = dem.select('elevation');
var slope = ee.Terrain.slope(elevation);
//var aspect = ee.Terrain.aspect(elevation);


////////////////////////////////////////////////

//Rename the image
var S2_vis = s2s

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//seasonal components S2

var s2_dry = S2_vis.filterDate(start, end_dry).median();
var s2_wet = S2_vis.filterDate(start_wet, end).median();
print(s2_wet, 's2_wet');

// properties: ['blue', 'green', 'red', 're1','re2','re3','nir', 'nir2','swir1', 'swir2', 'IC', cosZ', 'cosS',' slope' 
// 'ndvi', 'ndvi2', 'evi', 'evi2', 'mtci', 'gcvi','tvi', 'savi', 'ndwi', 'ndwi2', 'mcrc', 'ndti', 'mtci_frac', // 'ndvi_contrast', 'ndvi_corr', 'ndvi_var', 'ndvi_ent']
// 'ndvi_contrast_b', 'ndvi_corr_b', 'ndvi_var_b', 'ndvi_ent_b']


// this is to merge 
var s2_wet_b = s2_wet.rename(['qa_b', 'cb_b', 'blue_b', 'green_b', 'red_b', 're1_b', 're2_b','re3_b','nir_b', 'nir2_b', 'waterVapor_b', 'cirrus_b', 'swir1_b', 'swir2_b']);


// merge dry and wet season
var s2_all_seas = s2_dry.select(['blue', 'green', 'red', 're1','re2','re3','nir', 'nir2','swir1', 'swir2'])
                          .addBands(s2_wet_b.select(['blue_b', 'green_b', 'red_b', 're1_b','re2_b','re3_b','nir_b', 'nir2_b','swir1_b', 'swir2_b']));

print(s2_all_seas, 'S2 dry and wet 2021-22, fully pre-processed, with all VIs');

var S2_S1_all = s2_all_seas.addBands(S1_all).addBands(slope).float();
print(S2_S1_all, 'export image');
//57 bands



//Export.image.toAsset({
Export.image.toAsset({
  image: S2_S1_all,
  description: 'S2_S1_2021_2022',
  assetId: 'projects/<project-name>/assets/<asset-name>',  // <> modify these
  region: region,
  scale: 10,
  crs: 'EPSG:4326'
});
