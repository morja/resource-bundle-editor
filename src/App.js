import React, { useState, useEffect, useRef } from 'react';
import { AppBar, Toolbar, Typography, Box, Container, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SortIcon from '@mui/icons-material/Sort';
import JSZip from 'jszip';
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
  
  // Delete a row by key
  const handleDeleteRow = (key) => {
    setRowData(prevData => prevData.filter(row => row.key !== key));
  };
  
  // Add a new row
  const handleAddRow = () => {
    // Generate a unique key with timestamp
    const newKey = `new.key.${Date.now()}`;
    
    // Create a new row with empty values for all languages
    const newRow = { key: newKey };
    languages.forEach(lang => {
      newRow[lang] = '';
    });
    
    // Add the new row to the data
    setRowData(prevData => [...prevData, newRow]);
    
    // Start editing the key of the new row
    setTimeout(() => {
      setEditingCell({ key: newKey, field: 'key' });
    }, 100);
  };
  
  // Sort rows alphabetically by key
  const sortRowsAlphabetically = () => {
    setRowData(prevData => [...prevData].sort((a, b) => a.key.localeCompare(b.key)));
  };
  
  // Start editing a cell
  const startEditing = (key, language) => {
    setEditingCell({ key, language, field: 'value' });
  };
  
  // Start editing a key
  const startEditingKey = (key) => {
    setEditingCell({ key, field: 'key' });
  };
  
  // Handle key navigation with tab
  const handleKeyDown = (event, key, language) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      
      if (editingCell.field === 'key') {
        // If editing a key, move to the first language cell
        if (languages.length > 0) {
          setEditingCell({ key, language: languages[0], field: 'value' });
        }
        return;
      }
      
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
      setEditingCell({ key: nextKey, language: nextLanguage, field: 'value' });
    }
  };
  
  // Handle key changes
  const handleKeyChange = (oldKey, newKey) => {
    if (oldKey === newKey) {
      return;
    }
    
    // Check if the new key already exists
    if (rowData.some(row => row.key === newKey)) {
      alert(`Key '${newKey}' already exists. Please choose a different key.`);
      return;
    }
    
    // Update the key in rowData
    setRowData(prevData => 
      prevData.map(row => 
        row.key === oldKey ? { ...row, key: newKey } : row
      )
    );
  };

  // Render a cell with appropriate styling and editing capability
  const renderCell = (row, language) => {
    const isEditing = editingCell && editingCell.key === row.key && editingCell.language === language && editingCell.field === 'value';
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
          InputProps={{
            style: { 
              fontSize: '0.875rem',
              padding: '2px 4px',
              height: '24px'
            }
          }}
          sx={{ m: 0 }}
        />
      );
    }
    
    return (
      <Box 
        onClick={() => startEditing(row.key, language)}
        sx={{
          bgcolor: isEmpty ? '#fff8e1' : 'transparent',
          p: 0.5,
          minHeight: '24px',
          width: '100%',
          cursor: 'pointer',
          fontSize: '0.875rem',
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
  
  // Render a key cell with editing capability
  const renderKeyCell = (row) => {
    const isEditing = editingCell && editingCell.key === row.key && editingCell.field === 'key';
    
    if (isEditing) {
      return (
        <TextField
          fullWidth
          variant="standard"
          autoFocus
          value={row.key}
          onChange={(e) => handleKeyChange(row.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => handleKeyDown(e, row.key)}
          size="small"
          InputProps={{
            style: { 
              fontSize: '0.875rem',
              padding: '2px 4px',
              height: '24px',
              fontWeight: 'bold'
            }
          }}
          sx={{ m: 0 }}
        />
      );
    }
    
    return (
      <Box 
        onClick={() => startEditingKey(row.key)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0.5,
          minHeight: '24px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          '&:hover': { bgcolor: '#f5f5f5' },
          width: '100%'
        }}
      >
        {row.key}
      </Box>
    );
  };

  // Function to download individual language files
  // eslint-disable-next-line no-unused-vars
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
  
  // Function to download all language files as a zip
  const downloadAllFiles = async () => {
    if (languages.length === 0 || rowData.length === 0) return;
    
    try {
      // Create a new JSZip instance
      const zip = new JSZip();
      
      // Add each language file to the zip
      languages.forEach(language => {
        // Create the file content
        const fileContent = rowData.map(row => {
          return `${row.key}=${row[language] || ''}`;
        }).join('\n');
        
        // Add the file to the zip
        zip.file(`${language}.properties`, fileContent);
      });
      
      // Generate the zip file
      const zipContent = await zip.generateAsync({ type: 'blob' });
      
      // Create download link and trigger download
      const url = URL.createObjectURL(zipContent);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'properties-files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try downloading files individually.');
    }
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
          
          {languages.length > 0 && (
            <>
              <Button
                color="primary"
                variant="contained"
                onClick={downloadAllFiles}
                sx={{ mr: 2 }}
              >
                Download All
              </Button>
              
              <Button
                color="secondary"
                variant="contained"
                startIcon={<SortIcon />}
                onClick={sortRowsAlphabetically}
                sx={{ mr: 2 }}
              >
                Sort Keys
              </Button>
            </>
          )}
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
                      minWidth: '200px',
                      padding: '6px 8px',
                      fontSize: '0.875rem'
                    }}
                  >
                    Key
                  </TableCell>
                  {languages.map(lang => (
                    <TableCell key={lang} sx={{ 
                      fontWeight: 'bold', 
                      minWidth: '200px',
                      padding: '6px 8px',
                      fontSize: '0.875rem'
                    }}>
                      {lang}
                    </TableCell>
                  ))}
                  <TableCell 
                    sx={{ 
                      width: '50px',
                      padding: '6px 8px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  >
                    Actions
                  </TableCell>
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
                        borderRight: '1px solid #ddd',
                        padding: '0',
                        fontSize: '0.875rem'
                      }}
                    >
                      {renderKeyCell(row)}
                    </TableCell>
                    {languages.map(lang => (
                      <TableCell key={`${row.key}-${lang}`} sx={{ padding: '0' }}>
                        {renderCell(row, lang)}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ padding: '0' }}>
                      <Tooltip title="Delete Row">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteRow(row.key)}
                          sx={{ padding: '4px' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell colSpan={languages.length + 2} align="center" sx={{ padding: '8px' }}>
                    <Button
                      startIcon={<AddIcon />}
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleAddRow}
                    >
                      Add Row
                    </Button>
                  </TableCell>
                </TableRow>
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
