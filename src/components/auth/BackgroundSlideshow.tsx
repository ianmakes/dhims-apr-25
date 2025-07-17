
import { useState, useEffect } from 'react';

const natureImages = [
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=1920&q=80', // deer in forest
  'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=1920&q=80', // river between mountains
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1920&q=80', // pine trees
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1920&q=80', // trees from low angle
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1920&q=80', // sunlight through trees
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80', // mountain landscape
];

export function BackgroundSlideshow() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % natureImages.length);
    }, 10000); // Change image every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {natureImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[3000ms] ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url('${image}')`
          }}
        />
      ))}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
    </div>
  );
}
