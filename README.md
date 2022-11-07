# Medical Image Annotater & Viewer

### Goal
1) Annotate or label for image quality, artifact, disease severity
2) Visualize images
3) Standard medical image formats are allowed - DICOM, NIfTI

### Functions
1) Classification annotation (none, mild, moderate, severe)
2) Comparison annotation (left is worse, right is worse, tie)
3) Sort-based comparison annotation (left is worse, right is worse, tie) - this is a novel method we developed to reduce annotation burden!

### Developer Installation

1) Clone this repository.
2) Run `npm install` inside the project to install dependencies.
3) Run `npm run elrebuild` to rebuild dependencies for the electron node version.
4) Run `npm run buildcss` to compile CSS.
5) Run `npm run buildstart` to compile and run the application in developer mode.

To run the application again in the future, or after making changes, run `buildstart` again (step 5).

**Note:** when running in developer mode, application data will be written to a
subdirectory of the project named `dev_app_data`. This is controlled by
an environment variable: `HYACINTH_DEV=true`. If this variable is not set,
application data will be written to the default location as determined by Electron.

### Example
