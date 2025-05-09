import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box, Paper, Container, Divider } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from 'axios';
import { useProperties } from '../context/PropertiesContext';

const FileUploadForm = () => {
  const { processFiles } = useProperties();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
      navigate('/editor');
    }
  };

  const loadSampleFiles = () => {
    setIsLoading(true);
    try {
      // Create sample content directly
      const enContent = `app.title=Properties Editor
app.description=Edit multiple properties files side by side
button.save=Save
button.cancel=Cancel
button.upload=Upload
button.download=Download
placeholder.search=Search...
error.fileNotFound=File not found
error.invalidFormat=Invalid file format
message.success=Operation completed successfully
message.welcome=Welcome to the Properties Editor
message.help=Need help? Contact support
table.key=Key
table.value=Value
table.language=Language
dialog.title.confirmation=Confirmation
dialog.message.delete=Are you sure you want to delete this item?
sidebar.home=Home
sidebar.editor=Editor
sidebar.settings=Settings`;
      
      const deContent = `app.title=Eigenschaften-Editor
app.description=Bearbeiten Sie mehrere Eigenschaftendateien nebeneinander
button.save=Speichern
button.cancel=Abbrechen
button.upload=Hochladen
button.download=Herunterladen
placeholder.search=Suchen...
error.fileNotFound=Datei nicht gefunden
error.invalidFormat=Ungültiges Dateiformat
message.success=Vorgang erfolgreich abgeschlossen
message.welcome=Willkommen beim Eigenschaften-Editor
message.help=Brauchen Sie Hilfe? Kontaktieren Sie den Support
table.key=Schlüssel
table.value=Wert
table.language=Sprache
dialog.title.confirmation=Bestätigung
dialog.message.delete=Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?
sidebar.home=Startseite
sidebar.editor=Editor
sidebar.settings=Einstellungen`;
      
      const frContent = `app.title=Éditeur de propriétés
app.description=Modifiez plusieurs fichiers de propriétés côte à côte
button.save=Enregistrer
button.cancel=Annuler
button.upload=Télécharger
button.download=Télécharger
placeholder.search=Rechercher...
error.fileNotFound=Fichier introuvable
error.invalidFormat=Format de fichier invalide
message.success=Opération terminée avec succès
message.welcome=Bienvenue dans l'éditeur de propriétés
message.help=Besoin d'aide? Contactez le support
table.key=Clé
table.value=Valeur
table.language=Langue
dialog.title.confirmation=Confirmation
dialog.message.delete=Êtes-vous sûr de vouloir supprimer cet élément?
sidebar.home=Accueil
sidebar.editor=Éditeur
sidebar.settings=Paramètres`;
      
      // Create file objects
      const enFile = new File([enContent], 'en.properties', { type: 'text/plain' });
      const deFile = new File([deContent], 'de.properties', { type: 'text/plain' });
      const frFile = new File([frContent], 'fr.properties', { type: 'text/plain' });
      
      const sampleFiles = [enFile, deFile, frFile];
      console.log('Loading sample files:', sampleFiles);
      
      processFiles(sampleFiles);
      navigate('/editor');
    } catch (error) {
      console.error('Error loading sample files:', error);
      alert('Could not load sample files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Properties File Editor
        </Typography>
        
        <Typography variant="body1" paragraph>
          Upload multiple .properties files to edit them side by side.
        </Typography>
        
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept=".properties"
            onChange={handleFileUpload}
          />
          
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            size="large"
            onClick={() => fileInputRef.current.click()}
          >
            Select .properties Files
          </Button>
          
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Select multiple .properties files (e.g., en.properties, de.properties, fr.properties)
          </Typography>
          
          <Divider sx={{ width: '100%', my: 2 }}>OR</Divider>
          
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeIcon />}
            size="large"
            onClick={loadSampleFiles}
            disabled={isLoading}
          >
            Load Sample Files
          </Button>
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Try the editor with pre-loaded sample files
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Features:
          </Typography>
          
          <ul style={{ textAlign: 'left' }}>
            <li>Edit multiple language files side by side</li>
            <li>Fixed keys column with scrollable language columns</li>
            <li>Inline cell editing</li>
            <li>Highlight missing translations</li>
            <li>Translation suggestions</li>
            <li>Tab navigation for quick editing</li>
            <li>Download updated files</li>
          </ul>
        </Box>
      </Paper>
    </Container>
  );
};

export default FileUploadForm;
