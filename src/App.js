import React, { useState, useEffect, useRef } from 'react';
import { AppBar, Toolbar, Typography, Box, Container, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField } from '@mui/material';
import './App.css';

function App() {
  const fileInputRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [editingCell, setEditingCell] = useState(null); // track which cell is being edited

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
      
      // Create row data for the table
      setRowData(data);
      // No need to set column definitions with our new table approach
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
    console.log('App initialized with empty state');
  }, []);
  
  // Handle cell editing
  const handleCellEdit = (key, language, newValue) => {
    setRowData(prevData => 
      prevData.map(row => 
        row.key === key ? { ...row, [language]: newValue } : row
      )
    );
  };
  
  // Start editing a cell
  const startEditing = (key, language) => {
    setEditingCell({ key, language });
  };
  
  // Handle key navigation with tab
  const handleKeyDown = (event, key, language) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const currentIndex = languages.indexOf(language);
      let nextLanguage;
      let nextKey = key;
      
      // If we're at the last language, move to the next key
      if (currentIndex === languages.length - 1) {
        const currentRowIndex = rowData.findIndex(row => row.key === key);
        if (currentRowIndex < rowData.length - 1) {
          nextLanguage = languages[0];
          nextKey = rowData[currentRowIndex + 1].key;
        } else {
          nextLanguage = languages[0];
        }
      } else {
        // Move to the next language in the same row
        nextLanguage = languages[currentIndex + 1];
      }
      
      // Move to the next cell
      setEditingCell({ key: nextKey, language: nextLanguage });
    }
  };

  // Render a cell with appropriate styling and editing capability
  const renderCell = (row, language) => {
    const isEditing = editingCell && editingCell.key === row.key && editingCell.language === language;
    const value = row[language] || '';
    const isEmpty = value === '';
    
    if (isEditing) {
      return (
        <TextField
          fullWidth
          variant="standard"
          autoFocus
          value={value}
          onChange={(e) => handleCellEdit(row.key, language, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => handleKeyDown(e, row.key, language)}
          size="small"
        />
      );
    }
    
    return (
      <Box 
        onClick={() => startEditing(row.key, language)}
        sx={{
          bgcolor: isEmpty ? '#fff8e1' : 'transparent',
          p: 1,
          minHeight: '36px',
          width: '100%',
          cursor: 'pointer',
          '&:hover': { bgcolor: '#f5f5f5' }
        }}
      >
        {isEmpty ? (
          <Typography variant="body2" sx={{ color: '#bdbdbd', fontStyle: 'italic' }}>
            Empty
          </Typography>
        ) : (
          value
        )}
      </Box>
    );
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
      
      <Container maxWidth={false} sx={{ mt: 2, height: 'calc(100vh - 80px)', overflow: 'auto' }}>
        {rowData.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 100px)' }}>
            <Table stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold', 
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      bgcolor: '#f5f5f5',
                      minWidth: '250px'
                    }}
                  >
                    Key
                  </TableCell>
                  {languages.map(lang => (
                    <TableCell key={lang} sx={{ fontWeight: 'bold', minWidth: '250px' }}>
                      {lang}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rowData.map(row => (
                  <TableRow key={row.key} hover>
                    <TableCell 
                      component="th" 
                      scope="row"
                      sx={{ 
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        bgcolor: 'white',
                        fontWeight: 'bold',
                        borderRight: '1px solid #ddd'
                      }}
                    >
                      {row.key}
                    </TableCell>
                    {languages.map(lang => (
                      <TableCell key={`${row.key}-${lang}`}>
                        {renderCell(row, lang)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">No data available</Typography>
            <Typography variant="body2">
              Please upload .properties files using the upload button above.
            </Typography>
          </Box>
        )}
      </Container>
    </div>
  );
}

export default App;
