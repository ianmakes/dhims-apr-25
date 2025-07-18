
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
    }, 15000); // Increased to 15 seconds for more natural viewing

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background Images */}
      {natureImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[4000ms] ease-in-out ${
            index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{
            backgroundImage: `url('${image}')`,
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      ))}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      
      {/* Navigation Dots */}
      <div className="absolute top-8 right-8 flex space-x-2 z-20">
        {natureImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
              index === currentImageIndex 
                ? 'bg-white/80 scale-125' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
