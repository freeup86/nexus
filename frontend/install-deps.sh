#!/bin/bash

echo "Installing Material-UI and related dependencies..."

# Install Material-UI packages
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/x-date-pickers

# Install react-pdf
npm install react-pdf

# Install any missing type definitions
npm install --save-dev @types/react-pdf

echo "Dependencies installed successfully!"