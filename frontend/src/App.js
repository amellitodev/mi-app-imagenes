import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaTrash, FaImage, FaLink, FaCopy } from 'react-icons/fa';
import './App.css';

// Configuración de Axios (ajusta la URL según tu despliegue)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Obtener todas las imágenes al cargar el componente
    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/images`);
            setImages(response.data.images || []);
        } catch (error) {
            showMessage('error', 'Error al cargar las imágenes');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        onDrop: (acceptedFiles) => {
            setSelectedFiles(acceptedFiles);
        }
    });

    const uploadImages = async () => {
        if (selectedFiles.length === 0) {
            showMessage('error', 'Por favor, selecciona al menos una imagen');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await axios.post(`${API_URL}/api/upload-multiple`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            });

            showMessage('success', `¡${response.data.count} imagen(es) subida(s) exitosamente!`);
            setSelectedFiles([]);
            fetchImages();
        } catch (error) {
            showMessage('error', error.response?.data?.error || 'Error al subir las imágenes');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const deleteImage = async (filename) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return;

        try {
            await axios.delete(`${API_URL}/api/image/${filename}`);
            showMessage('success', 'Imagen eliminada exitosamente');
            fetchImages();
        } catch (error) {
            showMessage('error', 'Error al eliminar la imagen');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => showMessage('success', 'URL copiada al portapapeles'))
            .catch(() => showMessage('error', 'Error al copiar la URL'));
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1><FaImage /> Subidor de Imágenes</h1>
                <p>Sube y gestiona tus imágenes fácilmente</p>
            </header>

            <main className="app-main">
                {/* Área de subida */}
                <section className="upload-section">
                    <div 
                        {...getRootProps()} 
                        className={`dropzone ${isDragActive ? 'active' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <FaUpload className="upload-icon" />
                        <p>
                            {isDragActive
                                ? 'Suelta las imágenes aquí...'
                                : 'Arrastra y suelta imágenes aquí, o haz clic para seleccionar'
                            }
                        </p>
                        <p className="file-types">(JPEG, PNG, GIF, WebP - Máx. 10MB por imagen)</p>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="selected-files">
                            <h3>Archivos seleccionados ({selectedFiles.length})</h3>
                            <ul>
                                {selectedFiles.map((file, index) => (
                                    <li key={index}>
                                        <span>{file.name}</span>
                                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={uploadImages}
                        disabled={uploading || selectedFiles.length === 0}
                        className="upload-button"
                    >
                        {uploading ? (
                            <>
                                Subiendo... {uploadProgress}%
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </>
                        ) : (
                            <>Subir Imágenes</>
                        )}
                    </button>
                </section>

                {/* Mensajes */}
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Galería de imágenes */}
                <section className="gallery-section">
                    <h2>Galería de Imágenes ({images.length})</h2>
                    
                    {images.length === 0 ? (
                        <div className="empty-gallery">
                            <p>No hay imágenes subidas todavía</p>
                        </div>
                    ) : (
                        <div className="image-grid">
                            {images.map((image, index) => (
                                <div key={index} className="image-card">
                                    <div className="image-container">
                                        <img 
                                            src={image.url} 
                                            alt={image.filename}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/300x200?text=Error+loading+image';
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="image-info">
                                        <p className="filename">{image.filename}</p>
                                        
                                        <div className="url-container">
                                            <FaLink />
                                            <input 
                                                type="text" 
                                                value={image.url} 
                                                readOnly 
                                                className="url-input"
                                            />
                                            <button 
                                                onClick={() => copyToClipboard(image.url)}
                                                className="copy-button"
                                                title="Copiar URL"
                                            >
                                                <FaCopy />
                                            </button>
                                        </div>
                                        
                                        <button 
                                            onClick={() => deleteImage(image.filename)}
                                            className="delete-button"
                                            title="Eliminar imagen"
                                        >
                                            <FaTrash /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <footer className="app-footer">
                <p>© {new Date().getFullYear()} - Subidor de Imágenes</p>
                <p className="server-status">
                    Estado del servidor: <span className="status-indicator">●</span> Conectado
                </p>
            </footer>
        </div>
    );
}

export default App;