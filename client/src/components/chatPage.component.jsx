import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, TextField, Button, Typography } from '@mui/material';

const ChatPage = () => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sID, setSID] = useState('');
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

    fetchChatHistory();
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const documentId = response.data.yourSourceId;
      setSID(response.data.chatPdfSourceId);
      setPdfUrl(`http://localhost:5000/pdf/${documentId}`);
 
      fetchChatHistory();
    } catch (error) {
      console.error(error);
    }
  };

  const handleQuerySubmit = async () => {
    try {
      const response = await axios.post('http://localhost:5000/chats', {
        chatPdfSourceId: sID,
        query,
      });

      setChatHistory([
        ...chatHistory,
        { role: 'user', content: query },
        { role: 'chatpdf', content: response.data.text },
      ]);

      setQuery('');
    } catch (error) {
      console.error("chat error", error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      if (sID) {
        const response = await axios.get(`http://localhost:5000/chats/history/${sID}`);
        setChatHistory(response.data.chatHistory);
      }
    } catch (error) {
      console.error("Error fetching chat history", error);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', p: 2 }}>
        <Box sx={{ width: '50%', height: '80vh', overflow: 'auto' }}>
          {pdfUrl && (
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
              {Array.from(new Array(numPages), (el, index) => (
                <Page key={`page_${index + 1}`} pageNumber={index + 1} />
              ))}
            </Document>
          )}
        </Box>
        <Box sx={{ width: '50%', height: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', }}>
          <Typography variant="h6">Chat with PDF:</Typography>
          <Box sx={{ flex: 1, display: 'block', marginBottom: 2 }}>
            {chatHistory.map((chat, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: chat.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  marginBottom: 1,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: chat.role === 'user' ? '#DCF8C6' : '#E8E8E8',
                    padding: 1,
                    borderRadius: '8px',
                    maxWidth: '70%',
                  }}
                >
                  <Typography variant="body1">{chat.content}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', p: 2 }}>
        <Box sx={{ width: '50%', marginTop: 2, alignItems: 'center'}}>
          <Typography variant="h6">Upload PDF:</Typography>
          <input type="file" onChange={handleFileChange} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between',width: '50%', alignItems: 'center', marginTop: 2 }}>
        <TextField
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your question..."
          sx={{maxWidth: 750,}}
        />
        <Button variant="contained" onClick={handleQuerySubmit} sx={{ marginLeft: 1, fontSize: 20, boxShadow: 1,
          borderRadius: 2, padding: "10px 30px" }}>
          Ask
        </Button>
      </Box>
      </Box>
    </Box>
  );
}

export default ChatPage;
