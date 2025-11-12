import React from 'react';

interface SCLoaderProps {
  diameter: number;
  lineWidth: number;
  spinTime: string;
  text?: string;
  textPosition?: 'left' | 'right';
  textClass?: string;
  container?: string;
}

const SCLoader: React.FC<SCLoaderProps> = ({
  diameter,
  lineWidth,
  spinTime = '2s',
  text,
  textPosition,
  textClass,
  container,
}) => {
  const loaderStyle = {
    width: `${diameter}px`,
    height: `${diameter}px`,
    borderWidth: `${lineWidth}px`,
    animation: `loader-spin ${spinTime} linear infinite`,
  };

  const wrapper = container ? document.querySelector(container) : null;
  const containerStyle: React.CSSProperties = {};

  if (wrapper && wrapper === document.body) {
    containerStyle.width = '100vw';
    containerStyle.height = '100vh';
  } else if (wrapper && wrapper !== document.body) {
    const computedStyle = window.getComputedStyle(wrapper);
    containerStyle.width = computedStyle.width ? parseFloat(computedStyle.width) : wrapper.clientWidth;
    containerStyle.height = computedStyle.height ? parseFloat(computedStyle.height) : wrapper.clientHeight;
  }

  const loaderText = <span className={textClass}>{text}</span>;
  const leftText = text && textPosition === 'left' ? loaderText : null;
  const rightText = text && textPosition === 'right' ? loaderText : null;

  return (
    <div className="sc-loader-container" style={containerStyle}>
      {leftText}
      <div style={loaderStyle} className="sc-loader" />
      {rightText}
    </div>
  );
};

export default SCLoader; 