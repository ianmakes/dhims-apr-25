
import React from "react";

interface GradeIndicatorProps {
  grade: string;
  color: string;
}

export const GradeIndicator: React.FC<GradeIndicatorProps> = ({ grade, color }) => {
  return (
    <div 
      className="text-xs font-medium px-2 py-1 rounded-full text-center w-8"
      style={{ 
        color: 'white', 
        backgroundColor: color 
      }}
    >
      {grade}
    </div>
  );
};
