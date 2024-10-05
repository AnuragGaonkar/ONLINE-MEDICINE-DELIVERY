import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import Login from '../Login/login';

const Navbar = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className=" shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-3xl font-bold text-green-600">
                            MediQuick
                        </Link>
                    </div>

                    {/* Search Bar (visible on all sizes) */}
                    <div className="hidden sm:block flex-grow px-4 lg:ml-6">
                        <div className="relative max-w-lg w-full">
                            <input
                                id="search"
                                name="search"
                                className="block w-full pl-4 pr-12 py-3 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-lg"
                                placeholder="Search for Medicines/Healthcare products"
                                type="search"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                                <button
                                    type="submit"
                                    className="h-full px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items (hidden on mobile) */}
                    <div className="hidden sm:flex items-center space-x-6">
                        <Link onClick={openModal} className="text-gray-700 hover:text-green-500 px-4 py-2 rounded-md text-lg font-medium">
                            Login
                        </Link>
                        <Link to="/offers" className="text-gray-700 hover:text-green-500 px-4 py-2 rounded-md text-lg font-medium">
                            Offers
                        </Link>
                        <Link to="/cart" className="text-gray-700 hover:text-green-500 p-2 rounded-full hover:bg-gray-100">
                            <ShoppingCart className="h-7 w-7" />
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex sm:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-gray-700 hover:text-green-500 focus:outline-none"
                            aria-label="Toggle navigation"
                        >
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Search Box */}
            <div className="block sm:hidden search-box">
                <input type="text" placeholder="Search anything" className="search-input" />
                <a href="#" className="search-btn">
                    <i className="fas fa-search"></i>
                </a>
            </div>

            {/* Mobile Menu (Slider) */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-end">
                    <div className="bg-white w-64 h-full p-6 flex flex-col space-y-6">
                        <button className="self-end text-gray-500" onClick={toggleMenu}>
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        <Link onClick={openModal} className="text-gray-700 hover:text-green-500 text-lg font-medium">
                            Login
                        </Link>
                        <Link to="/offers" className="text-gray-700 hover:text-green-500 text-lg font-medium">
                            Offers
                        </Link>
                        <Link to="/cart" className="text-gray-700 hover:text-green-500 text-lg font-medium">
                            Cart
                        </Link>
                    </div>
                </div>
            )}

            {/* Modal for Login */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-md relative">
                        <button
                            className="absolute top-1 right-3 text-gray-600 hover:text-red-500 cursor-pointer text-3xl font-bold"
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                        <Login />
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
