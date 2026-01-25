import React from 'react';

const FitnessForest = () => {
  return (
    <div className="w-full h-full p-4 bg-white">
      <div 
        style={{
          position: 'relative', 
          width: '100%', 
          height: '0', 
          paddingTop: '56.2225%', 
          paddingBottom: '0', 
          boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)', 
          marginTop: '1.6em', 
          marginBottom: '0.9em', 
          overflow: 'hidden', 
          borderRadius: '8px', 
          willChange: 'transform'
        }}
      >
        <iframe 
          loading="lazy" 
          style={{
            position: 'absolute', 
            width: '100%', 
            height: '100%', 
            top: '0', 
            left: '0', 
            border: 'none', 
            padding: '0', 
            margin: '0'
          }}
          src="https://www.canva.com/design/DAGyFY29QTo/OLieFO6XQxwMzrwqjTN-bQ/view?embed" 
          allowFullScreen={true} 
          title="F11 Fitness Forest"
        >
        </iframe>
      </div>
      <a 
        href="https://www.canva.com/design/DAGyFY29QTo/OLieFO6XQxwMzrwqjTN-bQ/view?utm_content=DAGyFY29QTo&utm_campaign=designshare&utm_medium=embeds&utm_source=link" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline mt-2 block"
      >
        Open in Canva
      </a>
    </div>
  );
};

export default FitnessForest;
