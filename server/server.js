const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.resolve('./uploads'); 
const CHATPDF_API_KEY = 'process.env.CHATPDF_API'; 
const CHATPDF_API_URL = 'https://api.chatpdf.com/v1';

// Enable CORS
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const sourceId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const filename = `${sourceId}-document.pdf`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFile(filePath, req.file.buffer, async (writeError) => {
      if (writeError) {
        console.error(writeError);
        return res.status(500).json({ error: 'Failed to save the PDF file.' });
      }

      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const options = {
          headers: {
            'x-api-key': CHATPDF_API_KEY,
            ...formData.getHeaders(),
          },
        };

        const chatPdfResponse = await axios.post(`${CHATPDF_API_URL}/sources/add-file`, formData, options);

        const chatPdfSourceId = chatPdfResponse.data.sourceId;

        res.json({ chatPdfSourceId, yourSourceId: sourceId });
      } catch (uploadError) {
        console.error('ChatPDF API Upload Error:', uploadError.response?.status, uploadError.response?.data);
        res.status(500).json({ error: 'Failed to upload PDF to ChatPDF.' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/pdf/:sourceId', (req, res) => {
  const sourceId = req.params.sourceId;

  const filePath = path.resolve(UPLOAD_DIR, `${sourceId}-document.pdf`); // Use path.resolve for an absolute path

  res.sendFile(filePath);
});

app.post('/chats', async (req, res) => {
  try {
    const { chatPdfSourceId, query } = req.body;

    const data = {
      sourceId: chatPdfSourceId,
      messages: [
        {
          "role": "user",
          "content": query,
        },
      ],
    };

    const chatPdfResponse = await axios.post(`${CHATPDF_API_URL}/chats/message`, data, {
      headers: {
        'x-api-key': CHATPDF_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const generatedText = chatPdfResponse.data.content; 
    res.json({ text: generatedText });
  } catch (error) {
    //console.error('ChatPDF API Error server:', error.response?.status, error.response?.data);
    res.status(500).json({ error: 'Failed to perform chat with ChatPDF.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
