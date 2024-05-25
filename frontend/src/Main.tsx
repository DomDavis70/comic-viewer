import React, { useEffect, useState } from 'react'

const Main = () => {

  const [volumes, setVolumes] = useState<Volume[]>([]);

  interface Volume {
    id: number;
    name: string;
    start_year: string;
    image: string;
  }
  const apiKey = process.env.REACT_APP_API_KEY;

  useEffect(() => {
    fetch(`https://cors-anywhere.herokuapp.com/https://comicvine.gamespot.com/api/volumes/?api_key=${apiKey}&format=json&sort=name:asc&limit=10`)
      .then(response => response.json())
      .then(data => {
        if (data.results) {
          const formattedData = data.results.map((result: any) => ({
            id: result.id,
            name: result.name,
            start_year: result.start_year,
            image: result.image.small_url
          }));
          setVolumes(formattedData);
  }})
      .catch(error => console.error('Error fetching data:', error));
  }, []);


  return (
    <div className="container">
      <h1 className="text-center">Volumes</h1>
      <div className="row">
        {volumes.map(volume => (
          <div key={volume.id} className="col-md-4 mb-4">
            <div className="card">
              <img src={volume.image} alt={volume.name} className="card-img-top" />
              <div className="card-body">
                <h5 className="card-title">{volume.name}</h5>
                <p className="card-text">Start Year: {volume.start_year}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Main