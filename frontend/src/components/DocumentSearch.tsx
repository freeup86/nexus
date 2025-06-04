import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Chip,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Slider,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface SearchFilters {
  query: string;
  categories: string[];
  tags: string[];
  fileTypes: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sizeRange: {
    min: number;
    max: number;
  };
  includeContent: boolean;
  sortBy: 'relevance' | 'date' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
}

interface DocumentSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  onClearSearch: () => void;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({
  onSearch,
  categories,
  tags,
  onClearSearch,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    tags: [],
    fileTypes: [],
    dateRange: {
      start: null,
      end: null,
    },
    sizeRange: {
      min: 0,
      max: 100, // MB
    },
    includeContent: true,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'Word Documents' },
    { value: 'xls', label: 'Excel Spreadsheets' },
    { value: 'ppt', label: 'PowerPoint' },
    { value: 'image', label: 'Images' },
    { value: 'text', label: 'Text Files' },
    { value: 'other', label: 'Other' },
  ];

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, query: event.target.value });
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      categories: [],
      tags: [],
      fileTypes: [],
      dateRange: {
        start: null,
        end: null,
      },
      sizeRange: {
        min: 0,
        max: 100,
      },
      includeContent: true,
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
    onClearSearch();
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFilters({
      ...filters,
      categories: filters.categories.includes(categoryId)
        ? filters.categories.filter((id) => id !== categoryId)
        : [...filters.categories, categoryId],
    });
  };

  const handleTagToggle = (tagId: string) => {
    setFilters({
      ...filters,
      tags: filters.tags.includes(tagId)
        ? filters.tags.filter((id) => id !== tagId)
        : [...filters.tags, tagId],
    });
  };

  const handleFileTypeToggle = (fileType: string) => {
    setFilters({
      ...filters,
      fileTypes: filters.fileTypes.includes(fileType)
        ? filters.fileTypes.filter((type) => type !== fileType)
        : [...filters.fileTypes, fileType],
    });
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    filters.fileTypes.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null ||
    filters.sizeRange.min > 0 ||
    filters.sizeRange.max < 100;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search documents by name, content, or extracted data..."
            value={filters.query}
            onChange={handleQueryChange}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: filters.query && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setFilters({ ...filters, query: '' })}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            Search
          </Button>
          <IconButton
            onClick={(event) => setAnchorEl(event.currentTarget)}
            color={hasActiveFilters ? 'primary' : 'default'}
          >
            <FilterListIcon />
          </IconButton>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={filters.includeContent}
              onChange={(e) => setFilters({ ...filters, includeContent: e.target.checked })}
            />
          }
          label="Search in document content and extracted data"
        />

        {hasActiveFilters && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.categories.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                return category ? (
                  <Chip
                    key={categoryId}
                    label={category.name}
                    size="small"
                    onDelete={() => handleCategoryToggle(categoryId)}
                  />
                ) : null;
              })}
              {filters.tags.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                return tag ? (
                  <Chip
                    key={tagId}
                    label={tag.name}
                    size="small"
                    onDelete={() => handleTagToggle(tagId)}
                  />
                ) : null;
              })}
              {filters.fileTypes.map((fileType) => (
                <Chip
                  key={fileType}
                  label={fileTypeOptions.find((opt) => opt.value === fileType)?.label || fileType}
                  size="small"
                  onDelete={() => handleFileTypeToggle(fileType)}
                />
              ))}
              {filters.dateRange.start && (
                <Chip
                  label={`From: ${filters.dateRange.start.toLocaleDateString()}`}
                  size="small"
                  onDelete={() => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: null } })}
                />
              )}
              {filters.dateRange.end && (
                <Chip
                  label={`To: ${filters.dateRange.end.toLocaleDateString()}`}
                  size="small"
                  onDelete={() => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: null } })}
                />
              )}
              <Button size="small" onClick={handleClearFilters}>
                Clear All
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { width: 400, maxHeight: 600 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Advanced Filters
          </Typography>

          <Accordion expanded={expandedAccordion === 'categories'} onChange={handleAccordionChange('categories')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Categories</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.map((category) => (
                  <FormControlLabel
                    key={category.id}
                    control={
                      <Checkbox
                        checked={filters.categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                    }
                    label={category.name}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expandedAccordion === 'tags'} onChange={handleAccordionChange('tags')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Tags</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {tags.map((tag) => (
                  <FormControlLabel
                    key={tag.id}
                    control={
                      <Checkbox
                        checked={filters.tags.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                      />
                    }
                    label={tag.name}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expandedAccordion === 'fileTypes'} onChange={handleAccordionChange('fileTypes')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>File Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {fileTypeOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={filters.fileTypes.includes(option.value)}
                        onChange={() => handleFileTypeToggle(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expandedAccordion === 'dateRange'} onChange={handleAccordionChange('dateRange')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Date Range</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <DatePicker
                    label="From"
                    value={filters.dateRange.start}
                    onChange={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: date } })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <DatePicker
                    label="To"
                    value={filters.dateRange.end}
                    onChange={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: date } })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Box>
              </LocalizationProvider>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expandedAccordion === 'size'} onChange={handleAccordionChange('size')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>File Size (MB)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ px: 2 }}>
                <Typography variant="body2" gutterBottom>
                  {filters.sizeRange.min} MB - {filters.sizeRange.max} MB
                </Typography>
                <Slider
                  value={[filters.sizeRange.min, filters.sizeRange.max]}
                  onChange={(event, newValue) => {
                    const [min, max] = newValue as number[];
                    setFilters({ ...filters, sizeRange: { min, max } });
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 75, label: '75' },
                    { value: 100, label: '100+' },
                  ]}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Sort By
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <Select
                value={filters.sortBy}
                onChange={(e: SelectChangeEvent) => setFilters({ ...filters, sortBy: e.target.value as any })}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="date">Upload Date</MenuItem>
                <MenuItem value="name">File Name</MenuItem>
                <MenuItem value="size">File Size</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <Select
                value={filters.sortOrder}
                onChange={(e: SelectChangeEvent) => setFilters({ ...filters, sortOrder: e.target.value as any })}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setAnchorEl(null)}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              handleSearch();
              setAnchorEl(null);
            }}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default DocumentSearch;