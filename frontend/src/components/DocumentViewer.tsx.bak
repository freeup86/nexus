import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Paper,
  Toolbar,
  Tooltip,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Comment as CommentIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface Annotation {
  id: string;
  page: number;
  x: number;
  y: number;
  text: string;
  timestamp: string;
}

interface DocumentViewerProps {
  documentId: string;
  filePath: string;
  fileType: string;
  fileName: string;
  onClose: () => void;
  onAnnotationSave?: (annotations: Annotation[]) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  filePath,
  fileType,
  fileName,
  onClose,
  onAnnotationSave,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState<{ x: number; y: number } | null>(null);

  const documentUrl = `${process.env.REACT_APP_API_URL}/api/document-organizer/documents/${documentId}/file`;

  useEffect(() => {
    // Load existing annotations
    fetchAnnotations();
  }, [documentId]);

  const fetchAnnotations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/document-organizer/documents/${documentId}/annotations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAnnotations(data);
      }
    } catch (error) {
      console.error('Failed to fetch annotations:', error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(error.message);
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  const handleRotateLeft = () => {
    setRotation((prevRotation) => (prevRotation - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (numPages || 1)) {
      setPageNumber(newPage);
    }
  };

  const handleDocumentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isAnnotating) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setAnnotationPosition({ x, y });
    }
  };

  const handleAnnotationSave = () => {
    if (annotationText && annotationPosition) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        page: pageNumber,
        x: annotationPosition.x,
        y: annotationPosition.y,
        text: annotationText,
        timestamp: new Date().toISOString(),
      };
      const updatedAnnotations = [...annotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      
      // Save to backend
      saveAnnotations(updatedAnnotations);
      
      // Reset annotation state
      setAnnotationText('');
      setAnnotationPosition(null);
      setIsAnnotating(false);
      
      if (onAnnotationSave) {
        onAnnotationSave(updatedAnnotations);
      }
    }
  };

  const saveAnnotations = async (annotationsToSave: Annotation[]) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${process.env.REACT_APP_API_URL}/api/document-organizer/documents/${documentId}/annotations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ annotations: annotationsToSave }),
        }
      );
    } catch (error) {
      console.error('Failed to save annotations:', error);
    }
  };

  const renderDocument = () => {
    if (fileType === 'application/pdf') {
      return (
        <Document
          file={documentUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<CircularProgress />}
          rotate={rotation}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            onClick={handleDocumentClick}
          />
          {annotations
            .filter((ann) => ann.page === pageNumber)
            .map((annotation) => (
              <Box
                key={annotation.id}
                sx={{
                  position: 'absolute',
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  backgroundColor: 'rgba(255, 235, 59, 0.3)',
                  border: '2px solid #FDD835',
                  borderRadius: 1,
                  padding: 0.5,
                  cursor: 'pointer',
                  zIndex: 1000,
                }}
              >
                <Tooltip title={annotation.text}>
                  <CommentIcon fontSize="small" />
                </Tooltip>
              </Box>
            ))}
        </Document>
      );
    } else if (fileType.startsWith('image/')) {
      return (
        <Box
          onClick={handleDocumentClick}
          sx={{
            position: 'relative',
            display: 'inline-block',
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center',
            transition: 'transform 0.3s ease',
          }}
        >
          <img
            src={documentUrl}
            alt={fileName}
            style={{ maxWidth: '100%', height: 'auto' }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError('Failed to load image');
              setLoading(false);
            }}
          />
          {annotations.map((annotation) => (
            <Box
              key={annotation.id}
              sx={{
                position: 'absolute',
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                backgroundColor: 'rgba(255, 235, 59, 0.3)',
                border: '2px solid #FDD835',
                borderRadius: 1,
                padding: 0.5,
                cursor: 'pointer',
              }}
            >
              <Tooltip title={annotation.text}>
                <CommentIcon fontSize="small" />
              </Tooltip>
            </Box>
          ))}
        </Box>
      );
    } else {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Preview not available for this file type
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mt: 2 }}
          >
            Download File
          </Button>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={2} sx={{ zIndex: 1200 }}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {fileName}
          </Typography>
          
          {fileType === 'application/pdf' && numPages && (
            <>
              <IconButton onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber <= 1}>
                <NavigateBeforeIcon />
              </IconButton>
              <Typography variant="body2">
                Page {pageNumber} of {numPages}
              </Typography>
              <IconButton onClick={() => handlePageChange(pageNumber + 1)} disabled={pageNumber >= numPages}>
                <NavigateNextIcon />
              </IconButton>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            </>
          )}
          
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title="Rotate Left">
            <IconButton onClick={handleRotateLeft}>
              <RotateLeftIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Rotate Right">
            <IconButton onClick={handleRotateRight}>
              <RotateRightIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title="Add Annotation">
            <IconButton
              onClick={() => setIsAnnotating(!isAnnotating)}
              color={isAnnotating ? 'primary' : 'default'}
            >
              <CommentIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Download">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Print">
            <IconButton onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title="Close">
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Paper>
      
      {isAnnotating && annotationPosition && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            p: 2,
            zIndex: 1300,
            minWidth: 300,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Add Annotation
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            placeholder="Enter your annotation..."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => {
              setIsAnnotating(false);
              setAnnotationPosition(null);
              setAnnotationText('');
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleAnnotationSave}
              disabled={!annotationText}
            >
              Save
            </Button>
          </Box>
        </Paper>
      )}
      
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          position: 'relative',
          cursor: isAnnotating ? 'crosshair' : 'default',
        }}
      >
        {loading && <CircularProgress />}
        {error && (
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        )}
        {!loading && !error && renderDocument()}
      </Box>
    </Box>
  );
};

export default DocumentViewer;