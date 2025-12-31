const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // <-- SOLO UNA VEZ aquí

const app = express();
const PORT = process.env.PORT || 5000;

// Después de const app = express();
app.use(cors({
    origin: ['https://images.exatronclouds.com', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Middleware
app.use(cors());
app.use(express.json());

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
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

// Función para generar URL correcta
const generateImageUrl = (req, filename) => {
    // Si estamos en producción y tenemos un dominio específico
    if (process.env.NODE_ENV === 'production') {
        return `https://images.exatronclouds.com/uploads/${filename}`;
    }
    // Para desarrollo local
    return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

// Servir archivos estáticos DESPUÉS de crear la carpeta
app.use('/uploads', express.static(uploadsDir));

// Ruta para subir una imagen
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const imageUrl = generateImageUrl(req, req.file.filename);
        
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
            url: generateImageUrl(req, file.filename),
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
                    url: generateImageUrl(req, file),
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
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        domain: 'https://images.exatronclouds.com'
    });
});

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS (Frontend)
// ============================================

// Servir archivos estáticos del frontend si existe la carpeta
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    
    // Ruta para el frontend
    app.get('/', (req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'));
    });

    // Ruta para la aplicación React
    app.get('/app*', (req, res) => {
        res.sendFile(path.join(publicDir, 'index.html'));
    });
} else {
    // Si no hay frontend, mostrar mensaje
    app.get('/', (req, res) => {
        res.json({
            message: 'API de subida de imágenes funcionando',
            endpoints: {
                upload: 'POST /api/upload',
                uploadMultiple: 'POST /api/upload-multiple',
                getImages: 'GET /api/images',
                deleteImage: 'DELETE /api/image/:filename',
                health: 'GET /api/health'
            },
            docs: 'https://github.com/amellitodev/mi-app-imagenes'
        });
    });
}

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Algo salió mal',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const startServer = () => {
    try {
        app.listen(PORT, '0.0.0.0', () => {
            console.log('✅ Servidor iniciado exitosamente');
            console.log(`📡 Puerto: ${PORT}`);
            console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📁 Uploads: /uploads/`);
            console.log(`🏠 Frontend: ${fs.existsSync(publicDir) ? 'Sí' : 'No'}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();