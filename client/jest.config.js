module.exports = {
    testEnvironment: 'jsdom', // Simulate browser environment
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], // Run setup file
    moduleNameMapper: {
      // Handle CSS Modules or other non-JS imports if necessary
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest', // Make sure babel-jest is installed if not using Vite/CRA defaults
    },
  };