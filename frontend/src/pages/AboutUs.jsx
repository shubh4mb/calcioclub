import React, { useEffect } from 'react';
import './AboutUs.css';

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      <div className="about-content-wrapper">
        <div className="about-text-section fade-in-up">
          <h1 className="about-title-inline">The Beautiful Game, Elevated.</h1>
          <p className="about-lead">
            <strong>CalcioClub</strong> exists at the intersection of football, fashion, and culture.
          </p>
          <div className="about-divider"></div>
          <p className="about-body-text">
            We transform iconic jerseys into wearable works of art, blending premium craftsmanship with timeless design. Every collection celebrates the history of the beautiful game while pushing football apparel beyond the pitch.
          </p>
          <p className="about-body-text">
            Designed for collectors, supporters, and creatives alike, our pieces are made to be worn with pride—for match day, every day.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
