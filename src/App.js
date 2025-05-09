import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AppBar, Toolbar, Typography, Box, Container, TextField, Button } from '@mui/material';
import './App.css';

function App() {
  const gridRef = useRef();
  const fileInputRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [languages, setLanguages] = useState([]);

  // Process uploaded properties files
  const processFiles = (files) => {
    console.log('Processing files:', files);
    if (!files || files.length === 0) return;
    
    const uploadedLanguages = [];
    const allTranslations = {};
    const allKeys = new Set();
    
    // Process each file and read its contents
    Promise.all(Array.from(files).map(file => {
      // Extract language from filename (remove .properties extension)
      const lang = file.name.replace('.properties', '');
      uploadedLanguages.push(lang);
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const translations = {};
          
          // Parse .properties file content
          content.split('\n').forEach(line => {
            // Skip comments and empty lines
            if (line.trim().startsWith('#') || line.trim().startsWith('!') || !line.trim()) {
              return;
            }
            
            // Parse key=value pairs
            const separatorIndex = line.indexOf('=');
            if (separatorIndex !== -1) {
              const key = line.substring(0, separatorIndex).trim();
              const value = line.substring(separatorIndex + 1).trim();
              translations[key] = value;
              allKeys.add(key);
            }
          });
          
          allTranslations[lang] = translations;
          resolve();
        };
        reader.readAsText(file);
      });
    })).then(() => {
      // Update state
      setLanguages(uploadedLanguages);
      
      // Create row data for grid
      const data = Array.from(allKeys).sort().map(key => {
        const row = { key };
        uploadedLanguages.forEach(lang => {
          row[lang] = allTranslations[lang][key] || '';
        });
        return row;
      });
      
      // Create column definitions
      const cols = [
        { 
          field: 'key', 
          headerName: 'Key', 
          pinned: 'left',
          width: 250,
          filter: true,
          sortable: true,
          resizable: true,
          lockPosition: true
        },
        ...uploadedLanguages.map(lang => ({
          field: lang,
          headerName: lang,
          editable: true,
          width: 300,
          cellRenderer: TranslationCellRenderer,
          cellEditor: 'agTextCellEditor',
          filter: true,
          sortable: true,
          resizable: true
        }))
      ];
      
      setRowData(data);
      setColumnDefs(cols);
      console.log('Data updated with imported files:', data);
    });
  };
  
  // Handle file upload button click
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };
  
  // Initialize with empty state - wait for file uploads
  useEffect(() => {
    // Initialize empty state
    setLanguages([]);
    setRowData([]);
    
    // Create basic column definition with just the key column
    const cols = [
      { 
        field: 'key', 
        headerName: 'Key', 
        pinned: 'left',
        width: 250,
        filter: true,
        sortable: true,
        resizable: true,
        lockPosition: true
      }
    ];
    
    setColumnDefs(cols);
    console.log('App initialized with empty state');
  }, []);

  // Cell renderer for displaying translations with validation
  const TranslationCellRenderer = (props) => {
    const value = props.value || '';
    const isEmpty = value === '';
    
    return (
      <div style={{ 
        padding: '8px', 
        height: '100%', 
        width: '100%',
        backgroundColor: isEmpty ? '#fff8e1' : 'inherit', 
        display: 'flex',
        alignItems: 'center'
      }}>
        {isEmpty ? 
          <span style={{ color: '#bdbdbd', fontStyle: 'italic' }}>Empty</span> : 
          value
        }
      </div>
    );
  };

  // Custom cell editor component for AG Grid
  class TranslationCellEditor {
    // Required by AG Grid
    init(params) {
      this.params = params;
      this.value = params.value || '';
      
      // Create the cell
      this.eInput = document.createElement('input');
      this.eInput.classList.add('ag-input-field-input');
      this.eInput.style.height = '100%';
      this.eInput.style.width = '100%';
      this.eInput.style.padding = '5px';
      this.eInput.value = this.value;
      
      // Add event listeners
      this.eInput.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
          params.stopEditing();
        }
      });
    }
    
    // Required by AG Grid - returns the DOM element
    getGui() {
      return this.eInput;
    }
    
    // Required by AG Grid - returns the current value
    getValue() {
      return this.eInput.value;
    }
    
    // Required by AG Grid - focus the editor
    afterGuiAttached() {
      this.eInput.focus();
    }
  }
  
  // Legacy React-based cell editor component - keeping for reference
  const ReactTranslationCellEditor = (props) => {
    const [value, setValue] = useState(props.value || '');
    const [suggestedValue, setSuggestedValue] = useState('');
    const inputRef = useRef(null);
    
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);
    
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        props.stopEditing();
      }
    };
    
    const handleChange = (event) => {
      setValue(event.target.value);
    };
    
    // Suggest translation (simplified example)
    const suggestTranslation = () => {
      // Get value from another language column as suggestion
      // In real app, this would call a translation API
      const rowData = props.node.data;
      const currentLang = props.column.colId;
      
      // Find a non-empty value from another language
      const otherLangs = Object.keys(rowData).filter(key => 
        key !== 'key' && key !== currentLang && rowData[key]
      );
      
      if (otherLangs.length > 0) {
        const sourceLang = otherLangs[0];
        setSuggestedValue(rowData[sourceLang]);
      }
    };
    
    const applySuggestion = () => {
      if (suggestedValue) {
        setValue(suggestedValue);
      }
    };
    
    // This is required by AG Grid
    const getValue = () => {
      return value;
    };
    
    return (
      <div style={{ padding: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <TextField
          inputRef={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          variant="outlined"
          fullWidth
          size="small"
          multiline
        />
        
        <div style={{ display: 'flex', gap: '5px' }}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={suggestTranslation}
          >
            Suggest
          </Button>
          
          {suggestedValue && (
            <Button 
              size="small" 
              variant="contained" 
              onClick={applySuggestion}
            >
              Use: {suggestedValue.substring(0, 15)}{suggestedValue.length > 15 ? '...' : ''}
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Handle grid ready event
  const onGridReady = (params) => {
    setGridApi(params.api);
    
    // Instead of using sizeColumnsToFit, we'll manually ensure columns have appropriate widths
    // This avoids needing additional modules
    
    // Simpler approach without using problematic APIs
    const updateGridSize = () => {
      if (params.api) {
        // Just force a small delay to let the grid initialize
        setTimeout(() => {
          // No API calls, just let the grid render naturally
          const gridElement = document.querySelector('.ag-theme-alpine');
          if (gridElement) {
            gridElement.style.height = 'calc(100vh - 80px)';
          }
        }, 0);
      }
    };
    
    updateGridSize();
    window.addEventListener('resize', updateGridSize);
  };
  
  // Handle cell value changes
  const onCellValueChanged = (params) => {
    console.log('Cell value changed:', params.newValue);
    // In a real app, you would save this to the properties file
  };

  // Function to download files
  const downloadPropertiesFile = (language) => {
    // Get all data for this language
    const fileContent = rowData.map(row => {
      return `${row.key}=${row[language] || ''}`;
    }).join('\n');
    
    // Create and trigger download
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${language}.properties`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const defaultColDef = {
    flex: 1,
    minWidth: 150,
    resizable: true,
    sortable: true,
    filter: true,
    editable: true  // Make sure all columns are editable by default
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Properties Editor
          </Typography>
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept=".properties"
            onChange={handleFileUpload}
          />
          
          <Button
            color="inherit"
            onClick={() => fileInputRef.current.click()}
            sx={{ mr: 2 }}
          >
            Upload Files
          </Button>
          
          {languages.length > 0 && languages.map(language => (
            <Button
              key={language}
              color="inherit"
              onClick={() => downloadPropertiesFile(language)}
              sx={{ mr: 1 }}
            >
              {language}.properties
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth={false} sx={{ mt: 2, height: 'calc(100vh - 80px)' }}>
        <Box 
          className="ag-theme-alpine" 
          sx={{ 
            height: '100%', 
            width: '100%'
          }}
        >
          <AgGridReact
            ref={gridRef}
            modules={[ClientSideRowModelModule]}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowHeight={60}
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            singleClickEdit={true}
            enableCellTextSelection
            ensureDomOrder
            suppressRowClickSelection
            tabToNextCell={(params) => params.nextCellPosition}
          />
        </Box>
      </Container>
    </div>
  );
}

export default App;
