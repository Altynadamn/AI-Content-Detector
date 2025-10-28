import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="py-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                AI News Verifier
            </h1>
            <p className="mt-2 text-lg text-gray-400">
                Paste any news article to check its authenticity and origin.
            </p>
        </header>
    );
};

export default Header;
