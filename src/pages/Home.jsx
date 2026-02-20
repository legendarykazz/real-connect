import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Listings from '../components/Listings';
import WhyChooseUs from '../components/WhyChooseUs';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <>
            <Navbar />
            <Hero />
            <Listings />
            <WhyChooseUs />
            <CallToAction />
            <Footer />
        </>
    );
};

export default Home;
