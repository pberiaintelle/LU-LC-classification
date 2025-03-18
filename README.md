# LU-LC-classification
Change detection in forest cover from satellite imagery.
# LU-LC Classification

This project focuses on **change detection in forest cover** using **satellite imagery** over two distinct periods: **2014** and **2024**. The goal is to classify land cover and land use (LU-LC), detect changes in forest cover, and produce a detailed land cover classification map.

## Training Satellite Imagery

### 1. **Landsat 8 (2014 and 2024 Early Wet Season)**
   - **Date Selection**:
     - **2014**: 2014-03-01 to 2014-05-03
     - **2024**: 2024-03-01 to 2024-05-03
   - **Processed Images**:
     - **Landsat 8 Level 2A** surface reflectance product (30-meter resolution).
     - 7 spectral bands (visible, near-infrared, and 2 short-wave infrared).
     - Median, standard deviation, and first/last percentile values per pixel.
     - Slope values included.
     - **Chlorophyll Green Index (CGI)** and **Bare Soil Index (BSI)** were calculated.
     - **Atmospherically Corrected** images.

### 2. **Sentinel 2/1 (2018-2019)**:
   - **Date Selection**:
     - **Dry Season (2018-11-01 to 2019-03-29)**.
     - **Wet Season (2019-03-30 to 2019-10-30)**.
   - **Processed Images**:
     - **Sentinel-2 (10-meter resolution)** composite images (10 bands).
     - Median values for both dry and wet seasons per pixel.
     - **Chlorophyll Green Index (CGI)** and **Bare Soil Index (BSI)** calculated.
     - **Sentinel-1 VH and VV polarization** (10-meter resolution):
       - Median, standard deviation, VH/VV ratio.
       - **Gray-Level Co-Occurrence Matrix (GLCM)** texture variables.
       - First/last percentile values per pixel.
     - Slope values included for both seasons.

---

## Land Cover Classifications

### 1. **Sentinel-Based Supervised Classification**
   - **Random Forest (RF) Classifier**:
     - 500 trees used in the classification.
   - **Vegetation Classification**:
     - 5 vegetation classes: **forest**, **degraded forest**, **savannah**, **cropland**, **shrubland/grassland**.

---

## Classification Methodology / Workflow

### 1. **Satellite Imagery Preprocessing**:
   - Cropping to study area and calculating band variables.

### 2. **Land Cover Mask (Wetlands and Rock Mask)**:
   - **Assumption**: Wetlands and rocks are stable over time.
   - **Extract Wetland and Rock Classes**:
     - Derived from **Sentinel fused classification**.
     - Apply a sieve (8000 m² for wetlands & 15000 m² for rocks).
     - Merge to create an overall mask.

### 3. **Landsat 8 Masked Image**:
   - Mask out wetland and rock areas.

### 4. **Land Cover / Land Use Classification**:
   - Perform land cover classification for **5 vegetation classes** (forest, degraded forest, savannah, cropland, shrubland/grassland).
   
### 5. **Forest/Non-Forest Map**:
   - Apply sieve **< 1 ha** for small patches.

---

## Dependencies

- **Google Earth Engine** (for image processing and classification).
- **Python** (for scripting and automation).
- **Sentinel and Landsat** data (accessible through Earth Engine).
- **Random Forest Classifier** (for supervised classification).

---

## How to Use

1. **Download the script** from this repository.
2. **Ensure access to Google Earth Engine** for the processing scripts.
3. Run the Python scripts to process the satellite imagery and perform classification.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
