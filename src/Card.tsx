import React from 'react';
import { CardData } from './types';

const Card: React.FC<CardData> = ({ title, description, image }) => {
  return (
    <div className="card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default Card;