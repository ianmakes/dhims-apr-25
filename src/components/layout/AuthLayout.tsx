
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-col items-center justify-center w-full">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default AuthLayout;
