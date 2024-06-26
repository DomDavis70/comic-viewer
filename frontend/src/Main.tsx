import React, { useEffect, useState } from 'react';
import './Main.css';
import Nav from './Nav';

const Main = () => {

  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  interface Volume {
    id: number;
    name: string;
    publisher: string;
    image: string;
  }

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/volumes`)
      .then(response => response.json())
      .then(data => {
        if (data.results) {
          const formattedData: Volume[] = data.results.map((result: any) => ({
            id: result.id,
            name: result.name,
            publisher: result.publisher.name,
            image: result.image.small_url
          }));
          setVolumes(formattedData);
        }
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Logic for displaying volumes
  const indexOfLastVolume = currentPage * itemsPerPage;
  const indexOfFirstVolume = indexOfLastVolume - itemsPerPage;
  const currentVolumes = volumes.slice(indexOfFirstVolume, indexOfLastVolume);

  // Logic for displaying page numbers
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(volumes.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    setCurrentPage(Number(event.currentTarget.id));
  };

  const renderPageNumbers = pageNumbers.map(number => (
    <li
      key={number}
      id={number.toString()}
      onClick={handleClick}
      className={`page-item ${currentPage === number ? 'active' : ''}`}
    >
      <span className="page-link">{number}</span>
    </li>
  ));

  return (
    <div className="container">
      <Nav/>
      <div className="row">
        {currentVolumes.map(volume => (
          <div key={volume.id} className="col-md-4 mb-4">
            <div className="card">
              <img src={volume.image} alt={volume.name} className="card-img-top" />
              <div className="card-body">
                <h5 className="card-title">{volume.name}</h5>
                <p className="card-text">{volume.publisher}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ul className="pagination justify-content-center">
        {renderPageNumbers}
      </ul>
    </div>
  );
};

export default Main;
