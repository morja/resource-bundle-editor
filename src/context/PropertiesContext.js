import React, { createContext, useState, useContext } from 'react';

const PropertiesContext = createContext();

export const useProperties = () => useContext(PropertiesContext);

export const PropertiesProvider = ({ children }) => {
  const [propertiesFiles, setPropertiesFiles] = useState([]);
  const [keys, setKeys] = useState([]);
  const [editorData, setEditorData] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Parse a single .properties file
  const parsePropertiesFile = (content, language) => {
    const lines = content.split('\n');
    const properties = {};
    
    lines.forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim().startsWith('!') || !line.trim()) {
        return;
      }
      
      // Look for key-value pairs
      const separatorIndex = line.indexOf('=');
      if (separatorIndex !== -1) {
        const key = line.substring(0, separatorIndex).trim();
        const value = line.substring(separatorIndex + 1).trim();
        properties[key] = value;
      }
    });
    
    return { properties, language };
  };

  // Process uploaded properties files
  const processFiles = (filesArray) => {
    console.log('Processing files:', filesArray);
    setLoading(true);
    // Start with fresh arrays instead of appending to existing ones
    const newPropertiesFiles = [];
    const allKeys = new Set();
    const newLanguages = new Set();
    
    // Process each file and extract keys and values
    Promise.all(
      Array.from(filesArray).map((file) => {
        const language = file.name.replace('.properties', '');
        console.log('Processing language:', language);
        newLanguages.add(language);
        
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target.result;
            console.log(`Content for ${language}:`, content.substring(0, 100) + '...');
            const parsedFile = parsePropertiesFile(content, language);
            console.log(`Parsed ${language}:`, parsedFile);
            
            // Collect all keys
            Object.keys(parsedFile.properties).forEach(key => allKeys.add(key));
            newPropertiesFiles.push(parsedFile);
            
            resolve();
          };
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            resolve();
          };
          reader.readAsText(file);
        });
      })
    ).then(() => {
      // Update state with new data
      console.log('New properties files:', newPropertiesFiles);
      console.log('Languages detected:', [...newLanguages]);
      
      setPropertiesFiles(newPropertiesFiles);
      setLanguages([...newLanguages]);
      
      const keysList = [...allKeys].sort();
      console.log('Keys found:', keysList);
      setKeys(keysList);
      
      // Create grid data
      const gridData = keysList.map(key => {
        const row = { key };
        
        newLanguages.forEach(language => {
          const fileForLanguage = newPropertiesFiles.find(file => file.language === language);
          row[language] = fileForLanguage && fileForLanguage.properties[key] 
            ? fileForLanguage.properties[key] 
            : '';
        });
        
        return row;
      });
      
      console.log('Grid data created:', gridData);
      setEditorData(gridData);
      setLoading(false);
    });
  };

  // Update a cell value
  const updateCellValue = (key, language, newValue) => {
    // Update editorData
    setEditorData(prevData => 
      prevData.map(row => 
        row.key === key 
          ? { ...row, [language]: newValue } 
          : row
      )
    );
    
    // Update the actual properties file
    setPropertiesFiles(prevFiles => 
      prevFiles.map(file => {
        if (file.language === language) {
          return {
            ...file,
            properties: {
              ...file.properties,
              [key]: newValue
            }
          };
        }
        return file;
      })
    );
  };

  // Generate file contents for download
  const generateFileContent = (language) => {
    const file = propertiesFiles.find(f => f.language === language);
    if (!file) return '';
    
    let content = '';
    for (const key of keys) {
      const value = file.properties[key] || '';
      content += `${key}=${value}\n`;
    }
    
    return content;
  };

  // Suggest translations using simple patterns or external API
  const suggestTranslation = async (key, sourceLanguage, targetLanguage) => {
    // This is a placeholder - in a real app, you might use a translation API
    // For demo purposes, we'll just copy the source value
    const sourceValue = editorData.find(row => row.key === key)?.[sourceLanguage] || '';
    return sourceValue;
  };

  // Check if a translation makes sense (basic implementation)
  const checkTranslation = (key, language, value) => {
    // This is a placeholder - in a real app, you might use more sophisticated checks
    // Simple check: is the value empty when it shouldn't be?
    if (!value && keys.includes(key)) {
      return { valid: false, message: 'Missing translation' };
    }
    
    // Is the value suspiciously short or long compared to other languages?
    const row = editorData.find(r => r.key === key);
    if (row) {
      const otherLengths = languages
        .filter(lang => lang !== language && row[lang])
        .map(lang => row[lang].length);
        
      if (otherLengths.length > 0) {
        const avgLength = otherLengths.reduce((sum, len) => sum + len, 0) / otherLengths.length;
        if (value.length > 0 && (value.length < avgLength * 0.3 || value.length > avgLength * 3)) {
          return { valid: false, message: 'Translation length looks suspicious' };
        }
      }
    }
    
    return { valid: true };
  };

  const contextValue = {
    propertiesFiles,
    keys,
    editorData,
    languages,
    loading,
    processFiles,
    updateCellValue,
    generateFileContent,
    suggestTranslation,
    checkTranslation,
  };

  return (
    <PropertiesContext.Provider value={contextValue}>
      {children}
    </PropertiesContext.Provider>
  );
};
