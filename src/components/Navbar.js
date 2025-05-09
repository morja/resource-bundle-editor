import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useProperties } from '../context/PropertiesContext';

const Navbar = () => {
  const { languages, generateFileContent } = useProperties();

  // Handle file download
  const handleDownload = (language) => {
    const content = generateFileContent(language);
    const blob = new Blob([content], { type: 'text/plain' });
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
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            Properties Editor
          </Link>
        </Typography>
        
        {languages.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {languages.map(language => (
              <Button 
                key={language} 
                color="inherit" 
                onClick={() => handleDownload(language)}
              >
                Download {language}
              </Button>
            ))}
            <Button 
              color="inherit" 
              component={Link} 
              to="/editor"
            >
              Editor
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
