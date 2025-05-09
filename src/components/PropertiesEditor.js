import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  Button, Box, CircularProgress, Typography, 
  TextField, MenuItem, Select, FormControl
} from '@mui/material';
import { useProperties } from '../context/PropertiesContext';

// Custom cell editor component with tab navigation
const TranslationCellEditor = (props) => {
  const inputRef = useRef(null);
  const [value, setValue] = useState(props.value || '');
  const { suggestTranslation, languages } = useProperties();
  const [suggestions, setSuggestions] = useState([]);
  const [sourceLanguage, setSourceLanguage] = useState('');

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // We need to implement this method as it's required by AG Grid
  const getValue = () => value;

  const handleKeyDown = (event) => {
    if (event.key === 'Tab') {
      props.stopEditing();
    }
  };

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleSuggest = async () => {
    if (!sourceLanguage) return;
    
    try {
      const suggestion = await suggestTranslation(
        props.node.data.key,
        sourceLanguage,
        props.column.colId
      );
      
      setValue(suggestion);
    } catch (error) {
      console.error('Error getting translation suggestion:', error);
    }
  };

  // Get available source languages (those with values for this key)
  useEffect(() => {
    const availableSources = languages.filter(lang => {
      return lang !== props.column.colId && props.node.data[lang];
    });
    
    setSuggestions(availableSources);
    if (availableSources.length > 0) {
      setSourceLanguage(availableSources[0]);
    }
  }, [languages, props.column.colId, props.node.data]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', p: 1, width: '100%', height: '100%' }}>
      <TextField
        fullWidth
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        multiline
        sx={{ mr: 1 }}
      />
      
      {suggestions.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 80, mr: 1 }}>
            <Select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              displayEmpty
              variant="outlined"
            >
              {suggestions.map(lang => (
                <MenuItem key={lang} value={lang}>{lang}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            size="small"
            onClick={handleSuggest}
          >
            Suggest
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Custom cell renderer with validation
const TranslationCellRenderer = (props) => {
  const { checkTranslation } = useProperties();
  const [validationResult, setValidationResult] = useState({ valid: true });
  const { key } = props.data;
  const language = props.column.colId;
  const value = props.value || '';

  useEffect(() => {
    const result = checkTranslation(key, language, value);
    setValidationResult(result);
  }, [key, language, value, checkTranslation]);

  return (
    <Box 
      sx={{ 
        p: 1, 
        height: '100%', 
        width: '100%',
        backgroundColor: !value ? '#fff8e1' : validationResult.valid ? 'inherit' : '#ffebee',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
      title={!validationResult.valid ? validationResult.message : ''}
    >
      {value || <span style={{ color: '#bdbdbd', fontStyle: 'italic' }}>Empty</span>}
    </Box>
  );
};

const PropertiesEditor = () => {
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const { editorData, languages, loading, updateCellValue } = useProperties();
  const [columnDefs, setColumnDefs] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  
  // Handle grid ready event to get API reference
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
  }, []);

  // Set up column definitions based on languages
  useEffect(() => {
    console.log('Languages:', languages);
    console.log('Editor data:', editorData);
    
    if (languages.length === 0) {
      console.log('No languages detected, redirecting to home');
      navigate('/');
      return;
    }

    const cols = [
      { 
        field: 'key', 
        headerName: 'Key', 
        pinned: 'left',
        minWidth: 250,
        filter: true,
        sortable: true,
        resizable: true,
        lockPosition: true
      },
      ...languages.map(language => ({
        field: language,
        headerName: language,
        editable: true,
        cellEditor: TranslationCellEditor,
        cellRenderer: TranslationCellRenderer,
        minWidth: 300,
        filter: true,
        sortable: true,
        resizable: true,
        onCellValueChanged: (params) => {
          updateCellValue(params.data.key, language, params.newValue);
        }
      }))
    ];
    
    setColumnDefs(cols);
  }, [languages, navigate, updateCellValue]);

  // Auto-resize columns to fit available space and update data
  useEffect(() => {
    if (gridApi) {
      console.log('Grid API available, setting data');
      gridApi.setRowData(editorData);
      
      const resizeCallback = () => {
        setTimeout(() => {
          gridApi.sizeColumnsToFit();
        }, 0);
      };
      
      // Initial sizing
      resizeCallback();
      
      window.addEventListener('resize', resizeCallback);
      return () => window.removeEventListener('resize', resizeCallback);
    }
  }, [gridApi, editorData]);

  // Default column definitions for all columns
  const defaultColDef = {
    flex: 1,
    wrapText: true,
    autoHeight: true,
    cellStyle: { wordBreak: 'break-word' }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 'calc(100vh - 64px)' 
        }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading properties files...
        </Typography>
      </Box>
    );
  }

  // For debugging
  console.log('Current state in render:', { languages, editorData, columnDefs });

  return (
    <Box 
      className="ag-theme-alpine" 
      sx={{ 
        height: 'calc(100vh - 64px)', 
        width: '100%',
        '& .ag-header': {
          fontWeight: 'bold'
        },
        '& .ag-row-hover': {
          backgroundColor: '#f5f5f5'
        }
      }}
    >
      {editorData.length > 0 ? (
        <AgGridReact
          ref={gridRef}
          rowData={editorData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          rowHeight={60}
          enableCellTextSelection
          ensureDomOrder
          suppressRowClickSelection
          domLayout={'autoHeight'}
          animateRows={true}
          pagination={false}
          debug={true}
          tabToNextCell={(params) => {
            return params.nextCellPosition;
          }}
        />
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No data available</Typography>
          <Typography variant="body2">
            Please upload .properties files or load sample files from the home page.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PropertiesEditor;
