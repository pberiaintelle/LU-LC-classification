Map.centerObject(aoi, 10);
////Import fused image from asset
var land8 = ee.Image("users/pberiain5/2024_wet_masked")
print(land8, 'fusedimage');

////////////////////////////////////////////////////
// RF - with Landsat 8 bands and computations

//------------------train ------------------//

var train_areas = ee.FeatureCollection("users/pberiain5/training2024")
//var coffee_areas = ee.FeatureCollection("users/pberiain5/coffee2")
//print('All metadata:', coffee_areas);
//var image = imageCollection
//.filterDate('2021-01-01', '2021-12-30')
                  // Pre-filter to get less cloudy granules.
    //              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
      //            .map(maskS2clouds)
                  //filter according to drawn boundary
        //          .filterBounds(buffer)
          //        .median();
// sample with training data for classifier
print('train_areas', train_areas)

// Train class 1
var p1 = train_areas.filter('ClassID == 1');
var train_pol1 = p1.randomColumn('random', 0, 'uniform');
var train1 = train_pol1.filter('random <= 0.7');
var validation1 = train_pol1.filter('random > 0.7');
print('train1', train1);
// Train class 2
var p2 = train_areas.filter('ClassID == 2');
var train_pol2 = p2.randomColumn('random', 0, 'uniform');
var train2 = train_pol2.filter('random <= 0.7');
var validation2 = train_pol2.filter('random > 0.7');
print('train2', train2);
//Train class3
var p3 = train_areas.filter('ClassID == 3')
var train_pol3 = p3.randomColumn('random', 0, 'uniform');
var train3 = train_pol3.filter('random <= 0.7')
var validation3 = train_pol3.filter('random > 0.7')
print('train3', train3)
//Train class4
var p4 = train_areas.filter('ClassID == 4')
var train_pol4 = p4.randomColumn('random', 0, 'uniform');
var train4 = train_pol4.filter('random <= 0.7')
var validation4 = train_pol4.filter('random > 0.7')
//Train class5
var p5 = train_areas.filter('ClassID == 5')
var train_pol5 = p5.randomColumn('random', 0, 'uniform');
var train5 = train_pol5.filter('random <= 0.7')
var validation5 = train_pol5.filter('random > 0.7')

//Train class8
//var p8 = train_areas.filter('ClassID == 8')
//var train_pol8 = p8.randomColumn('random', 0, 'uniform');
//var train8 = train_pol8.filter('random <= 0.8')
//var validation8 = train_pol8.filter('random > 0.8')

//Training polygons
var merging = train5.merge(train4);var merging = merging.merge(train3);
var merging = merging.merge(train2);var training = merging.merge(train1);
print('training', training);
//Validation polygons
var merging = validation5.merge(validation4);var merging = merging.merge(validation3);
var merging = merging.merge(validation2);var validation = merging.merge(validation1);
print('validation', validation);


//Sample from polygons
var training_land8 = land8.sampleRegions({
  collection: training,
  properties: ['ClassID'],
  scale: 30,
 tileScale: 16
});

//print('All metadata:', training);
// get feaature names for classifier
var bandNames = land8.bandNames();


    // });
//Change classifier depending on the algorithm. Random Forest (.smileRandomForest(500)) or Support Vector Machine (.libsvm())
var classifier = ee.Classifier.smileRandomForest(500).train(training_land8, 'ClassID')
//var classifier = ee.Classifier.libsvm().train(training_s2, 'ClassID')
print('explained', classifier.explain());//.get('importance'));


// //chart
var f_feat = ee.Feature(null, classifier.explain().get('importance'));
 var f_chart =
 ui.Chart.feature.byProperty(f_feat)
 .setChartType('ColumnChart')
 .setOptions({
 title: 'RF Variable Importance',
 legend: {position: 'none'},
 hAxis: {title: 'Bands'},
 vAxis: {title: 'Importance'}
 });
 print(f_chart);



//------------------run ------------------//

// run classifier
var RF = land8.classify(classifier);


//Export.image.toAsset(RF, 'RF1')
//------------------test ------------------//

// print(test_points,'test points');

// sample with test data for classifier
var test_sampled_classif = land8.sampleRegions({
  collection: validation,
  properties: ['ClassID'],
  scale: 30,
 tileScale: 16
});

var classified_test = test_sampled_classif.classify(classifier);

var testAccuracy = classified_test.errorMatrix('ClassID', 'classification', [1,2,3,4,5]); // 

//ee.ConfusionMatrix type has commands accuracy(), array(), consumersAccuracy(), producersAccuracy(), kappa()
print('overall accuracy', testAccuracy.accuracy());
print('producer accuracy', testAccuracy.producersAccuracy());
print('consumer accuracy', testAccuracy.consumersAccuracy());
//print('kappa', testAccuracy.kappa());
print('confusion matrix', testAccuracy.array());
// Export the image sample feature collection to Drive as a shapefile.
Export.table.toDrive({
  collection: testAccuracy,
  description: 'accuracy',
  folder: 'From_data',
  fileFormat: 'CSV'
});

//------------------map ------------------//

// land cover palette
var palette = [
   '4E751F', // forest
   '929900', // degraded forest 
   'FFFF4C',// savanah
   'F096FF',// cropland
   'FFBB22' // shrub
 ];

Map.addLayer(RF, {min: 1, max: 5,  palette: palette} , 'classified image');
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
   'FFFF4C',// savanah
   'F096FF',// cropland
   'FFBB22' // shrubb
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

//Export map
//Export.map.toCloudStorage(RF, (fileFormat: 'png'), (scale:5000));

// Export image to visualize in ArcGis Pro

Export.image.toDrive({
  image: RF,
  description: '2014_wet_masked_updated',
  folder: 'Form_data',
  region: aoi,
  scale: 30,
});

//Export.image.toAsset({
Export.image.toAsset({
  image: RF,
  description: '2014_wet_masked_CLASSIFIED_updated',
  assetId: 'projects/<project-name>/assets/<asset-name>',  // <> modify these
  region: aoi,
  scale: 30,
  crs: 'EPSG:4326'
});