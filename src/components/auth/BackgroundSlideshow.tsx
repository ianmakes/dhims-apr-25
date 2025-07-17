
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
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentImageIndex(nextImageIndex);
        setNextImageIndex((nextImageIndex + 1) % natureImages.length);
        setIsTransitioning(false);
      }, 1000); // Half of transition time
    }, 6000); // Change image every 6 seconds

    return () => clearInterval(interval);
  }, [nextImageIndex]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Current Image */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          backgroundImage: `url('${natureImages[currentImageIndex]}')`
        }}
      />
      
      {/* Next Image (for smooth transition) */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000 ${
          isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url('${natureImages[nextImageIndex]}')`
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
    </div>
  );
}
