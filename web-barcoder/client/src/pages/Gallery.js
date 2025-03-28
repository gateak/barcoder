import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/images');

      if (response.data.success) {
        setImages(response.data.images || []);
      } else {
        setError('Failed to load images');
        toast.error('Error loading images');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Error fetching images. Please try again.');
      toast.error('Error loading images');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle image deletion
  const deleteImage = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/images/${filename}`);

      if (response.data.success) {
        // Remove the deleted image from state
        setImages(images.filter(image => image.filename !== filename));
        toast.success('Image deleted successfully');
      } else {
        throw new Error(response.data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading images...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (images.length === 0) {
    return (
      <div className="gallery-empty">
        <h2>Image Gallery</h2>
        <p>No images have been captured yet.</p>
        <button
          className="btn btn-primary"
          onClick={() => fetchImages()}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <h2>Image Gallery</h2>

      <div className="gallery-controls">
        <button
          className="btn btn-primary"
          onClick={() => fetchImages()}
        >
          Refresh
        </button>
      </div>

      <div className="image-gallery">
        {images.map((image, index) => (
          <div key={index} className="image-item">
            <img
              src={`/api/images/${image.filename}`}
              alt={image.barcode || 'Captured image'}
            />
            <div className="image-caption">
              {image.barcode}
            </div>
            <div className="image-actions">
              <button
                className="btn btn-danger"
                onClick={() => deleteImage(image.filename)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
