const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Crear carpeta uploads si no existe
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Ruta para subir una imagen
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Imagen subida exitosamente',
            filename: req.file.filename,
            url: imageUrl,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para subir múltiples imágenes
app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se subieron imágenes' });
        }

        const uploadedImages = req.files.map(file => ({
            filename: file.filename,
            url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        }));

        res.json({
            success: true,
            message: 'Imágenes subidas exitosamente',
            images: uploadedImages,
            count: uploadedImages.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener todas las imágenes
app.get('/api/images', (req, res) => {
    try {
        fs.readdir(uploadsDir, (err, files) => {
            if (err) {
                return res.status(500).json({ error: 'Error al leer las imágenes' });
            }

            const images = files
                .filter(file => /\.(jpe?g|png|gif|webp)$/i.test(file))
                .map(file => ({
                    filename: file,
                    url: `${req.protocol}://${req.get('host')}/uploads/${file}`,
                    path: `/uploads/${file}`
                }));

            res.json({
                success: true,
                count: images.length,
                images: images
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para eliminar una imagen
app.delete('/api/image/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }

        fs.unlinkSync(filePath);
        res.json({
            success: true,
            message: 'Imagen eliminada exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor de imágenes funcionando',
        timestamp: new Date().toISOString()
    });
});

// Agrega ESTO al final, ANTES de app.listen():
// ============================================
// SERVIR FRONTEND REACT (solo en producción)
// ============================================
if (process.env.NODE_ENV === 'production') {
    // Servir archivos estáticos del frontend
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    
    // Para cualquier ruta no manejada por la API, servir el index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
}
// ============================================

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`Acceso a imágenes: http://localhost:${PORT}/uploads/`);
});